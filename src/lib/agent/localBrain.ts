/**
 * Orbit's offline brain.
 *
 * Used when the API route can't serve: no ANTHROPIC_API_KEY on the deploy,
 * the visitor hit the rate limit, or the upstream errored. It is a small
 * intent matcher over the same site index the model uses, so the character
 * still answers the common questions and still moves around the page —
 * nothing on the site ever feels dead.
 */
import { SITE, PROJECTS, SIDE_PROJECTS, CAPABILITIES, EXPERIENCE, EDUCATION } from "@/lib/data";
import type { ToolInput } from "./protocol";

export type LocalReply = {
  text: string;
  tools: ToolInput[];
  suggestions: string[];
};

type Intent = {
  test: RegExp;
  reply: (q: string) => LocalReply;
};

const first = (s: string) => s.split(" ")[0];

function project(slug: string) {
  return PROJECTS.find((p) => p.slug === slug)!;
}
function side(nameStart: string) {
  return SIDE_PROJECTS.find((s) => s.name.toLowerCase().startsWith(nameStart))!;
}

const INTENTS: Intent[] = [
  {
    test: /^(hi|hey|hello|yo|hola|salut|sup)\b/i,
    reply: () => ({
      text: `Hi! I'm ${first(SITE.name)}'s site agent. Ask me about his work, his side projects, or how to reach him — I'll take you there.`,
      tools: [],
      suggestions: ["What does he do at The Vport?", "Show me the AI projects", "How do I contact him?"],
    }),
  },
  {
    test: /\b(idemia|card|bank|pci)\b/i,
    reply: () => {
      const p = project("card-personalization-platform");
      return {
        text: `At IDEMIA (${EXPERIENCE[1].period}) he worked on the card-personalization platform that issues physical cards for tier-1 U.S. banks, under PCI-DSS. ${p.outcome}`,
        tools: [{ name: "go_to", target: "project:card-personalization-platform" }],
        suggestions: ["What was hard about it?", "What did he do before IDEMIA?", "What does he do now?"],
      };
    },
  },
  {
    test: /\b(vport|now|current(ly)?|today|graphql|vr|concert)\b/i,
    reply: () => {
      const p = project("vport-platform");
      return {
        text: `Right now he's at The Vport, a VR concert-streaming platform, doing backend and platform engineering on the GraphQL platform: ${p.approach?.map((a) => a.heading.toLowerCase()).join(", ")}.`,
        tools: [{ name: "go_to", target: "project:vport-platform" }],
        suggestions: ["Read the Vport case study", "What's his stack?", "What does he build on the side?"],
      };
    },
  },
  {
    test: /\b(spotlist|marketplace|django|first (backend )?hire|lead)\b/i,
    reply: () => ({
      text: `Spotlist was an early-stage mobile marketplace where he joined as the first backend hire and became lead backend engineer: auth, Stripe payments, geo search, and the API behind the React app.`,
      tools: [{ name: "go_to", target: "project:spotlist-marketplace" }],
      suggestions: ["What did he build there?", "Where did he go next?", "Show me his experience"],
    }),
  },
  {
    test: /\b(applyagent|apply agent|job application|playwright)\b/i,
    reply: () => {
      const p = project("applyagent");
      return {
        text: `ApplyAgent is his open-source agent that fills out real job applications: Claude reads the live form DOM and Playwright does the clicking, across Greenhouse, Lever and custom ATSes. ${p.outcome}`,
        tools: [{ name: "go_to", target: "project:applyagent" }],
        suggestions: ["Open the ApplyAgent repo", "What other AI projects?", "How does the scorer work?"],
      };
    },
  },
  {
    test: /\b(diamond|trading|crypto|trade|bot)\b/i,
    reply: () => {
      const s = side("diamond");
      return {
        text: `Diamond Hand is a live, fully automated crypto trading system he built: several strategies share one risk budget, every signal gets a second-opinion validation layer, and closed trades are graded to tighten the rules. ${s.metrics?.[0]?.value} win rate on the latest paper run.`,
        tools: [{ name: "go_to", target: "page:lab-diamond-hand" }],
        suggestions: ["How does it manage risk?", "Open the live console", "What else is in the lab?"],
      };
    },
  },
  {
    test: /\b(matchyard|ios|swift|sports|workout)\b/i,
    reply: () => ({
      text: `MatchYard is a native SwiftUI iOS app plus a TypeScript/PostGIS backend for finding sports partners nearby, with first-party auth, geospatial discovery and AI-assisted matchmaking. ${side("matchyard").status}.`,
      tools: [{ name: "go_to", target: "page:lab-matchyard" }],
      suggestions: ["How does the auth work?", "Show me the other side projects"],
    }),
  },
  {
    test: /\b(glasses|even|g2|wearable|heads-up|hud)\b/i,
    reply: () => ({
      text: `The Even G2 suite is a set of voice-driven AI apps for Even Realities smart glasses: reminders, document Q&A and live conversation suggestions, on a six-line monochrome display. Shipped to a physical device.`,
      tools: [{ name: "go_to", target: "page:lab-even-g2" }],
      suggestions: ["What was the hard part?", "Show me the other side projects"],
    }),
  },
  {
    test: /\b(marketing|paperclip|crm|clinic|medical|multi-?tenant)\b/i,
    reply: () => ({
      text: `The Marketing Agent is a multi-tenant marketing and CRM SaaS for medical practices, rebuilt as nine cooperating AI agents, with per-practice isolation enforced at the data and API layers. Pre-launch, first practice onboarding.`,
      tools: [{ name: "go_to", target: "page:lab-marketing-agent" }],
      suggestions: ["How is tenant isolation done?", "Show me the other side projects"],
    }),
  },
  {
    test: /\b(ai|agent|agents|side project|lab|llm|claude)\b/i,
    reply: () => ({
      text: `On the side he builds AI agents: ${SIDE_PROJECTS.map((s) => s.name).join(", ")}. The side-projects page has a case study for each.`,
      tools: [{ name: "go_to", target: "page:lab" }],
      suggestions: ["Tell me about Diamond Hand", "What is ApplyAgent?", "What are the smart-glasses apps?"],
    }),
  },
  {
    test: /\b(contact|email|reach|hire|talk|message|get in touch)\b/i,
    reply: () => ({
      text: `Easiest is email: ${SITE.email} — I've copied it for you. GitHub and LinkedIn are in the contact section too.`,
      tools: [{ name: "copy_email" }, { name: "go_to", target: "section:contact" }],
      suggestions: ["Open his LinkedIn", "Open his GitHub", "Where is he based?"],
    }),
  },
  {
    test: /\b(resume|résumé|cv)\b/i,
    reply: () => ({
      text: `There's a one-page résumé PDF in the contact section. Want me to open it?`,
      tools: [{ name: "go_to", target: "section:contact" }],
      suggestions: ["Yes, open the résumé", "What's his experience?"],
    }),
  },
  {
    test: /\b(yes,? open the r[ée]sum[ée]|open (the )?(resume|résumé|cv))/i,
    reply: () => ({
      text: `Opening the résumé in a new tab.`,
      tools: [{ name: "open_link", link: "resume" }],
      suggestions: ["How do I contact him?"],
    }),
  },
  {
    test: /\bopen (his |the )?linkedin\b/i,
    reply: () => ({ text: "Opening LinkedIn.", tools: [{ name: "open_link", link: "linkedin" }], suggestions: [] }),
  },
  {
    test: /\bopen (his |the )?(github|repo)\b/i,
    reply: () => ({ text: "Opening GitHub.", tools: [{ name: "open_link", link: "github" }], suggestions: [] }),
  },
  {
    test: /\b(open|show) (the )?(live )?console\b/i,
    reply: () => ({ text: "Opening the live trading console.", tools: [{ name: "open_link", link: "trading_console" }], suggestions: [] }),
  },
  {
    test: /\b(skills?|stack|languages?|capabilit|tools?|tech|kubernetes|go\b|python|java)\b/i,
    reply: () => ({
      text: `Mainly ${CAPABILITIES[0].items.slice(0, 4).join(", ")}; ${CAPABILITIES[1].items.slice(0, 3).join(", ")} on the backend; ${CAPABILITIES[3].items.slice(0, 3).join(", ")} for infra; and ${CAPABILITIES[4].items.slice(0, 3).join(", ")} on the security side.`,
      tools: [{ name: "go_to", target: "section:capabilities" }],
      suggestions: ["Where has he used Go?", "Show me his work"],
    }),
  },
  {
    test: /\b(where|based|location|live|city|remote|irvine|california)\b/i,
    reply: () => ({
      text: `He's based in ${SITE.location.split(" · ")[0]} and works remote-friendly.`,
      tools: [{ name: "spotlight", target: "section:contact" }],
      suggestions: ["How do I contact him?", "What does he do now?"],
    }),
  },
  {
    test: /\b(school|degree|study|studied|education|university|college|ucr)\b/i,
    reply: () => ({
      text: `${EDUCATION[0].degree} from ${EDUCATION[0].school} (${EDUCATION[0].period}), after an ${EDUCATION[1].degree} at ${EDUCATION[1].school}.`,
      tools: [{ name: "go_to", target: "section:about" }],
      suggestions: ["What's his experience?", "What does he do now?"],
    }),
  },
  {
    test: /\b(experience|history|background|career|worked|jobs?|timeline|years?)\b/i,
    reply: () => ({
      text: `${EXPERIENCE.map((e) => `${e.company} (${e.period.replace(" — ", "–")})`).join(", ")}. About five years in backend, most of it on high-security, multi-tenant APIs.`,
      tools: [{ name: "go_to", target: "section:about" }],
      suggestions: ["What did he do at IDEMIA?", "What does he do now?"],
    }),
  },
  {
    test: /\b(who|about|houman|intro|yourself|what (do|does))\b/i,
    reply: () => ({
      text: `${SITE.name} is a ${SITE.role.toLowerCase()} in ${SITE.location.split(" · ")[0]}: currently at The Vport, three years at IDEMIA before that, and building AI agents on the side.`,
      tools: [{ name: "go_to", target: "section:about" }],
      suggestions: ["Show me his work", "What are the AI projects?", "How do I contact him?"],
    }),
  },
  {
    test: /\b(work|projects?|portfolio|case stud)/i,
    reply: () => ({
      text: `The selected work covers ${PROJECTS.map((p) => p.title.split(" — ")[0]).join("; ")}. Hover a row for a preview, or ask me about any of them.`,
      tools: [{ name: "go_to", target: "section:work" }],
      suggestions: ["Tell me about IDEMIA", "What is Diamond Hand?", "What's at The Vport?"],
    }),
  },
];

export function localReply(question: string): LocalReply {
  const q = question.trim();
  for (const intent of INTENTS) {
    if (intent.test.test(q)) return intent.reply(q);
  }
  return {
    text: `I can answer questions about ${first(SITE.name)}'s work, projects, skills and how to reach him. Try one of these, or ask in your own words.`,
    tools: [],
    suggestions: ["What does he do now?", "Show me the AI projects", "How do I contact him?"],
  };
}
