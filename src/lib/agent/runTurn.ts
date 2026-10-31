/**
 * One conversational turn of the agent: a streaming manual tool loop.
 *
 * Why a manual loop and not the SDK tool runner: the tools here are UI
 * actions that execute on the visitor's screen, and the text has to be
 * forwarded to that screen as it streams. The loop therefore (1) streams
 * text deltas out through `emit` as they arrive, (2) validates every tool
 * input itself (eager input streaming turns off server-side validation),
 * (3) synthesizes deterministic tool results, and (4) re-enters until the
 * model stops calling tools or the round cap is hit.
 *
 * The Anthropic client is injected behind a two-method interface so the
 * loop is unit-testable with a fake.
 */
import Anthropic from "@anthropic-ai/sdk";
import { LIMITS, type AgentEvent, type ChatTurn, type PageContext } from "./protocol";
import { TOOL_DEFINITIONS, validateToolInput, describeToolResult } from "./tools";
import { buildStableSystemPrompt, buildVisitorContext } from "./systemPrompt";
import { findTarget } from "./siteIndex";

export type StreamHandle = {
  on(event: "text", listener: (delta: string) => void): unknown;
  finalMessage(): Promise<Anthropic.Beta.BetaMessage>;
};

/** Params of `client.beta.messages.stream` — derived so the name can't drift. */
export type AgentStreamParams = Parameters<Anthropic["beta"]["messages"]["stream"]>[0];

export type AgentClient = {
  stream(params: AgentStreamParams, options?: { signal?: AbortSignal }): StreamHandle;
};

/** Default model per the Claude API reference; override with AGENT_MODEL. */
export const DEFAULT_MODEL = "claude-opus-5-5";

/**
 * Replies are deliberately short (the system prompt caps them at ~80 words)
 * and thinking runs at low effort, so this is headroom, not a target. It
 * bounds the worst-case cost of a single turn.
 */
export const MAX_TOKENS = 4096;

export function createSdkClient(apiKey: string): AgentClient {
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 45_000 });
  return {
    stream: (params, options) => client.beta.messages.stream(params, options),
  };
}

const STABLE_SYSTEM = buildStableSystemPrompt();

export function toMessageParams(turns: ChatTurn[]): Anthropic.Beta.BetaMessageParam[] {
  const trimmed = turns.slice(-LIMITS.maxTurns);
  // The API requires the first message to be from the user.
  const firstUser = trimmed.findIndex((t) => t.role === "user");
  return trimmed.slice(firstUser < 0 ? 0 : firstUser).map((t) => ({
    role: t.role,
    content: t.content.slice(0, LIMITS.maxTurnChars),
  }));
}

export type RunTurnOptions = {
  client: AgentClient;
  model?: string;
  turns: ChatTurn[];
  page: PageContext;
  emit: (e: AgentEvent) => void;
  signal?: AbortSignal;
  maxToolRounds?: number;
};

export async function runAgentTurn(opts: RunTurnOptions): Promise<void> {
  const {
    client,
    model = DEFAULT_MODEL,
    page,
    emit,
    signal,
    maxToolRounds = LIMITS.maxToolRounds,
  } = opts;
  const messages = toMessageParams(opts.turns);
  if (messages.length === 0) {
    emit({ type: "error", code: "bad_request", message: "No user message." });
    return;
  }
  let currentPath = page.path;
  let jsonRetries = 0;

  emit({ type: "trace", step: "reading" });

  for (let round = 0; round <= maxToolRounds; round++) {
    const stream = client.stream(
      {
        model,
        max_tokens: MAX_TOKENS,
        // Server-side refusal fallback (routes by refusal category). The
        // beta header and the "default" scalar form go together.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        // Claude Opus 5.5 always thinks; low effort keeps chat latency and
        // cost down (its default would be medium).
        output_config: { effort: "low" },
        system: [
          { type: "text", text: STABLE_SYSTEM, cache_control: { type: "ephemeral" } },
          { type: "text", text: buildVisitorContext({ ...page, path: currentPath }) },
        ],
        tools: [...TOOL_DEFINITIONS],
        messages,
      },
      { signal },
    );

    let sawText = false;
    stream.on("text", (delta) => {
      if (!sawText) {
        sawText = true;
        emit({ type: "trace", step: "answering" });
      }
      emit({ type: "text", delta });
    });

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await stream.finalMessage();
      jsonRetries = 0;
    } catch (err) {
      // Only the SDK's "tool input was not parseable JSON" case is retried;
      // typed API errors propagate to the route, which reports them.
      if (err instanceof Anthropic.APIError || jsonRetries++ >= 1) throw err;
      emit({ type: "trace", step: "retrying" });
      continue;
    }

    const toolUses = message.content.filter(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
    );

    if (message.stop_reason === "refusal") {
      emit({ type: "done", reason: "refusal", model: message.model });
      return;
    }
    if (message.stop_reason === "max_tokens") {
      // A truncated tool input can still parse as a valid object — never run it.
      emit({ type: "done", reason: "max_tokens", model: message.model });
      return;
    }
    if (toolUses.length === 0 || message.stop_reason !== "tool_use") {
      emit({ type: "done", reason: "end_turn", model: message.model });
      return;
    }

    emit({ type: "trace", step: "acting" });
    messages.push({ role: "assistant", content: message.content });

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const v = validateToolInput(tu.name, tu.input);
      if (!v.ok) {
        results.push({ type: "tool_result", tool_use_id: tu.id, is_error: true, content: v.error });
        continue;
      }
      if (v.tool.name === "suggest_questions") {
        emit({ type: "suggest", questions: v.tool.questions });
      } else {
        emit({ type: "tool", id: tu.id, tool: v.tool });
      }
      results.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: describeToolResult(v.tool, currentPath),
      });
      if (v.tool.name === "go_to") {
        const t = findTarget(v.tool.target);
        if (t && t.path !== currentPath) currentPath = t.path;
      }
    }
    messages.push({ role: "user", content: results });
  }

  emit({ type: "done", reason: "tool_limit" });
}
