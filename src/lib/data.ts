export const SITE = {
  name: "Houman Eskandani",
  shortName: "Houman",
  initials: "HSK",
  role: "Backend & Cloud Platform Engineer",
  shortRole: "Backend Engineer",
  tagline:
    "Currently at The Vport on the VCloud GraphQL platform. Three years before that at IDEMIA shipping card personalization for Wells Fargo, Capital One, and Citi. On the side I'm building AI agents — most recently ApplyAgent, an autonomous job-application bot powered by Claude.",
  email: "eskandanihouman@gmail.com",
  location: "Irvine, CA · Remote-friendly",
  // Will host at houmaneskandani.com once DNS is pointed at Vercel.
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
    slug: "vcloud-platform",
    title: "VCloud — multi-tenant GraphQL platform",
    client: "The Vport",
    year: "2025 — present",
    role: "Backend / Platform Engineer",
    tags: ["Go", "GraphQL", "GKE", "Postgres", "Tile38"],
    summary:
      "GraphQL APIs, JWT/cookie auth, deny-by-default RBAC, multi-namespace GKE cluster, and a presigned-URL media pipeline — the core of a multi-tenant venue product.",
    accent: "#c8ff00",
    context:
      "When I joined, The Vport needed a backend that could host multiple tenant orgs behind a single GraphQL API without leaking data between them — and a Kubernetes footprint that a small team could actually operate, without a dedicated SRE.",
    problem:
      "Per-route auth was inconsistent. Cross-tenant scoping lived in the application layer where it was easy to bypass. The GKE cluster had grown organically across namespaces with no clear deployment story. So I started at the auth layer and worked outward.",
    approach: [
      {
        heading: "JWT/cookie auth with per-route allowlists",
        body: "Every GraphQL endpoint declares its allowed user types. A middleware validates the token, attaches a request UUID for tracing, and rejects anything that doesn't match the route's allowlist before resolvers ever run.",
      },
      {
        heading: "Tenant scoping at the database layer",
        body: "Org IDs are baked into every query through GORM scopes — applications can't accidentally read another tenant's data because the query won't compile that way.",
      },
      {
        heading: "Admin flows: MFA/TOTP, email verification, password reset",
        body: "A separate admin schema with its own RBAC (deny-by-default) keeps sensitive operations off the user-facing surface area. Twilio + SendGrid handle the side-channels.",
      },
      {
        heading: "Presigned-URL media pipeline",
        body: "Clients upload to GCS via presigned URLs, an async worker generates thumbnails, and a recommendation engine picks up assets through a CDN-backed delivery layer.",
      },
      {
        heading: "Geospatial venue discovery",
        body: "Tile38 powers radius-based search; cursor-based pagination at the DB keeps location-aware queries fast and stable as the catalog grows.",
      },
      {
        heading: "Observability you can actually use",
        body: "A Prometheus exporter exposes GraphQL-aware metrics on /metrics. Structured logs carry the request UUID and user context, so a single request is traceable end-to-end.",
      },
    ],
    outcome:
      "A platform that scales horizontally on GKE, a security model with no known cross-tenant edges, and dashboards the team actually trusts for routine ops.",
    metrics: [
      { value: "0", label: "cross-tenant leak paths" },
      { value: "6", label: "GKE namespaces operated" },
      { value: "100%", label: "endpoints behind RBAC" },
    ],
  },
  {
    id: "02",
    slug: "card-personalization-platform",
    title: "Card personalization platform",
    client: "IDEMIA · Wells Fargo, Capital One, Citi",
    year: "2022 — 2025",
    role: "Software Engineer II",
    tags: ["Java", "SQL", "PCI-DSS", "Linux"],
    summary:
      "High-security card issuance handling 1M+ secure card transactions a day for top-tier U.S. financial institutions.",
    accent: "#8a5cff",
    context:
      "IDEMIA's card personalization platform issues physical cards for some of the largest U.S. banks. PCI-DSS compliance is the floor; zero tolerance for data defects in production is the bar. I spent three years there, mostly on the backend that turns a customer record into a card a real person uses.",
    problem:
      "At a million transactions a day, edge-case data defects, layout regressions, and SLA-bound incidents come with the territory. Every change has to be backward-compatible with live client workflows — you can't break a card program that's been issuing for five years.",
    approach: [
      {
        heading: "Secure PIN generation & mailing flows",
        body: "PIN generation and downstream mailing flows built to the bar of PCI-DSS and the banks' internal security requirements — reducing compliance risk on the client side and standardizing how new programs onboard.",
      },
      {
        heading: "Critical incident response, under SLA",
        body: "Resolved 20+ critical production incidents under strict client SLAs by pinpointing logic and data defects fast — often using ad-hoc SQL across 1M+ row datasets to do root-cause analysis the same shift.",
      },
      {
        heading: "Custom card layouts without breaking history",
        body: "Built backend support for custom card layouts (vertical PAN, barcodes) with full backward compatibility — production for older client programs continued unchanged while new programs got the new features.",
      },
      {
        heading: "Production discipline",
        body: "Daily standups, client reviews, QA coordination, and 5S production-floor auditing as a volunteer — the operational side of running a financial-services backend that can't go down.",
      },
    ],
    outcome:
      "Three years on a platform where mistakes are extremely expensive — and none of mine made it to a customer.",
    metrics: [
      { value: "1M+", label: "secure transactions / day" },
      { value: "20+", label: "P0 incidents resolved" },
      { value: "3", label: "tier-1 banks supported" },
    ],
  },
  {
    id: "03",
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
    id: "04",
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
    items: ["PostgreSQL (GORM)", "MongoDB", "MySQL", "Tile38"],
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

export const NAV = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Lab", href: "/lab" },
  { label: "Contact", href: "/#contact" },
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
    role: "Software Engineer — VCloud Platform",
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
