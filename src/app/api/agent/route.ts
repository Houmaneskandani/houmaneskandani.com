/**
 * POST /api/agent — streams one turn of Orbit (see src/lib/agent/runTurn.ts).
 *
 * Response: text/event-stream of `data: <AgentEvent JSON>` frames.
 * Non-stream responses (JSON, with the same `code` values the client
 * understands):
 *   503 { code: "no_key" }       ANTHROPIC_API_KEY not set on this deploy
 *   429 { code: "rate_limited" } per-visitor or daily cap hit
 *   400 { code: "bad_request" }  body failed validation
 *
 * On any of these the client switches to its offline brain, so the
 * character keeps working; nothing here is user-facing-fatal.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { LIMITS, encodeEvent, type AgentEvent } from "@/lib/agent/protocol";
import { RateLimiter, clientKey } from "@/lib/agent/rateLimit";
import { createSdkClient, runAgentTurn, DEFAULT_MODEL } from "@/lib/agent/runTurn";

export const runtime = "nodejs";
// A turn with a couple of tool rounds can take ~10–20s on a slow day.
export const maxDuration = 60;

const bodySchema = z
  .object({
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().min(1).max(LIMITS.maxTurnChars),
          })
          .strict(),
      )
      .min(1)
      .max(LIMITS.maxTurns),
    page: z
      .object({
        path: z.string().max(200),
        visible: z.array(z.string().max(80)).max(12).optional(),
      })
      .strict(),
  })
  .strict();

const limiter = new RateLimiter({
  burst: 5,
  perMinute: 2,
  dailyCap: Number.parseInt(process.env.AGENT_DAILY_CAP ?? "400", 10) || 0,
});

function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, { code: "bad_request", message: "Body must be JSON." });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return json(400, { code: "bad_request", message: "Invalid request." });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(503, { code: "no_key", message: "Agent is not configured on this deploy." });
  }
  const limit = limiter.check(clientKey(request.headers));
  if (!limit.ok) {
    return json(
      429,
      { code: "rate_limited", message: "Too many requests.", retryAfterSec: limit.retryAfterSec },
      { "retry-after": String(limit.retryAfterSec) },
    );
  }

  const client = createSdkClient(apiKey);
  const model = process.env.AGENT_MODEL || DEFAULT_MODEL;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (e: AgentEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(e)));
        } catch {
          closed = true;
        }
      };
      try {
        await runAgentTurn({
          client,
          model,
          turns: parsed.data.messages,
          page: parsed.data.page,
          emit,
          signal: request.signal,
        });
      } catch (err) {
        // Keep details in the server log; the client only needs a code.
        if (err instanceof Anthropic.AuthenticationError) {
          console.error("[agent] invalid ANTHROPIC_API_KEY");
        } else if (err instanceof Anthropic.RateLimitError) {
          console.error("[agent] upstream rate limit");
        } else if (err instanceof Anthropic.APIError) {
          console.error(`[agent] API error ${err.status}: ${err.message}`);
        } else if (!(err instanceof Error && err.name === "AbortError")) {
          console.error("[agent] turn failed:", err);
        }
        emit({ type: "error", code: "upstream", message: "The agent is unavailable right now." });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed by a client disconnect
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}
