# Houman Eskandani — Portfolio

Personal portfolio site. Backend-focused engineer, agency-style frontend. Built with WebGL, smooth scroll, and a custom cursor.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling
- **Three.js** + **React Three Fiber** + **drei** — WebGL hero with a custom Perlin-noise displacement shader
- **Lenis** — smooth scroll
- **Framer Motion** — micro-interactions
- **GSAP** — available for ad-hoc timelines
- Free production hosting on **Vercel**

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # serve the production build
```

## Project layout

```
src/
├── app/
│   ├── layout.tsx          # fonts, metadata, providers
│   ├── page.tsx            # composes all sections
│   ├── globals.css         # design tokens, base styles
│   ├── opengraph-image.tsx # dynamic OG image (edge)
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── providers/SmoothScroll.tsx
│   ├── cursor/CustomCursor.tsx
│   ├── nav/Navbar.tsx
│   ├── three/HeroScene.tsx     # WebGL blob + particles + custom shader
│   ├── ui/                     # SplitText, Reveal, MagneticButton, Marquee
│   └── sections/               # Hero, About, Work, Capabilities, Contact, Footer
└── lib/
    ├── data.ts             # site copy, projects, capabilities — EDIT ME
    └── utils.ts
```

### Editing your content

All copy lives in **`src/lib/data.ts`**:

- `SITE` — name, role, tagline, email, social URLs
- `PROJECTS` — array of work entries (title, year, role, tags, summary, accent color)
- `CAPABILITIES` — grouped skill list

Update those and the site rebuilds automatically in dev.

## Deploying to Vercel (free)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo. Framework auto-detects as Next.js.
3. Click **Deploy**. You get a free `*.vercel.app` URL with global CDN, automatic HTTPS, preview deploys per PR. No credit card required.

You can also run a one-shot deploy from the CLI:

```bash
npm i -g vercel@latest
vercel        # preview deploy
vercel --prod # production deploy
```

### Adding your real domain (when you buy one)

**Recommended registrar: Cloudflare Registrar.** Sells `.com` etc. at cost (~$9.77/yr, no markup), free WHOIS privacy, free DNS, free DDoS protection.

Once you own a domain:

1. In the Vercel dashboard → your project → **Settings → Domains** → add `yourdomain.com`.
2. Vercel shows you DNS records to add (an `A` record and a `CNAME`).
3. In Cloudflare → DNS → add those records. Set Cloudflare's proxy mode to **DNS only** (grey cloud) so TLS terminates on Vercel's edge.
4. Vercel issues a Let's Encrypt cert automatically. Live in a few minutes.

> Avoid free TLDs like `.tk` / `.ml` / `.ga` — they get blacklisted, look spammy, and can be revoked.

## Performance & UX notes

- The WebGL canvas is loaded with `next/dynamic({ ssr: false })` so it never blocks the initial paint.
- Smooth scroll only kicks in on devices with a real pointer; touch defaults are tuned for mobile.
- The custom cursor disables itself on touch devices via the `(hover: hover) and (pointer: fine)` media query.
- Reveal animations use a manual `IntersectionObserver` (avoids Framer's `whileInView` quirks with nested inline-block typography).

## What's intentionally not here

- No CMS — content lives in `src/lib/data.ts`. Add a CMS later if you need it (Sanity, Contentlayer, etc.).
- No analytics — drop in Vercel Analytics later: `npm i @vercel/analytics` and add `<Analytics />` to `layout.tsx`.
- No contact form backend — the contact section uses a `mailto:` link to keep things zero-infrastructure.

## License

Personal project. Code is yours, content is yours.
