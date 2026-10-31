/**
 * The site, as the agent sees it.
 *
 * Everything here is derived from `src/lib/data.ts`, so adding a project or
 * an experience row automatically teaches Orbit about it and gives it a
 * navigation target. Targets double as DOM anchors: the components render
 * `data-agent-id="<id>"` on the matching element and `id` on sections.
 */
import {
  SITE,
  PROJECTS,
  SIDE_PROJECTS,
  CAPABILITIES,
  EXPERIENCE,
  EDUCATION,
} from "@/lib/data";

export type TargetKind = "section" | "project" | "side" | "experience" | "page";

export type Target = {
  /** Stable id the model uses, e.g. "section:work" or "project:applyagent". */
  id: string;
  kind: TargetKind;
  /** Human label the UI shows in the trace line ("→ Selected Work"). */
  label: string;
  /** Pathname the target lives on. */
  path: string;
  /** CSS selector of the element to fly to / highlight on that page. */
  selector: string;
  /** One-line description for the model. */
  summary: string;
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Target id of an experience row — used by About.tsx to tag the element. */
export function experienceTargetId(e: { company: string; period: string }): string {
  const [m, y] = e.period.split(" ");
  return `experience:${slugify(e.company)}-${slugify(`${m}${y}`)}`;
}

/** Target id of a side-project row — used by /lab to tag the element. */
export function sideTargetId(name: string): string {
  return `side:${slugify(name)}`;
}

export function buildTargets(): Target[] {
  const t: Target[] = [
    {
      id: "section:top",
      kind: "section",
      label: "Top",
      path: "/",
      selector: "#top",
      summary: "The hero at the top of the home page.",
    },
    {
      id: "section:about",
      kind: "section",
      label: "About",
      path: "/",
      selector: "#about",
      summary: "Bio, experience timeline and education.",
    },
    {
      id: "section:work",
      kind: "section",
      label: "Selected Work",
      path: "/",
      selector: "#work",
      summary: "The list of case studies (jobs and flagship personal projects).",
    },
    {
      id: "section:capabilities",
      kind: "section",
      label: "Capabilities",
      path: "/",
      selector: "#capabilities",
      summary: "Languages, backend/API, data, cloud and security skills.",
    },
    {
      id: "section:contact",
      kind: "section",
      label: "Contact",
      path: "/",
      selector: "#contact",
      summary: "Email (click to copy), résumé PDF, GitHub and LinkedIn.",
    },
    {
      id: "page:lab",
      kind: "page",
      label: "Side projects",
      path: "/lab",
      selector: "main",
      summary: "The side-projects index page (/lab).",
    },
  ];

  for (const p of PROJECTS) {
    t.push({
      id: `project:${p.slug}`,
      kind: "project",
      label: p.title,
      path: "/",
      selector: `[data-agent-id="project:${p.slug}"]`,
      summary: `${p.summary} (${p.year}, ${p.role})`,
    });
    const detailPath = p.href ?? `/work/${p.slug}`;
    t.push({
      id: `page:${p.slug}`,
      kind: "page",
      label: `${p.title} — case study`,
      path: detailPath,
      selector: "main",
      summary: `Full case study page for ${p.title}.`,
    });
  }

  for (const s of SIDE_PROJECTS) {
    t.push({
      id: sideTargetId(s.name),
      kind: "side",
      label: s.name,
      path: "/lab",
      selector: `[data-agent-id="${sideTargetId(s.name)}"]`,
      summary: `${s.description} (${s.status ?? "side project"})`,
    });
    if (s.slug) {
      t.push({
        id: `page:lab-${s.slug}`,
        kind: "page",
        label: `${s.name} — case study`,
        path: `/lab/${s.slug}`,
        selector: "main",
        summary: `Full case study page for ${s.name}.`,
      });
    }
  }

  for (const e of EXPERIENCE) {
    const id = experienceTargetId(e);
    t.push({
      id,
      kind: "experience",
      label: `${e.role} at ${e.company}`,
      path: "/",
      selector: `[data-agent-id="${id}"]`,
      summary: `${e.role}, ${e.company}, ${e.period}, ${e.location}.`,
    });
  }

  // Dedupe by id (a side project that is also in PROJECTS, like ApplyAgent,
  // keeps both its work row and its lab row — different elements).
  const seen = new Set<string>();
  return t.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

export const TARGETS: Target[] = buildTargets();
export const TARGET_IDS: string[] = TARGETS.map((t) => t.id);

export function findTarget(id: string): Target | undefined {
  return TARGETS.find((t) => t.id === id);
}

export const LINKS = {
  github: { label: "GitHub", href: SITE.social.github },
  linkedin: { label: "LinkedIn", href: SITE.social.linkedin },
  resume: { label: "Résumé (PDF)", href: SITE.resume },
  applyagent_repo: {
    label: "ApplyAgent on GitHub",
    href: "https://github.com/Houmaneskandani/ApplyAgent",
  },
  trading_console: {
    label: "Diamond Hand live console",
    href: "https://trade.houmaneskandani.com",
  },
} as const;

/**
 * The dossier the model reads. Plain text, deterministic order, no
 * timestamps — it sits in the cached prefix of every request.
 */
export function buildDossier(): string {
  const lines: string[] = [];
  lines.push(`NAME: ${SITE.name} (${SITE.shortName}; initials ${SITE.initials})`);
  lines.push(`ROLE: ${SITE.role}`);
  lines.push(`LOCATION: ${SITE.location}`);
  lines.push(`EMAIL (public, on the site): ${SITE.email}`);
  lines.push(`SITE: ${SITE.url}`);
  lines.push(`GITHUB: ${SITE.social.github}`);
  lines.push(`LINKEDIN: ${SITE.social.linkedin}`);
  lines.push(`TAGLINE: ${SITE.tagline}`);
  if (SITE.currently) lines.push(`CURRENTLY EXPLORING: ${SITE.currently}`);
  lines.push("");

  lines.push("EXPERIENCE (newest first):");
  for (const e of EXPERIENCE) {
    lines.push(`- ${e.period}: ${e.role} at ${e.company} (${e.location})`);
  }
  lines.push("");

  lines.push("EDUCATION:");
  for (const e of EDUCATION) {
    lines.push(`- ${e.period}: ${e.degree}, ${e.school}`);
  }
  lines.push("");

  lines.push("SELECTED WORK (case studies on the home page):");
  for (const p of PROJECTS) {
    lines.push(`## ${p.title} [target id: project:${p.slug}; page: page:${p.slug}]`);
    lines.push(`- ${p.client ? `Where: ${p.client}. ` : ""}Year: ${p.year}. Role: ${p.role}. Stack: ${p.tags.join(", ")}.`);
    lines.push(`- Summary: ${p.summary}`);
    if (p.context) lines.push(`- Context: ${p.context}`);
    if (p.problem) lines.push(`- Problem: ${p.problem}`);
    for (const a of p.approach ?? []) lines.push(`- Approach — ${a.heading}: ${a.body}`);
    if (p.outcome) lines.push(`- Outcome: ${p.outcome}`);
    if (p.metrics) lines.push(`- Numbers: ${p.metrics.map((m) => `${m.value} ${m.label}`).join("; ")}`);
    if (p.external) lines.push(`- Repo: ${p.external}`);
    lines.push("");
  }

  lines.push("SIDE PROJECTS (/lab):");
  for (const s of SIDE_PROJECTS) {
    const id = sideTargetId(s.name);
    lines.push(`## ${s.name} [target id: ${id}${s.slug ? `; page: page:lab-${s.slug}` : ""}]`);
    lines.push(`- Focus: ${s.tag}. Status: ${s.status ?? "n/a"}. ${s.year ? `Year: ${s.year}. ` : ""}${s.role ? `Role: ${s.role}.` : ""}`);
    lines.push(`- Description: ${s.description}`);
    if (s.context) lines.push(`- Context: ${s.context}`);
    if (s.problem) lines.push(`- Problem: ${s.problem}`);
    for (const a of s.approach ?? []) lines.push(`- Approach — ${a.heading}: ${a.body}`);
    if (s.outcome) lines.push(`- Outcome: ${s.outcome}`);
    if (s.metrics) lines.push(`- Numbers: ${s.metrics.map((m) => `${m.value} ${m.label}`).join("; ")}`);
    if (s.external) lines.push(`- Repo: ${s.external}`);
    if (s.liveUrl) lines.push(`- Live: ${s.liveUrl}`);
    lines.push("");
  }

  lines.push("CAPABILITIES:");
  for (const c of CAPABILITIES) lines.push(`- ${c.label}: ${c.items.join(", ")}`);
  lines.push("");

  lines.push("NAVIGATION TARGETS (for go_to / spotlight):");
  for (const t of TARGETS) lines.push(`- ${t.id} — ${t.label} (${t.path}): ${t.summary}`);

  return lines.join("\n");
}
