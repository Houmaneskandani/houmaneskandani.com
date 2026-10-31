import { describe, it, expect } from "vitest";
import { createEventParser, encodeEvent, type AgentEvent } from "./protocol";
import { RateLimiter, clientKey } from "./rateLimit";
import { TARGETS, TARGET_IDS, findTarget, buildDossier, experienceTargetId, sideTargetId } from "./siteIndex";
import { TOOL_DEFINITIONS, validateToolInput, describeToolResult } from "./tools";
import { localReply } from "./localBrain";
import { buildStableSystemPrompt, buildVisitorContext } from "./systemPrompt";
import { runAgentTurn, toMessageParams, type AgentClient, type StreamHandle } from "./runTurn";
import { EXPERIENCE, SIDE_PROJECTS, PROJECTS } from "@/lib/data";

// ── protocol ──────────────────────────────────────────────────────────

describe("SSE protocol", () => {
  it("round-trips events through the incremental parser, across chunk boundaries", () => {
    const events: AgentEvent[] = [
      { type: "trace", step: "reading" },
      { type: "text", delta: "Hello, " },
      { type: "tool", id: "t1", tool: { name: "go_to", target: "section:work" } },
      { type: "done", reason: "end_turn", model: "x" },
    ];
    const wire = events.map(encodeEvent).join("");
    const parse = createEventParser();
    const out: AgentEvent[] = [];
    // Feed in awkward 7-byte chunks to exercise buffering.
    for (let i = 0; i < wire.length; i += 7) out.push(...parse(wire.slice(i, i + 7)));
    expect(out).toEqual(events);
  });

  it("drops malformed frames without losing the next one", () => {
    const parse = createEventParser();
    const out = parse(`data: {not json}\n\n${encodeEvent({ type: "text", delta: "ok" })}`);
    expect(out).toEqual([{ type: "text", delta: "ok" }]);
  });
});

// ── rate limiting ─────────────────────────────────────────────────────

describe("RateLimiter", () => {
  it("allows a burst, then refills over time", () => {
    const rl = new RateLimiter({ burst: 3, perMinute: 2, dailyCap: 100 });
    const t0 = Date.parse("2026-10-05T10:00:00Z");
    expect(rl.check("a", t0).ok).toBe(true);
    expect(rl.check("a", t0).ok).toBe(true);
    expect(rl.check("a", t0).ok).toBe(true);
    const blocked = rl.check("a", t0);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBe(30); // 1 token at 2/min
    // 30s later one token has refilled.
    expect(rl.check("a", t0 + 30_000).ok).toBe(true);
    // Another visitor is unaffected.
    expect(rl.check("b", t0).ok).toBe(true);
  });

  it("enforces the global daily cap and resets at UTC midnight", () => {
    const rl = new RateLimiter({ burst: 10, perMinute: 10, dailyCap: 2 });
    const t0 = Date.parse("2026-10-05T23:59:00Z");
    expect(rl.check("a", t0).ok).toBe(true);
    expect(rl.check("b", t0).ok).toBe(true);
    const r = rl.check("c", t0);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("daily");
      expect(r.retryAfterSec).toBe(60);
    }
    expect(rl.check("c", Date.parse("2026-10-06T00:00:01Z")).ok).toBe(true);
  });

  it("dailyCap 0 disables the agent", () => {
    const rl = new RateLimiter({ dailyCap: 0 });
    expect(rl.check("a").ok).toBe(false);
  });

  it("reads the first forwarded address", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientKey(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});

// ── site index ────────────────────────────────────────────────────────

describe("site index", () => {
  it("has a target for every project, side project and experience row, with unique ids", () => {
    for (const p of PROJECTS) expect(findTarget(`project:${p.slug}`)).toBeDefined();
    for (const s of SIDE_PROJECTS) expect(findTarget(sideTargetId(s.name))).toBeDefined();
    for (const e of EXPERIENCE) expect(findTarget(experienceTargetId(e))).toBeDefined();
    expect(new Set(TARGET_IDS).size).toBe(TARGETS.length);
  });

  it("builds a deterministic dossier that mentions every project", () => {
    const d1 = buildDossier();
    const d2 = buildDossier();
    expect(d1).toBe(d2); // byte-identical → cacheable prefix
    for (const p of PROJECTS) expect(d1).toContain(p.title);
    for (const s of SIDE_PROJECTS) expect(d1).toContain(s.name);
    expect(d1).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // no timestamps
  });

  it("system prompt is stable and the visitor context is separate", () => {
    expect(buildStableSystemPrompt()).toBe(buildStableSystemPrompt());
    const ctx = buildVisitorContext({ path: "/lab", visible: ["section:work", "nope"] });
    expect(ctx).toContain("/lab");
    expect(ctx).toContain("section:work");
    expect(ctx).not.toContain("nope");
  });
});

// ── tools ─────────────────────────────────────────────────────────────

describe("tools", () => {
  it("every definition is strict with additionalProperties:false and eager streaming", () => {
    for (const t of TOOL_DEFINITIONS) {
      expect(t.strict).toBe(true);
      expect(t.eager_input_streaming).toBe(true);
      expect(t.input_schema.additionalProperties).toBe(false);
    }
  });

  it("validates inputs against the site index", () => {
    expect(validateToolInput("go_to", { target: "section:work" })).toEqual({
      ok: true,
      tool: { name: "go_to", target: "section:work" },
    });
    const bad = validateToolInput("go_to", { target: "section:nope" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toContain("section:work"); // lists valid targets
    expect(validateToolInput("open_link", { link: "github" }).ok).toBe(true);
    expect(validateToolInput("open_link", { link: "evil" }).ok).toBe(false);
    expect(validateToolInput("copy_email", {}).ok).toBe(true);
    expect(validateToolInput("suggest_questions", { questions: ["a", "b", "c", "d"] }).ok).toBe(false);
    expect(validateToolInput("suggest_questions", { questions: ["What now?"] }).ok).toBe(true);
    expect(validateToolInput("rm_rf", {}).ok).toBe(false);
  });

  it("describes cross-page navigation differently from same-page", () => {
    expect(describeToolResult({ name: "go_to", target: "page:lab" }, "/")).toMatch(/Navigating.*\/lab/);
    expect(describeToolResult({ name: "go_to", target: "section:work" }, "/")).toMatch(/highlighted/);
  });
});

// ── offline brain ─────────────────────────────────────────────────────

describe("local brain", () => {
  it("answers the common questions with an action", () => {
    expect(localReply("What did he do at IDEMIA?").tools[0]).toEqual({
      name: "go_to",
      target: "project:card-personalization-platform",
    });
    expect(localReply("how can I contact him").tools.map((t) => t.name)).toEqual(["copy_email", "go_to"]);
    expect(localReply("tell me about diamond hand").tools[0]).toEqual({ name: "go_to", target: "page:lab-diamond-hand" });
    expect(localReply("what's his stack?").text).toMatch(/Go/);
  });

  it("every tool it emits points at a real target", () => {
    const qs = ["hi", "idemia", "vport", "spotlist", "applyagent", "diamond hand", "matchyard", "glasses", "marketing agent", "ai projects", "contact", "resume", "skills", "where is he", "education", "experience", "who is houman", "show me his work", "zzz unknown"];
    for (const q of qs) {
      for (const t of localReply(q).tools) {
        if (t.name === "go_to" || t.name === "spotlight") expect(findTarget(t.target), `${q} → ${t.target}`).toBeDefined();
      }
    }
  });
});

// ── the loop ──────────────────────────────────────────────────────────

type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown };

/** A fake client that plays back scripted turns and records the requests. */
function fakeClient(turns: Array<{ blocks: Block[]; stop: string }>) {
  const requests: unknown[] = [];
  let i = 0;
  const client: AgentClient = {
    stream(params) {
      requests.push(params);
      const turn = turns[Math.min(i++, turns.length - 1)];
      const listeners: Array<(d: string) => void> = [];
      const handle: StreamHandle = {
        on(_e, cb) {
          listeners.push(cb);
          return handle;
        },
        async finalMessage() {
          for (const b of turn.blocks) if (b.type === "text") listeners.forEach((l) => l(b.text));
          return {
            id: "msg",
            type: "message",
            role: "assistant",
            model: "claude-opus-5-5",
            content: turn.blocks as never,
            stop_reason: turn.stop as never,
            stop_sequence: null,
            usage: { input_tokens: 1, output_tokens: 1 } as never,
            container: null,
            context_management: null,
            stop_details: null,
          } as never;
        },
      };
      return handle;
    },
  };
  return { client, requests };
}

describe("runAgentTurn", () => {
  const page = { path: "/", visible: ["section:work"] };

  it("streams text and finishes on end_turn", async () => {
    const { client, requests } = fakeClient([{ blocks: [{ type: "text", text: "Hi there." }], stop: "end_turn" }]);
    const events: AgentEvent[] = [];
    await runAgentTurn({ client, turns: [{ role: "user", content: "hi" }], page, emit: (e) => events.push(e) });
    expect(events.map((e) => e.type)).toEqual(["trace", "trace", "text", "done"]);
    expect(events.at(-1)).toEqual({ type: "done", reason: "end_turn", model: "claude-opus-5-5" });
    const req = requests[0] as { model: string; fallbacks: unknown; betas: string[]; system: Array<{ cache_control?: unknown }>; tools: unknown[] };
    expect(req.model).toBe("claude-opus-5-5");
    expect(req.fallbacks).toBe("default");
    expect(req.betas).toContain("server-side-fallback-2026-07-01");
    expect(req.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(req.system[1].cache_control).toBeUndefined();
    expect(req.tools).toHaveLength(TOOL_DEFINITIONS.length);
  });

  it("executes a valid tool, feeds the result back, and loops once", async () => {
    const { client, requests } = fakeClient([
      {
        blocks: [
          { type: "text", text: "Let me show you. " },
          { type: "tool_use", id: "tu1", name: "go_to", input: { target: "project:applyagent" } },
          { type: "tool_use", id: "tu2", name: "suggest_questions", input: { questions: ["More?"] } },
        ],
        stop: "tool_use",
      },
      { blocks: [{ type: "text", text: "ApplyAgent fills out job applications." }], stop: "end_turn" },
    ]);
    const events: AgentEvent[] = [];
    await runAgentTurn({ client, turns: [{ role: "user", content: "applyagent?" }], page, emit: (e) => events.push(e) });
    expect(events).toContainEqual({ type: "tool", id: "tu1", tool: { name: "go_to", target: "project:applyagent" } });
    expect(events).toContainEqual({ type: "suggest", questions: ["More?"] });
    expect(events.at(-1)).toMatchObject({ type: "done", reason: "end_turn" });
    // Second request carries the assistant turn + both tool results.
    const second = requests[1] as { messages: Array<{ role: string; content: unknown }> };
    expect(second.messages).toHaveLength(3);
    expect(second.messages[1].role).toBe("assistant");
    const results = second.messages[2].content as Array<{ type: string; tool_use_id: string; is_error?: boolean }>;
    expect(results.map((r) => r.tool_use_id)).toEqual(["tu1", "tu2"]);
    expect(results.every((r) => r.type === "tool_result" && !r.is_error)).toBe(true);
  });

  it("returns is_error for an invalid target without emitting a tool event", async () => {
    const { client, requests } = fakeClient([
      { blocks: [{ type: "tool_use", id: "tu1", name: "go_to", input: { target: "section:bogus" } }], stop: "tool_use" },
      { blocks: [{ type: "text", text: "Sorry." }], stop: "end_turn" },
    ]);
    const events: AgentEvent[] = [];
    await runAgentTurn({ client, turns: [{ role: "user", content: "x" }], page, emit: (e) => events.push(e) });
    expect(events.some((e) => e.type === "tool")).toBe(false);
    const second = requests[1] as { messages: Array<{ content: Array<{ is_error?: boolean; content: string }> }> };
    expect(second.messages[2].content[0].is_error).toBe(true);
    expect(second.messages[2].content[0].content).toContain("section:work");
  });

  it("never runs tools on max_tokens or refusal", async () => {
    for (const stop of ["max_tokens", "refusal"] as const) {
      const { client, requests } = fakeClient([
        { blocks: [{ type: "tool_use", id: "tu1", name: "copy_email", input: {} }], stop },
      ]);
      const events: AgentEvent[] = [];
      await runAgentTurn({ client, turns: [{ role: "user", content: "x" }], page, emit: (e) => events.push(e) });
      expect(events.some((e) => e.type === "tool")).toBe(false);
      expect(events.at(-1)).toMatchObject({ type: "done", reason: stop });
      expect(requests).toHaveLength(1);
    }
  });

  it("stops after the round cap", async () => {
    const { client, requests } = fakeClient([
      { blocks: [{ type: "tool_use", id: "tu", name: "copy_email", input: {} }], stop: "tool_use" },
    ]);
    const events: AgentEvent[] = [];
    await runAgentTurn({ client, turns: [{ role: "user", content: "x" }], page, emit: (e) => events.push(e), maxToolRounds: 2 });
    expect(requests).toHaveLength(3);
    expect(events.at(-1)).toEqual({ type: "done", reason: "tool_limit" });
  });

  it("trims history to the limits and starts with a user turn", () => {
    const turns = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? "assistant" : "user") as "user" | "assistant",
      content: "x".repeat(1000),
    }));
    const out = toMessageParams(turns);
    expect(out.length).toBeLessThanOrEqual(12);
    expect(out[0].role).toBe("user");
    expect((out[0].content as string).length).toBe(600);
  });
});
