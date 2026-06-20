export const SITE = {
  name: "Houman Eskandani",
  shortName: "Houman",
  initials: "HSK",
  role: "Backend & Cloud Platform Engineer",
  shortRole: "Backend Engineer",
  tagline:
    "Currently at The Vport, working on the GraphQL platform. Three years before that at IDEMIA on a card-personalization platform serving tier-1 U.S. banks. On the side I'm building AI agents — most recently ApplyAgent, an autonomous job-application bot powered by Claude.",
  email: "eskandanihouman@gmail.com",
  location: "Irvine, CA · Remote-friendly",
  domain: "houmaneskandani.com",
  url: "https://houmaneskandani.com",
  resume: "/houman-eskandani-resume.pdf",
  social: {
    github: "https://github.com/Houmaneskandani",
    linkedin:
      "https://www.linkedin.com/in/houman-eskandani-347b2016b/",
  },
};

export type ProjectSection = {
  heading: string;
  body: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  client?: string;
  year: string;
  role: string;
  tags: string[];
  summary: string;
  href?: string;
  external?: string;
  accent: string;
  context?: string;
  problem?: string;
  approach?: ProjectSection[];
  outcome?: string;
  metrics?: { value: string; label: string }[];
};

export const PROJECTS: Project[] = [
  {
    id: "01",
    slug: "vport-platform",
    title: "Platform engineering at The Vport",
    client: "The Vport",
    year: "2025 — present",
    role: "Backend / Platform Engineer",
    tags: ["Go", "GraphQL", "Kubernetes", "Postgres"],
    summary:
      "Backend platform engineering behind a VR live-music streaming product — APIs, security, operations, and the foundations a small team needs to keep shipping.",
    accent: "#c8ff00",
    context:
      "The Vport runs a VR concert streaming platform — global live music events with on-demand playback and real-time analytics. When I joined, they needed a backend that could scale with the product and an operational footprint a small team could actually run, without standing up a dedicated SRE function.",
    problem:
      "Security, operational, and platform concerns were spread across multiple layers and had grown organically. The work was to consolidate guarantees in fewer places so the team can keep shipping without firefighting.",
    approach: [
      {
        heading: "Backend architecture & security model",
        body: "Consolidated the platform's authorization and isolation responsibilities into fewer, well-defined layers — so guarantees can't drift as the codebase grows and new engineers join.",
      },
      {
        heading: "Operational tooling & observability",
        body: "Built the structured logging, request-level tracing, and dashboards the team trusts to run the platform day-to-day — and to find the root cause of an incident in minutes, not hours.",
      },
      {
        heading: "Platform foundations",
        body: "Set up the infrastructure backbone — repeatable deploys, healthy CI, and clean separation between environments — so engineers ship features instead of fighting the platform.",
      },
    ],
    outcome:
      "A backend that's easier to reason about, easier to operate, and easier to extend — without growing the team to do it.",
    metrics: [
      { value: "Consolidated", label: "security model" },
      { value: "Small team", label: "operations" },
      { value: "Production", label: "reliability" },
    ],
  },
  {
    id: "02",
    slug: "diamond-hand",
    title: "Diamond Hand — autonomous crypto trading system",
    client: "Personal project",
    year: "2025 — present",
    role: "Solo build",
    tags: ["Quantitative", "Live execution", "Risk management"],
    summary:
      "A live, fully-automated crypto trading system that watches the market 24/7 and learns from its own outcomes. Multi-strategy, risk-budgeted, and built like production software.",
    accent: "#ffb547",
    // Detail page lives at `/lab/diamond-hand` (case study + live console CTA).
    // Setting `href` makes the homepage tile link there directly and skips
    // the auto-generated `/work/diamond-hand` page.
    href: "/lab/diamond-hand",
  },
  {
    id: "03",
    slug: "card-personalization-platform",
    title: "Card personalization platform",
    client: "IDEMIA",
    year: "2022 — 2025",
    role: "Software Engineer II",
    tags: ["Java", "SQL", "PCI-DSS", "Linux"],
    summary:
      "High-security card issuance in production, under PCI-DSS, for tier-1 U.S. financial institutions.",
    accent: "#8a5cff",
    context:
      "IDEMIA's card personalization platform issues physical cards for some of the largest U.S. banks. PCI-DSS compliance is the floor; zero tolerance for data defects in production is the bar. I spent three years there on the backend that turns a customer record into a card a real person uses.",
    problem:
      "At this scale, edge-case data defects, layout regressions, and SLA-bound incidents come with the territory. Every change has to be backward-compatible with live programs — you can't break a card program that's been issuing for years.",
    approach: [
      {
        heading: "Secure issuance pipelines under PCI-DSS",
        body: "Built and maintained sensitive issuance pipelines to PCI-DSS bars and partner-specific security requirements — reducing compliance risk on the client side and standardizing how new programs onboard.",
      },
      {
        heading: "Critical incident response under SLA",
        body: "Resolved critical production incidents under strict SLAs by pinpointing logic and data defects fast — root-cause analysis across large datasets, same shift.",
      },
      {
        heading: "Custom card layouts without breaking history",
        body: "Backward-compatible backend additions for new layout features — older programs continued unchanged while new ones picked up the new options on opt-in.",
      },
      {
        heading: "Production discipline",
        body: "Daily standups, partner reviews, QA coordination, and 5S production-floor auditing as a volunteer — the operational side of running a high-availability backend that can't go down.",
      },
    ],
    outcome:
      "Three years on a platform where mistakes are extremely expensive — and none of mine made it to a customer.",
    metrics: [
      { value: "PCI-DSS", label: "compliance bar" },
      { value: "Same-shift", label: "RCAs at scale" },
      { value: "Tier-1", label: "banking clients" },
    ],
  },
  {
    id: "04",
    slug: "applyagent",
    title: "ApplyAgent — AI job application agent",
    client: "Personal project",
    year: "2025 — present",
    role: "Solo build",
    tags: ["Python", "FastAPI", "Claude API", "Playwright", "React"],
    summary:
      "An autonomous agent that navigates real career pages, reads dynamic forms across ATS platforms, and applies on your behalf.",
    accent: "#42e2ff",
    external: "https://github.com/Houmaneskandani/ApplyAgent",
    context:
      "Job applications haven't changed in a decade — same forms, same boxes, on a different ATS each time. I started ApplyAgent partly because I was tired of filling out forms and partly because I wanted a real testbed for LLM-driven browser automation. Claude as the reasoning layer, Playwright as the hands.",
    problem:
      "Every ATS (Greenhouse, Lever, custom) renders forms differently — React Selects, native dropdowns, radios, checkboxes, iframes. A scripted scraper falls over within a week. A model with browser tools can adapt.",
    approach: [
      {
        heading: "Claude + Playwright loop",
        body: "Claude reads the page DOM, decides what to click or type, and iterates until the form is complete. The system handles dynamic widgets, multi-step flows, and redirects.",
      },
      {
        heading: "AI job scorer over 2,000+ listings",
        body: "An async multi-source scraper hits Greenhouse and Lever ATS APIs, deduplicates, and a profile-aware scorer ranks each listing against the user's skills, experience, and salary expectations.",
      },
      {
        heading: "FastAPI backend, React 18 SPA",
        body: "JWT-authenticated REST API with background task processing. Supabase for storage with signed-URL generation. A custom React component library and a profile-completeness tracker on the frontend.",
      },
    ],
    outcome:
      "A working agent that turns a 30-minute application into a one-click action — and a sandbox for everything I want to learn about LLM-driven automation.",
    metrics: [
      { value: "2,000+", label: "listings ranked" },
      { value: "1-click", label: "apply experience" },
      { value: "Multi-ATS", label: "Greenhouse, Lever, +" },
    ],
  },
  {
    id: "05",
    slug: "spotlist-marketplace",
    title: "Expert–client mobile marketplace",
    client: "Spotlist Inc",
    year: "2020 — 2022",
    role: "Lead Backend Engineer",
    tags: ["Python", "Django", "Postgres", "Mongo", "AWS"],
    summary:
      "Backend architecture for a mobile-first marketplace — auth, payments, search, and the API that fed the React app.",
    accent: "#ff7a59",
    context:
      "Early-stage startup. Mobile-first marketplace matching experts to clients. I joined as the first backend hire, then took over the technical lead role. We needed a backend that could grow from prototype to product without rewriting the foundations every quarter.",
    problem:
      "When I came in: slow API responses under load, a fragile auth story, and no consistent process between engineering and the product team. The fixes were sometimes architectural, sometimes just process.",
    approach: [
      {
        heading: "OAuth 2.0 / JWT auth with role restrictions",
        body: "Hardened APIs against brute-force and injection attacks, with rate limiting in front and role-based scopes inside.",
      },
      {
        heading: "Postgres + Mongo schema design",
        body: "Indexed and tuned schemas to the access patterns. Latency on hot endpoints dropped to single-digit-percent of the previous baseline.",
      },
      {
        heading: "Stripe payments + verification flows",
        body: "Built payment intents, subscriptions, and customer management against Stripe. Onboarding integrated Checkr background checks and SMS/email verification.",
      },
      {
        heading: "Geo search and matching",
        body: "Expert search and filter APIs by location, availability, and skills, with Google Maps integration for live distance and availability.",
      },
      {
        heading: "Process",
        body: "Acted as interim Scrum Master and introduced Jira-based metrics that improved sprint delivery visibility. Mentored 5+ junior engineers through code reviews and pair programming.",
      },
    ],
    outcome:
      "A backend that survived the startup's first product–market hunt with the same team and the same architecture, just bigger.",
    metrics: [
      { value: "5+", label: "engineers mentored" },
      { value: "HTTPS", label: "everywhere, day one" },
      { value: "Lead", label: "backend ownership" },
    ],
  },
];

export type Capability = {
  label: string;
  items: string[];
};

export const CAPABILITIES: Capability[] = [
  {
    label: "Languages",
    items: ["Go", "Python", "Java", "TypeScript", "SQL", "C / C++"],
  },
  {
    label: "Backend & APIs",
    items: ["GraphQL (gqlgen)", "REST", "gRPC", "FastAPI", "Django"],
  },
  {
    label: "Data",
    items: ["PostgreSQL (GORM)", "MongoDB", "MySQL"],
  },
  {
    label: "Cloud & DevOps",
    items: [
      "AWS (EC2, S3, RDS)",
      "GCP (Cloud SQL, GCS, GKE)",
      "Kubernetes",
      "Docker",
      "Prometheus",
      "CI/CD",
    ],
  },
  {
    label: "Security",
    items: ["OAuth 2.0", "JWT", "RBAC", "MFA / TOTP", "PCI-DSS"],
  },
];

export type NavItem = { label: string; href: string; external?: boolean };

export const NAV: NavItem[] = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Side projects", href: "/lab" },
  { label: "Contact", href: "/#contact" },
  { label: "Résumé ↗", href: SITE.resume, external: true },
];

export type SideProject = {
  id: string;
  name: string;
  tag: string;
  description: string;
  /** Internal case-study link, if one exists. */
  href?: string;
  /** External repo / live URL. */
  external?: string;
  status?: string;
  /** Inline brand mark rendered before the project name on /lab. */
  logo?: "bitcoin" | "applyagent";

  /**
   * Optional case-study content. When `slug` is set, a `/lab/[slug]` route
   * renders these fields as a full case study page (mirrors `/work/[slug]`).
   */
  slug?: string;
  year?: string;
  role?: string;
  accent?: string;
  summary?: string;
  context?: string;
  problem?: string;
  approach?: ProjectSection[];
  outcome?: string;
  metrics?: { value: string; label: string }[];

  /**
   * Optional "live" CTA shown at the bottom of the case-study page —
   * a prominent button linking to e.g. a private live dashboard.
   */
  liveUrl?: string;
  liveLabel?: string;
  liveNote?: string;
};

// Things built outside paid work. Honest list — only ship what's real.
// More can be added here as projects mature.
export const SIDE_PROJECTS: SideProject[] = [
  {
    id: "01",
    name: "ApplyAgent",
    tag: "AI · Python · Claude API · Playwright",
    description:
      "Autonomous agent that fills out and submits real job applications by reasoning over live DOM with Claude and Playwright. Multi-source ATS scraper (Greenhouse, Lever) + profile-aware job scorer ranks 2,000+ listings.",
    href: "/work/applyagent",
    external: "https://github.com/Houmaneskandani/ApplyAgent",
    status: "Active",
    logo: "applyagent",
  },
  {
    id: "02",
    name: "Diamond Hand",
    tag: "Quantitative · Live execution · Risk management",
    description:
      "A live, fully-automated crypto trading system that watches the market 24/7 and learns from its own outcomes. Multi-strategy, risk-budgeted, and built like production software.",
    status: "Private · Live",
    logo: "bitcoin",
    slug: "diamond-hand",
    href: "/lab/diamond-hand",
    year: "2025 — present",
    role: "Solo build",
    accent: "#ffb547",
    summary:
      "A live, fully-automated crypto trading system that learns from its own outcomes.",
    context:
      "Diamond Hand started as a question — can a backend engineer build a trading system that consistently makes good decisions, without giving up the discipline a human keeps trying to break? It's been running ever since, and it's grown into a sizable codebase that watches the market 24/7 across multiple strategies and only acts when several independent layers agree.",
    problem:
      "Discretionary trading falls apart the moment emotions get involved. The hard part isn't writing strategies — it's removing yourself from them. The system had to be opinionated, evidence-driven, and incapable of overriding its own rules at three in the morning.",
    approach: [
      {
        heading: "Many strategies, one risk budget",
        body: "Several independent scanners run in parallel, each with its own thesis. They share a single risk envelope, and a multi-layer circuit breaker halts new entries the moment daily or weekly drawdown limits hit — so the portfolio can't accidentally double down on the same idea or bleed out on a bad day.",
      },
      {
        heading: "Every signal gets a second opinion",
        body: "Each candidate trade passes through a validation layer that checks regime fit, recent performance on the same symbol, position concentration, and patterns learned from prior trades. If anything's off the trade is downsized or skipped — and there's a hard veto on coin / direction combinations that have lost too many times in a row.",
      },
      {
        heading: "Self-improving by design",
        body: "Every closed trade is reviewed and graded by an analyst layer that turns observations into hard rules. Those rules feed back into the signal screener before the next entry. Wins reinforce; losses tighten the screen.",
      },
      {
        heading: "Validated before it ships",
        body: "Each strategy survives walk-forward testing across years of historical data, with statistical-significance tests gating every change. Pre-commit review catches look-ahead bias and repaint risk before code lands. Nothing goes live without a paper run alongside it for proof.",
      },
      {
        heading: "Built like production software",
        body: "Same engineering discipline I bring to platforms at work — auto-restart, structured journaling, real-time dashboards, alerting straight to my phone, and observability you can actually use. No silent failures.",
      },
    ],
    outcome:
      "A trading system that's been running for months — disciplined, evidence-driven, and getting smarter every cycle. The latest variant is currently paper-trading at a 65% win rate before it gets promoted to live capital.",
    metrics: [
      { value: "65%", label: "win rate · latest paper run" },
      { value: "Live", label: "production since 2025" },
      { value: "24/7", label: "autonomous & journaled" },
    ],
    liveUrl: "https://trade.houmaneskandani.com",
    liveLabel: "Open live console",
    liveNote: "trade.houmaneskandani.com",
  },
  {
    id: "03",
    name: "Marketing Agent (Paperclip)",
    tag: "Multi-tenant SaaS · AI agents · Security",
    description:
      "A from-scratch, multi-tenant marketing & CRM SaaS for medical practices, reimagined as a team of nine cooperating AI agents — lead capture to AI follow-up to booking, sealed off per practice. Built with a practicing physician as domain advisor.",
    status: "Pre-launch · onboarding first practice",
    slug: "marketing-agent",
    href: "/lab/marketing-agent",
    year: "2026",
    role: "Solo build",
    accent: "#ff5c8a",
    summary:
      "A multi-tenant marketing & CRM SaaS reimagined as a team of cooperating AI agents.",
    context:
      "The Marketing Agent started with a practicing physician and a simple frustration: the all-in-one marketing tools every clinic pays for (the GoHighLevel category) are really just static if-this-then-that builders. I wanted to know what that same product looks like when the automation engine is a roster of reasoning agents instead — so I built one, multi-tenant from the first line.",
    problem:
      "An all-in-one CRM for medical practices is a multi-tenant problem before it's an AI problem: every lead, message, and booking has to stay sealed inside the practice it belongs to — even when autonomous agents, not humans, are the ones reading and writing the data. Getting that isolation right under an agent threat model was the whole game.",
    approach: [
      {
        heading: "Multi-tenant from day one",
        body: "A 13-table Postgres schema where every row is scoped to a tenant, modeled as a Clerk Organization. Isolation is enforced at both the data layer and the API layer, so a new endpoint can't accidentally leak across practices.",
      },
      {
        heading: "A company of agents, not a workflow builder",
        body: "Nine specialized agents — follow-up, scheduling, content, SEO, social, reputation, reactivation, insights, and a director — run on an open-source control plane with an org chart, heartbeat scheduling, and budgets. They act only through a constrained skill interface against the CRM, with every action written to an audit log.",
      },
      {
        heading: "Security, caught by adversarial review",
        body: "An adversarial multi-agent code review surfaced a cross-tenant isolation gap before a single practice was onboarded. I rearchitected agent auth around per-practice hashed API keys — deriving the tenant server-side from the key rather than trusting the request — with ownership checks on every child write.",
      },
      {
        heading: "Real communication, done compliantly",
        body: "Twilio SMS and Resend email with a signature-validated inbound webhook, STOP/opt-out handling, and per-practice number routing — the unglamorous parts that decide whether a messaging product is allowed to exist.",
      },
      {
        heading: "Correct by construction",
        body: "Timezone-aware availability plus a Postgres GiST exclusion constraint that makes double-booking impossible at the database level. End-to-end TypeScript with Zod-validated boundaries, Drizzle migrations, and typecheck/build gates on every change.",
      },
    ],
    outcome:
      "A working first slice — public lead form to AI follow-up to booked appointment — that's clean on typecheck and production build, security-reviewed, and pre-launch with its first practice onboarding.",
    metrics: [
      { value: "9", label: "cooperating AI agents" },
      { value: "Multi-tenant", label: "isolated per practice" },
      { value: "Pre-launch", label: "first practice onboarding" },
    ],
  },
  {
    id: "04",
    name: "MatchYard",
    tag: "Full-stack · Native iOS · Geospatial",
    description:
      "A native SwiftUI iOS app and a TypeScript/PostGIS backend for finding workout & sports partners nearby — geospatial discovery, in-app chat, AI-assisted matchmaking, and a from-scratch auth & safety system. ~38K LOC, 529 automated tests, App Store–ready.",
    status: "Pre-launch · App Store–ready",
    slug: "matchyard",
    href: "/lab/matchyard",
    year: "2026",
    role: "Solo build",
    accent: "#3ddc97",
    summary:
      "A native iOS sports-partner finder, built end-to-end — app, backend, and infrastructure.",
    context:
      "MatchYard is the app I wanted to exist: open it, see people nearby who want to play the same sport at your level, and message them. I designed the product and brand, then built all of it — a native SwiftUI client, a TypeScript backend, and the infrastructure under both — and deliberately moved it off hosted BaaS onto a first-party stack I actually control.",
    problem:
      "A find-people-near-you app lives or dies on two things most weekend projects skip: location queries that are fast and safe, and an auth system you'd actually trust with strangers meeting in person. Both had to be production-grade before a single user signed up.",
    approach: [
      {
        heading: "Native client, stateless backend",
        body: "SwiftUI on iOS 17 (MVVM, 18 service layers, async/await throughout) against a stateless Express/TypeScript API. PostgreSQL 16 + PostGIS holds the spatial data, Redis backs rate limiting, and the schema evolves through a custom versioned migration runner.",
      },
      {
        heading: "Auth from scratch",
        body: "First-party JWT auth — access plus rotating refresh tokens, bcrypt, Sign in with Apple over ES256/JWKS, email and SMS OTP — replacing the third-party dependency it started on. Device tokens live only in the Keychain, and a single-flight refresh coalesces parallel 401s into one request so concurrent calls can't race.",
      },
      {
        heading: "Geospatial discovery, safety-aware",
        body: "Nearby-post queries run on PostGIS with keyset pagination instead of offset scans, and they exclude blocked users in both directions, your own posts, and closed posts — safety baked into the query, not bolted on after.",
      },
      {
        heading: "Graceful AI matchmaking",
        body: "The Claude API scores candidate matches 0–100, but a deterministic heuristic — sport overlap, skill, distance, availability — keeps matching working if the model is ever unavailable. No hard dependency on the LLM.",
      },
      {
        heading: "Owned the whole pipeline",
        body: "Multi-stage Docker and docker-compose (Postgres/PostGIS, Redis, API) with healthchecks, GitHub Actions running integration tests against real services rather than mocks, and a Fastlane → TestFlight pipeline. Redis-backed tiered rate limiting, Zod validation, IDOR ownership checks, content moderation, and an audit-logged admin panel round out the hardening.",
      },
    ],
    outcome:
      "A pre-launch, App Store–ready product — legal, privacy labels, account deletion, and TestFlight pipeline all in place — backed by 529 tests that run against real Postgres and Redis on every push.",
    metrics: [
      { value: "~38K", label: "lines, app + backend" },
      { value: "529", label: "automated tests" },
      { value: "App Store", label: "submission-ready" },
    ],
  },
  {
    id: "05",
    name: "Even G2 Glasses",
    tag: "Smart glasses · Voice AI · Full-stack",
    description:
      "An AI-native suite of voice-driven apps for Even Realities G2 smart glasses — a 1-bit, six-line heads-up display with mic-only input. Hands-free reminders, document Q&A, and live conversation suggestions. ~25K LOC, 332 tests, shipped to a physical device.",
    status: "Shipped to a physical device",
    slug: "even-g2",
    href: "/lab/even-g2",
    year: "2026",
    role: "Solo build",
    accent: "#4d9fff",
    summary:
      "A full-stack, on-device AI app platform for Even Realities G2 smart glasses.",
    context:
      "The Even Realities G2 is a beautifully constrained device — a 1-bit, six-line monochrome display, a microphone, and a ring gesture, and that's it. I wanted to find out what genuinely useful AI looks like on a surface that small, so I built a whole suite of apps for it: speak a reminder, ask a question grounded in your own documents, get a live reply suggestion mid-conversation — all as glanceable text, in under a second.",
    problem:
      "Every assumption a normal app makes is gone: no keyboard, no scrolling, no color, almost no screen. The hard part wasn't the AI — it was making reasoning models feel instant and legible inside 240 characters of monochrome text, on real hardware, without dropping a tap.",
    approach: [
      {
        heading: "A suite, not a demo",
        body: "Five app modules over one platform: Loop (hands-free voice reminders), Recall (retrieval-augmented Q&A over your own PDFs and docs), Cyrano (real-time conversation suggestions), Capture (voice notes auto-structured by an LLM), and a glanceable trading HUD over a paper-trading system.",
      },
      {
        heading: "Provider-abstracted AI",
        body: "A single Claude interface with natural-language-to-structured-JSON parsing, RAG (chunking, embeddings, a SQLite vector store, persona system), SSE streaming, prompt caching, and a fast-model tier — plus real-time speech-to-text behind an intent router that decides which app you're talking to.",
      },
      {
        heading: "Full-stack, both ends typed",
        body: "A FastAPI backend (~8K LOC) with HMAC auth, upload caps, and decompression-bomb guards, and a TypeScript on-device runtime (~12K LOC) driving the 240-character, six-line, 1-bit display. OpenAPI-generated shared types keep the client and server from drifting.",
      },
      {
        heading: "Constrained-device UX",
        body: "Diagnosed and fixed real input-latency and dropped-tap bugs on the hardware, then rebuilt the flagship around a single-button, optimistically-rendered interaction so it feels instant even while the model is still thinking.",
      },
      {
        heading: "Infrastructure that heals itself",
        body: "Five self-healing launchd services, an HTTPS Cloudflare named tunnel stood up without disrupting a separate live tunnel on the same account, and a security-locked Telegram control bot — shipped to a physical device through the Even Hub developer portal.",
      },
    ],
    outcome:
      "A working, on-device AI platform — five app modules, five production services, ~25K lines — installed on real glasses, with 332 tests across 23 suites and an adversarial review that caught a timestamp-comparison bug before it shipped.",
    metrics: [
      { value: "~25K", label: "lines, full-stack" },
      { value: "332", label: "tests / 23 suites" },
      { value: "On-device", label: "shipped via Even Hub" },
    ],
  },
];

export type Experience = {
  company: string;
  role: string;
  period: string;
  location: string;
  href?: string;
};

export const EXPERIENCE: Experience[] = [
  {
    company: "The Vport",
    role: "Software Engineer — Backend / Platform",
    period: "Apr 2025 — Present",
    location: "Remote · San Francisco, CA",
  },
  {
    company: "IDEMIA",
    role: "Software Engineer II — Card Personalization",
    period: "Feb 2022 — Mar 2025",
    location: "Los Angeles, CA",
  },
  {
    company: "Spotlist Inc",
    role: "Lead Backend Engineer",
    period: "Sep 2021 — Feb 2022",
    location: "New York City, NY",
  },
  {
    company: "Spotlist Inc",
    role: "Backend Engineer Intern",
    period: "Sep 2020 — Sep 2021",
    location: "New York City, NY",
  },
];

export const EDUCATION = [
  {
    school: "University of California, Riverside",
    degree: "B.S. Computer Science",
    period: "Aug 2017 — Jul 2021",
  },
  {
    school: "Irvine Valley College",
    degree: "A.S. Computer Science",
    period: "Aug 2015 — Jul 2017",
  },
];
