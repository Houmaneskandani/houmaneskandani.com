export const SITE = {
  name: "Houman Eskandani",
  shortName: "Houman",
  initials: "HSK",
  role: "Backend & Cloud Platform Engineer",
  shortRole: "Backend Engineer",
  tagline:
    "Currently at The Vport, building payments, authentication, and the multi-tenant GraphQL platform behind a VR concert streaming product. Three years before that at IDEMIA on card issuance for tier-1 U.S. banks. On the side I build with AI: a native iOS sports-partner app and a crypto trading system with Claude in the decision loop.",
  // One line under the About paragraphs: what I'm thinking about right now,
  // as opposed to what I've shipped. Edit freely — it's meant to go stale.
  currently:
    "Exactly-once money movement, multi-tenant isolation when the caller is an AI agent rather than a person, and LLM automation that keeps a human in the loop.",
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
    year: "2025 – present",
    role: "Software Engineer, Backend & Platform",
    tags: ["Go", "GraphQL", "Payments", "Kubernetes"],
    summary: "The Go backend behind a VR live-music streaming product: payments, authentication, multi-tenant GraphQL APIs, and the production Kubernetes cluster.",
    accent: "#c8ff00",
    context: "The Vport runs a VR concert streaming platform: live and on-demand events, creator payouts, and admin tools, served by Go GraphQL APIs on Google Kubernetes Engine. It's a small backend team, so I own whole areas end to end: the money path, account security, and day-to-day cluster operations.",
    problem: "On a small team, a payments bug costs real money and an auth bug costs real trust, and there's no separate SRE group to catch either one. The work is making the critical paths correct by construction, then observable, so problems show up on a dashboard before they show up in a support ticket.",
    approach: [
      {
        heading: "Payments that credit exactly once",
        body: "Built Stripe fulfillment, refunds, and chargeback handling, and closed a critical bypass that granted credits without payment. Crediting and the nightly creator-payout job are exactly-once under concurrent load, with a reconciliation job, Prometheus metrics, Slack alerts, and an operator runbook.",
      },
      {
        heading: "Account security",
        body: "Two-factor (TOTP) login for users and admins, rate limits on sensitive routes, signing-key rotation with zero user logouts, and deny-by-default access for AI-agent API keys. I also found a 34-token GraphQL query that could crash a pod, and capped parser tokens and validation cost on both APIs.",
      },
      {
        heading: "Multi-tenant by construction",
        body: "Built org scoping into the data layer, so one tenant can't read another's data: added org ownership to tenant tables and split the venue, stage, event, and event-instance queries into org-scoped and public paths, the pattern the codebase now follows in 38 query functions. Later added artist, sub-event, signed promotion-code, and ownership-transfer APIs, and wrote the user-type policy package that gates creator writes.",
      },
      {
        heading: "Production Kubernetes",
        body: "Operate the GKE cluster day to day: releases, the Traefik edge via Helm (Cloudflare-only origin, real client IPs, no dropped connections on draining nodes), a 15-minute synthetic login probe, and nightly jobs that alert to Slack.",
      },
      {
        heading: "Tests as the safety net",
        body: "Added test-coverage reporting and dependency vulnerability scanning to CI, then raised backend coverage from 38% to 57% with 340+ new tests.",
      },
    ],
    outcome: "A money path that credits exactly once, a login path that's hard to abuse, and a cluster the team can see into.",
    metrics: [
      { value: "38→57%", label: "backend test coverage" },
      { value: "Exactly-once", label: "payment crediting" },
      { value: "2FA", label: "users and admins" },
    ],
  },
  {
    id: "02",
    slug: "card-personalization-platform",
    title: "Card personalization platform",
    client: "IDEMIA",
    year: "2022 – 2025",
    role: "Software Engineer II",
    tags: ["Java", "SQL", "PCI-DSS", "Linux"],
    summary:
      "High-security card issuance in production, under PCI-DSS, for tier-1 U.S. financial institutions.",
    accent: "#8a5cff",
    context:
      "IDEMIA's card personalization platform issues physical cards for some of the largest U.S. banks. PCI-DSS compliance is the floor; zero tolerance for data defects in production is the bar. I spent three years there on the backend that turns a customer record into a card a real person uses.",
    problem:
      "At this scale, edge-case data defects, layout regressions, and SLA-bound incidents come with the territory. Every change has to be backward-compatible with live programs: you can't break a card program that's been issuing for years.",
    approach: [
      {
        heading: "Secure issuance pipelines under PCI-DSS",
        body: "Built and maintained sensitive issuance pipelines to PCI-DSS bars and partner-specific security requirements, reducing compliance risk on the client side and standardizing how new programs onboard.",
      },
      {
        heading: "Critical incident response under SLA",
        body: "Resolved critical production incidents under strict SLAs by pinpointing logic and data defects fast, with root-cause analysis across large datasets in the same shift.",
      },
      {
        heading: "Custom card layouts without breaking history",
        body: "Backward-compatible backend additions for new layout features: older programs continued unchanged while new ones picked up the new options on opt-in.",
      },
      {
        heading: "Production discipline",
        body: "Daily standups, partner reviews, and release coordination with QA and production teams: the operational side of running a high-availability backend that can't go down.",
      },
    ],
    outcome:
      "Three years on a platform where mistakes are extremely expensive, processing 1M+ card records a day for tier-1 banks.",
    metrics: [
      { value: "PCI-DSS", label: "compliance bar" },
      { value: "Same-shift", label: "RCAs at scale" },
      { value: "Tier-1", label: "banking clients" },
    ],
  },
  {
    id: "03",
    slug: "matchyard",
    title: "MatchYard: native iOS sports-partner app",
    client: "Personal project",
    year: "2026",
    role: "Built with AI coding agents",
    tags: ["Swift", "TypeScript", "PostGIS"],
    summary: "A native SwiftUI app and a TypeScript/PostGIS backend for finding sports partners nearby, built by directing Claude coding agents across 87 merged PRs.",
    accent: "#3ddc97",
    // Case study lives at `/lab/matchyard`.
    href: "/lab/matchyard",
  },
  {
    id: "04",
    slug: "diamond-hand",
    title: "Diamond Hand: Claude-reviewed crypto trading",
    client: "Personal project",
    year: "2026",
    role: "Solo build",
    tags: ["Python", "LLM agents", "Backtesting"],
    summary: "A multi-strategy crypto futures system where Claude agents review every signal and every strategy has to survive real trading costs.",
    accent: "#ffb547",
    href: "/lab/diamond-hand",
  },
  {
    id: "05",
    slug: "spotlist-marketplace",
    title: "Expert–client mobile marketplace",
    client: "Spotlist Inc",
    year: "2020 – 2022",
    role: "Lead Backend Engineer",
    tags: ["Python", "Django", "Postgres", "Mongo", "AWS"],
    summary:
      "Backend architecture for a mobile-first marketplace: auth, payments, search, and the API that fed the React app.",
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
        body: "Indexed and tuned schemas to the access patterns, cutting response latency on the hottest endpoints and keeping the platform stable under load.",
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
      { value: "Stripe", label: "payments & subscriptions" },
      { value: "First", label: "backend hire → lead" },
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
    items: ["Go", "Python", "SQL", "TypeScript", "Java"],
  },
  {
    label: "Backend & APIs",
    items: ["GraphQL (gqlgen)", "REST", "Stripe (Payments, Connect)", "FastAPI", "Django"],
  },
  {
    label: "Data",
    items: ["PostgreSQL (GORM)", "PostGIS", "MongoDB", "MySQL"],
  },
  {
    label: "Cloud & DevOps",
    items: ["GCP (GKE, Cloud SQL, GCS)", "Kubernetes", "Helm", "Traefik", "Docker", "AWS (EC2, S3, RDS)", "Prometheus", "CI/CD"],
  },
  {
    label: "Security",
    items: ["OAuth 2.0", "JWT", "RBAC", "MFA / TOTP", "Rate limiting", "PCI-DSS"],
  },
  {
    label: "AI & agents",
    items: ["Anthropic Claude API", "Claude Code", "LLM agents, human in the loop", "Playwright"],
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
    name: "MatchYard",
    tag: "Native iOS · TypeScript · Geospatial",
    description: "A native SwiftUI iOS app and a TypeScript/PostGIS backend for finding sports partners nearby: geospatial discovery, in-app chat, AI-assisted matchmaking, and first-party auth and safety. Built by directing Claude coding agents across 87 merged PRs.",
    status: "TestFlight beta",
    slug: "matchyard",
    href: "/lab/matchyard",
    year: "2026",
    role: "Product and engineering lead, with AI coding agents",
    accent: "#3ddc97",
    summary: "A native iOS sports-partner finder: app, backend, and infrastructure.",
    context: "MatchYard is the app I wanted to exist: open it, see people nearby who want to play the same sport at your level, and message them. I designed the product and directed Claude coding agents to build it, owning the specs, architecture, code reviews, and testing across a native SwiftUI client, a TypeScript backend, and the infrastructure under both. It started on a hosted backend-as-a-service and moved to a first-party stack I control.",
    problem: "A find-people-near-you app lives or dies on two things most weekend projects skip: location queries that are fast and safe, and an auth system you'd actually trust with strangers meeting in person. Both had to be production-grade before a single user signed up.",
    approach: [
      {
        heading: "Native client, stateless backend",
        body: "SwiftUI on iOS 17 (MVVM, async/await throughout) against a stateless Express/TypeScript API. PostgreSQL 16 + PostGIS holds the spatial data, Redis backs rate limiting, and the schema evolves through versioned migrations.",
      },
      {
        heading: "Auth from scratch",
        body: "First-party JWT auth with rotating refresh tokens, bcrypt, Sign in with Apple over ES256/JWKS, and Twilio phone OTP, replacing the hosted auth it started on. Tokens live only in the Keychain, and a single-flight refresh coalesces parallel 401s so concurrent calls can't race.",
      },
      {
        heading: "Geospatial discovery, safety-aware",
        body: "Nearby queries run on PostGIS and exclude blocked users in both directions, so safety is part of the query instead of being bolted on after.",
      },
      {
        heading: "Graceful AI matchmaking",
        body: "The Claude API scores candidate matches, but a deterministic heuristic (sport overlap, skill, distance, availability) keeps matching working if the model is ever unavailable. No hard dependency on the LLM.",
      },
      {
        heading: "Owned the whole pipeline",
        body: "Multi-stage Docker and docker-compose (Postgres/PostGIS, Redis, API) with healthchecks, CI that runs integration tests against real Postgres and Redis instead of mocks, and a fastlane pipeline to TestFlight. AWS Rekognition image moderation, face-liveness verification, and an audit-logged admin panel cover trust and safety.",
      },
    ],
    outcome: "A pre-launch app in TestFlight beta with legal pages and App Store privacy labels in place, backed by ~400 backend tests.",
    metrics: [
      { value: "87", label: "merged PRs, agent-built, human-reviewed" },
      { value: "~400", label: "backend tests" },
      { value: "15", label: "TestFlight builds" },
    ],
  },
  {
    id: "02",
    name: "Diamond Hand",
    tag: "Python · LLM agents · Backtesting",
    description: "A multi-strategy system for crypto perpetual futures: market scanners, Claude agents that judge every signal, execution on Hyperliquid, and a cost model that keeps the backtests honest.",
    status: "Private",
    logo: "bitcoin",
    slug: "diamond-hand",
    href: "/lab/diamond-hand",
    year: "2026",
    role: "Solo build",
    accent: "#ffb547",
    summary: "A multi-strategy crypto trading system with Claude agents in the decision loop.",
    context: "Diamond Hand started as a question: can a backend engineer build a trading system that follows its own rules, measures itself honestly, and never trusts a backtest it can't reproduce live? It runs several independent strategies over live market data and only acts when the agents and the risk checks agree.",
    problem: "Discretionary trading falls apart the moment emotions get involved. The hard part isn't writing strategies; it's removing yourself from them. The system had to be opinionated, evidence-driven, and incapable of overriding its own rules at three in the morning.",
    approach: [
      {
        heading: "Many strategies, one pipeline",
        body: "Independent scanners read OKX market data across timeframes and write candidate signals into one shared pipeline. Orders go to Hyperliquid with stop-loss and take-profit attached, and a heartbeat watchdog flags any loop that stalls.",
      },
      {
        heading: "Claude in the decision loop",
        body: "A regime agent decides whether the market is safe to trade, a judge agent approves or rejects each signal, a positions agent advises on open trades, and a learning loop turns closed trades into rules the judge reads before the next entry.",
      },
      {
        heading: "Honest about costs",
        body: "Backtests and walk-forward runs model fees, spreads, and slippage. Strategies that didn't survive real costs were switched off.",
      },
      {
        heading: "Live vs. paper, measured",
        body: "A small live pilot ran next to the paper system. A fidelity report matched live fills to paper fills trade by trade, showed live entries about 1% worse, and traced the gap to market orders chasing a price that had already moved. A limit-order fix was then tested head-to-head on 197 real signals.",
      },
    ],
    outcome: "A system that tells the truth about itself: every trade journaled, live and paper compared trade by trade, and no strategy promoted on a backtest alone.",
    metrics: [
      { value: "400+", label: "paper trades" },
      { value: "197", label: "signals in the limit-order test" },
      { value: "3", label: "Claude agents + a learning loop" },
    ],
  },
  {
    id: "03",
    name: "ApplyAgent",
    tag: "AI · Python · Claude API · Playwright",
    description: "Autonomous agent that fills out and submits real job applications by reasoning over live DOM with Claude and Playwright. Multi-source ATS scraper (Greenhouse, Lever) + profile-aware job scorer ranks 2,000+ listings.",
    external: "https://github.com/Houmaneskandani/ApplyAgent",
    status: "Open source",
    logo: "applyagent",
    slug: "applyagent",
    href: "/lab/applyagent",
    year: "2026",
    role: "Solo build",
    accent: "#42e2ff",
    summary: "An autonomous agent that navigates real career pages, reads dynamic forms across ATS platforms, and applies on your behalf.",
    context: "Job applications haven't changed in a decade: same forms, same boxes, on a different ATS each time. I started ApplyAgent partly because I was tired of filling out forms and partly because I wanted a real testbed for LLM-driven browser automation. Claude as the reasoning layer, Playwright as the hands.",
    problem: "Every ATS (Greenhouse, Lever, custom) renders forms differently: React Selects, native dropdowns, radios, checkboxes, iframes. A scripted scraper falls over within a week. A model with browser tools can adapt.",
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
    outcome: "A working agent that turns a 30-minute application into a one-click action, and a sandbox for everything I want to learn about LLM-driven automation.",
    metrics: [
      { value: "2,000+", label: "listings ranked" },
      { value: "1-click", label: "apply experience" },
      { value: "Multi-ATS", label: "Greenhouse, Lever, +" },
    ],
  },
  {
    id: "04",
    name: "Marketing Agent (Paperclip)",
    tag: "Multi-tenant SaaS · AI agents · Security",
    description:
      "A from-scratch, multi-tenant marketing & CRM SaaS for medical practices, reimagined as a team of nine cooperating AI agents: lead capture to AI follow-up to booking, sealed off per practice. Built with a practicing physician as domain advisor.",
    status: "Prototype",
    slug: "marketing-agent",
    href: "/lab/marketing-agent",
    year: "2026",
    role: "Solo build",
    accent: "#ff5c8a",
    summary:
      "A multi-tenant marketing & CRM SaaS reimagined as a team of cooperating AI agents.",
    context:
      "The Marketing Agent started with a practicing physician and a simple frustration: the all-in-one marketing tools every clinic pays for (the GoHighLevel category) are really just static if-this-then-that builders. I wanted to know what that same product looks like when the automation engine is a roster of reasoning agents instead, so I built one, multi-tenant from the first line.",
    problem:
      "An all-in-one CRM for medical practices is a multi-tenant problem before it's an AI problem: every lead, message, and booking has to stay sealed inside the practice it belongs to, even when autonomous agents, not humans, are the ones reading and writing the data. Getting that isolation right under an agent threat model was the whole game.",
    approach: [
      {
        heading: "Multi-tenant from day one",
        body: "A 13-table Postgres schema where every row is scoped to a tenant, modeled as a Clerk Organization. Isolation is enforced at both the data layer and the API layer, so a new endpoint can't accidentally leak across practices.",
      },
      {
        heading: "A company of agents, not a workflow builder",
        body: "Nine specialized agents (follow-up, scheduling, content, SEO, social, reputation, reactivation, insights, and a director) run on an open-source control plane with an org chart, heartbeat scheduling, and budgets. They act only through a constrained skill interface against the CRM, with every action written to an audit log.",
      },
      {
        heading: "Security, caught by adversarial review",
        body: "An adversarial multi-agent code review surfaced a cross-tenant isolation gap before a single practice was onboarded. I rearchitected agent auth around per-practice hashed API keys, deriving the tenant server-side from the key rather than trusting the request, with ownership checks on every child write.",
      },
      {
        heading: "Real communication, done compliantly",
        body: "Twilio SMS and Resend email with a signature-validated inbound webhook, STOP/opt-out handling, and per-practice number routing: the unglamorous parts that decide whether a messaging product is allowed to exist.",
      },
      {
        heading: "Correct by construction",
        body: "Timezone-aware availability plus a Postgres GiST exclusion constraint that makes double-booking impossible at the database level. End-to-end TypeScript with Zod-validated boundaries, Drizzle migrations, and typecheck/build gates on every change.",
      },
    ],
    outcome:
      "A working first slice, from public lead form to AI follow-up to booked appointment, that passes typecheck and a production build and has been security-reviewed.",
    metrics: [
      { value: "9", label: "cooperating AI agents" },
      { value: "Multi-tenant", label: "isolated per practice" },
      { value: "0", label: "double-bookings possible (DB-enforced)" },
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
    role: "Software Engineer, Backend & Platform",
    period: "Apr 2025 – Present",
    location: "Remote · San Francisco, CA",
  },
  {
    company: "IDEMIA",
    role: "Software Engineer II, Card Personalization",
    period: "Feb 2022 – Mar 2025",
    location: "Los Angeles, CA",
  },
  {
    company: "Spotlist Inc",
    role: "Lead Backend Engineer",
    period: "Sep 2021 – Feb 2022",
    location: "New York City, NY",
  },
  {
    company: "Spotlist Inc",
    role: "Backend Engineer Intern",
    period: "Sep 2020 – Sep 2021",
    location: "New York City, NY",
  },
];

export const EDUCATION = [
  {
    school: "University of California, Riverside",
    degree: "B.S. Computer Science",
    period: "Aug 2017 – Jul 2021",
  },
  {
    school: "Irvine Valley College",
    degree: "A.S. Computer Science",
    period: "Aug 2015 – Jul 2017",
  },
];
