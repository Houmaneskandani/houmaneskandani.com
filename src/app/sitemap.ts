import type { MetadataRoute } from "next";
import { PROJECTS, SITE, type Project } from "@/lib/data";

// Use the project's end-year as the lastModified hint. "2025 — present"
// → today; "2022 — 2025" → 2025-12-31. Stable, accurate signal for crawlers.
function projectLastModified(p: Project): Date {
  if (/present/i.test(p.year)) return new Date();
  const matches = p.year.match(/\d{4}/g);
  if (!matches) return new Date();
  const last = matches[matches.length - 1];
  return new Date(`${last}-12-31T00:00:00Z`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE.url,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE.url}/lab`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...PROJECTS.map((p) => ({
      url: `${SITE.url}/work/${p.slug}`,
      lastModified: projectLastModified(p),
      changeFrequency: /present/i.test(p.year)
        ? ("monthly" as const)
        : ("yearly" as const),
      priority: 0.7,
    })),
  ];
}
