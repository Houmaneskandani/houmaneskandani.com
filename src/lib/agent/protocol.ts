/**
 * Wire protocol between the Orbit UI and /api/agent.
 *
 * The route streams newline-delimited JSON events (served as
 * text/event-stream `data:` lines). Everything the character does on
 * screen — flying to a section, highlighting a row, copying the email —
 * is driven by `tool` events the model emitted; the text it says is the
 * concatenation of `text` deltas.
 */

export const TOOL_NAMES = [
  "go_to",
  "spotlight",
  "open_link",
  "copy_email",
  "suggest_questions",
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export const LINK_KEYS = [
  "github",
  "linkedin",
  "resume",
  "applyagent_repo",
  "trading_console",
] as const;
export type LinkKey = (typeof LINK_KEYS)[number];

export type ToolInput =
  | { name: "go_to"; target: string }
  | { name: "spotlight"; target: string }
  | { name: "open_link"; link: LinkKey }
  | { name: "copy_email" }
  | { name: "suggest_questions"; questions: string[] };

export type AgentEvent =
  | { type: "trace"; step: string }
  | { type: "text"; delta: string }
  | { type: "tool"; id: string; tool: ToolInput }
  | { type: "suggest"; questions: string[] }
  | {
      type: "done";
      reason: "end_turn" | "max_tokens" | "refusal" | "tool_limit";
      /** Which model actually served the turn (fallbacks can change it). */
      model?: string;
    }
  | {
      type: "error";
      code: "no_key" | "rate_limited" | "upstream" | "bad_request";
      message: string;
      retryAfterSec?: number;
    };

/** One turn of chat history as the client keeps it (text only). */
export type ChatTurn = { role: "user" | "assistant"; content: string };

/** What the client tells the server about where the visitor is. */
export type PageContext = {
  /** Current pathname, e.g. "/" or "/lab/diamond-hand". */
  path: string;
  /** Target ids currently in the viewport (see siteIndex), most visible first. */
  visible?: string[];
};

export type AgentRequestBody = {
  messages: ChatTurn[];
  page: PageContext;
};

/** Limits enforced server-side; mirrored client-side so the UI can pre-trim. */
export const LIMITS = {
  maxTurns: 12,
  maxTurnChars: 600,
  maxToolRounds: 4,
} as const;

export function encodeEvent(e: AgentEvent): string {
  return `data: ${JSON.stringify(e)}\n\n`;
}

/**
 * Incremental SSE parser for the client. Feed it decoded chunks; it yields
 * complete events and keeps any partial trailing line for the next chunk.
 */
export function createEventParser() {
  let buffer = "";
  return (chunk: string): AgentEvent[] => {
    buffer += chunk;
    const out: AgentEvent[] = [];
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw) continue;
        try {
          out.push(JSON.parse(raw) as AgentEvent);
        } catch {
          // A malformed frame is dropped rather than killing the stream.
        }
      }
    }
    return out;
  };
}
