/**
 * What Orbit says on its own while the visitor browses. Keyed by target id
 * (sections / rows) or by pathname prefix. Short, specific, never salesy.
 * Delivery is rate-limited in useSiteObserver, so these can be a little
 * generous — the visitor will only ever hear a handful.
 */
export const SECTION_REMARKS: Record<string, string> = {
  "section:about":
    "The short version of five years in backend. The timeline underneath has the dates.",
  "section:work":
    "Five case studies. Hover a row for the gist, or ask me which one is the most interesting.",
  "section:capabilities":
    "The stack. Everything here shows up in at least one case study — no padding.",
  "section:contact":
    "The email copies on click. No forms, no newsletter. That's it.",
};

export const PATH_REMARKS: Array<{ test: (path: string) => boolean; text: string }> = [
  {
    test: (p) => p === "/lab",
    text: "Things built on his own time. Diamond Hand is live right now; ApplyAgent is open source.",
  },
  {
    test: (p) => p === "/lab/diamond-hand",
    text: "This one runs 24/7 with hard risk limits. Ask me how the circuit breaker works.",
  },
  {
    test: (p) => p === "/lab/even-g2",
    text: "Reasoning models on a six-line monochrome display. The constraint is the whole story.",
  },
  {
    test: (p) => p === "/lab/matchyard",
    text: "Native iOS plus a first-party backend — auth from scratch, PostGIS for the geo queries.",
  },
  {
    test: (p) => p === "/lab/marketing-agent",
    text: "Nine agents, one CRM, strict per-practice isolation. Ask me how tenants are sealed off.",
  },
  {
    test: (p) => p.startsWith("/work/"),
    text: "Case study: the context, the problem, how he approached it, and what came out.",
  },
];

export function hoverRemark(label: string): string {
  return `Want the short version of ${label.split(" — ")[0]}? Just ask.`;
}

export const SESSION_REMARK_CAP = 5;
export const REMARK_COOLDOWN_MS = 28_000;
export const DWELL_MS = 2_400;
