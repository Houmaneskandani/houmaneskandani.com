# Deploy guide — `houmaneskandani.com` on Cloudflare → Vercel

End-to-end checklist to take this repo from local to live at your real domain.

---

## Prereqs

- Vercel account (you already have one — sign in with the email or GitHub used to create it).
- Cloudflare account with `houmaneskandani.com` registered (or whatever TLD you bought).
- This repo pushed to GitHub.

If the repo isn't on GitHub yet:

```bash
cd /Users/houmaneskandani/Houman_web
git init
git add .
git commit -m "feat: initial portfolio site"
gh repo create houman-web --public --source=. --remote=origin --push
# (or do it manually via github.com/new)
```

---

## Step 1 — Connect the repo to Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import Git Repository** → pick `Houmaneskandani/houman-web` (or whatever you named it).
3. Framework auto-detects as **Next.js**. Leave all build settings at defaults.
4. Click **Deploy**.

In ~60 seconds you'll get a free preview URL like `houman-web-abc123.vercel.app`. Open it — site should be fully live there. This is your safety net: even before DNS is configured, the site is reachable on this URL.

---

## Step 2 — Add `houmaneskandani.com` in Vercel

1. In the Vercel dashboard → your project → **Settings** → **Domains**.
2. Type `houmaneskandani.com` → click **Add**.
3. Repeat for `www.houmaneskandani.com`.
4. Vercel will show you the **DNS records you need to add at your registrar** (Cloudflare). Note them down — they look like this:

   - **For `houmaneskandani.com` (apex):**
     ```
     Type: A
     Name: @
     Content: 76.76.21.21
     ```
   - **For `www.houmaneskandani.com`:**
     ```
     Type: CNAME
     Name: www
     Content: cname.vercel-dns.com
     ```

   Double-check the exact IP / CNAME target in your Vercel dashboard — Vercel sometimes updates these.

---

## Step 3 — Add the DNS records in Cloudflare

1. Cloudflare dashboard → select `houmaneskandani.com` → **DNS** → **Records**.

2. **Add the apex `A` record:**

   | Field | Value |
   | --- | --- |
   | Type | `A` |
   | Name | `@` |
   | IPv4 address | `76.76.21.21` (or whatever Vercel showed) |
   | Proxy status | **DNS only** (grey cloud) |
   | TTL | Auto |

3. **Add the `www` CNAME:**

   | Field | Value |
   | --- | --- |
   | Type | `CNAME` |
   | Name | `www` |
   | Target | `cname.vercel-dns.com` |
   | Proxy status | **DNS only** (grey cloud) |
   | TTL | Auto |

4. **Important — turn the orange cloud OFF for both records.** Vercel terminates TLS on its own edge; if Cloudflare proxies (orange cloud) sits in front, you can hit double-TLS or redirect-loop issues. The grey cloud (DNS only) is the right setting for Vercel.

5. **SSL/TLS mode in Cloudflare** → **Full (strict)**. (`Settings → SSL/TLS → Overview`.)

> If you ever turn the orange proxy on later (for caching, WAF, etc.), make sure SSL/TLS mode stays at **Full (strict)** so the connection between Cloudflare and Vercel uses HTTPS.

---

## Step 4 — Verify

DNS usually propagates in seconds at Cloudflare but can take up to a few minutes globally.

```bash
dig +short houmaneskandani.com    # should return Vercel's IP
dig +short www.houmaneskandani.com # should return cname.vercel-dns.com
```

Back in **Vercel → Domains**, both entries should turn from yellow ⚠️ to green ✅. Vercel issues a Let's Encrypt cert automatically — no action needed.

Open `https://houmaneskandani.com` — done.

---

## Step 5 — Redirects & canonical URL

In Vercel → Domains, set `houmaneskandani.com` as the **primary** domain. Vercel will auto-301 `www.houmaneskandani.com` → `houmaneskandani.com` (or vice versa, your call).

The site already declares `houmaneskandani.com` as the canonical URL in `src/app/layout.tsx` and `sitemap.ts`. Once live, Google will index the right host.

---

## Optional but recommended

### Vercel Analytics + Speed Insights (free on Hobby)

```bash
npm i @vercel/analytics @vercel/speed-insights
```

Then in `src/app/layout.tsx`, before `</body>`:

```tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// ... inside <body>
<Analytics />
<SpeedInsights />
```

Push, redeploy. You'll get pageviews + Core Web Vitals in the Vercel dashboard.

### Email (no backend) via Cloudflare Email Routing

If you ever want `hi@houmaneskandani.com` to forward to your Gmail:

1. Cloudflare → your domain → **Email** → **Email Routing** → enable.
2. Cloudflare adds the necessary MX records automatically.
3. Add a route: `hi@houmaneskandani.com` → `eskandanihouman@gmail.com`.

Free, takes 2 minutes. Then update `SITE.email` in `src/lib/data.ts`.

### Preview deployments

Every PR you push automatically gets its own preview URL — share those with friends to gather feedback before merging into main.

---

## Common pitfalls

- **Domain shows "Invalid Configuration" in Vercel for hours.** Cloudflare orange cloud is on. Switch to grey.
- **`ERR_TOO_MANY_REDIRECTS`.** Cloudflare SSL mode is `Flexible` — change to `Full (strict)`.
- **`www` works but apex doesn't.** You added a CNAME at `@` (Cloudflare allows it via CNAME flattening, which works) but the IP-based A record is the simpler, more standard path. Use the A record per the steps above.
- **Old Vercel preview URL keeps showing up.** Browser DNS cache. `dscacheutil -flushcache` on macOS or just open an incognito window.
