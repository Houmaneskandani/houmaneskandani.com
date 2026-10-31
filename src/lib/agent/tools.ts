/**
 * Tool definitions for the agent. One source of truth: the JSON Schemas sent
 * to the API and the zod schemas used to validate what comes back are built
 * from the same lists, so they can't drift.
 *
 * All tools are UI actions. They run on the visitor's screen, so the server
 * can't observe their result — it synthesizes a deterministic tool_result
 * after validating the input against the site index (see runTurn.ts).
 */
import { z } from "zod";
import { LINK_KEYS, type ToolInput } from "./protocol";
import { TARGET_IDS, findTarget, LINKS } from "./siteIndex";

const targetDescription =
  "A navigation target id from the NAVIGATION TARGETS list in your instructions " +
  "(e.g. \"section:work\", \"project:applyagent\", \"page:lab-diamond-hand\").";

/** Tool definitions in the exact shape the Messages API expects. Order is
 *  stable (it is part of the cached prompt prefix). */
export const TOOL_DEFINITIONS = [
  {
    name: "go_to",
    description:
      "Move the visitor's view to a section, a case-study row, or another page of this site. " +
      "Call it whenever you are about to talk about something that lives somewhere on the site " +
      "so the visitor can see it while you explain — a project, the experience timeline, the " +
      "contact section, or the side-projects page. The visible character flies there as well. " +
      "Prefer a row target (project:*, side:*, experience:*) over a whole section when the " +
      "question is about one specific thing. Use a page:* target only when the detail page " +
      "has what the visitor asked for (full approach, outcome, numbers).",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        target: { type: "string", enum: TARGET_IDS, description: targetDescription },
      },
      required: ["target"],
      additionalProperties: false,
    },
  },
  {
    name: "spotlight",
    description:
      "Point at an element on the CURRENT page without scrolling the page: the character " +
      "moves next to it and it gets a brief glow. Use it to draw attention to a row or " +
      "section the visitor is already looking at (it is in the VISIBLE list of the visitor " +
      "context). If it is not visible, use go_to instead.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        target: { type: "string", enum: TARGET_IDS, description: targetDescription },
      },
      required: ["target"],
      additionalProperties: false,
    },
  },
  {
    name: "open_link",
    description:
      "Open one of Houman's external links in a new tab. Call it only when the visitor " +
      "explicitly asks to open, see, or go to that link (the résumé, GitHub, LinkedIn, the " +
      "ApplyAgent repository, or the Diamond Hand live console). Never open links unprompted.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        link: { type: "string", enum: [...LINK_KEYS] },
      },
      required: ["link"],
      additionalProperties: false,
    },
  },
  {
    name: "copy_email",
    description:
      "Copy Houman's public email address to the visitor's clipboard. Call it when the " +
      "visitor asks how to contact or email him, or asks for his email.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "suggest_questions",
    description:
      "Offer up to three short follow-up questions as tappable chips under your reply. " +
      "Call it at the end of a reply when there is an obvious next thing to explore. " +
      "Each question must be answerable from your instructions, under 60 characters, " +
      "and phrased from the visitor's point of view.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: { type: "string" },
          description: "1 to 3 follow-up questions.",
        },
      },
      required: ["questions"],
      additionalProperties: false,
    },
  },
] as const;

/** Runtime validation of model-supplied inputs (eager streaming disables
 *  server-side validation, so every input is checked here before use). */
const targetSchema = z
  .string()
  .refine((id) => findTarget(id) !== undefined, { message: "unknown target id" });

export const TOOL_INPUT_SCHEMAS = {
  go_to: z.object({ target: targetSchema }).strict(),
  spotlight: z.object({ target: targetSchema }).strict(),
  open_link: z.object({ link: z.enum(LINK_KEYS) }).strict(),
  copy_email: z.object({}).strict(),
  suggest_questions: z
    .object({
      questions: z.array(z.string().trim().min(1).max(80)).min(1).max(3),
    })
    .strict(),
} as const;

export type ValidatedTool =
  | { ok: true; tool: ToolInput }
  | { ok: false; error: string };

export function validateToolInput(name: string, input: unknown): ValidatedTool {
  switch (name) {
    case "go_to":
    case "spotlight": {
      const r = TOOL_INPUT_SCHEMAS[name].safeParse(input);
      if (!r.success) {
        return {
          ok: false,
          error: `Invalid input for ${name}: ${r.error.issues.map((i) => i.message).join("; ")}. Valid targets: ${TARGET_IDS.join(", ")}`,
        };
      }
      return { ok: true, tool: { name, target: r.data.target } };
    }
    case "open_link": {
      const r = TOOL_INPUT_SCHEMAS.open_link.safeParse(input);
      if (!r.success) {
        return { ok: false, error: `Invalid link. Valid links: ${LINK_KEYS.join(", ")}` };
      }
      return { ok: true, tool: { name, link: r.data.link } };
    }
    case "copy_email":
      return { ok: true, tool: { name } };
    case "suggest_questions": {
      const r = TOOL_INPUT_SCHEMAS.suggest_questions.safeParse(input);
      if (!r.success) {
        return { ok: false, error: "Provide 1 to 3 short questions (strings under 80 chars)." };
      }
      return { ok: true, tool: { name, questions: r.data.questions } };
    }
    default:
      return { ok: false, error: `Unknown tool ${name}` };
  }
}

/** What the model is told happened. Deterministic: the UI will do exactly this. */
export function describeToolResult(tool: ToolInput, currentPath: string): string {
  switch (tool.name) {
    case "go_to": {
      const t = findTarget(tool.target)!;
      if (t.path !== currentPath) {
        return `Navigating the visitor to ${t.path} (${t.label}). The page is changing; continue your answer — they can read it there.`;
      }
      return `The visitor's view is now on ${t.label}; the character is next to it and it is highlighted.`;
    }
    case "spotlight": {
      const t = findTarget(tool.target)!;
      return `${t.label} is highlighted and the character is pointing at it.`;
    }
    case "open_link":
      return `${LINKS[tool.link].label} opened in a new tab (${LINKS[tool.link].href}).`;
    case "copy_email":
      return "The email address is on the visitor's clipboard now.";
    case "suggest_questions":
      return `Showing ${tool.questions.length} follow-up chip(s).`;
  }
}
