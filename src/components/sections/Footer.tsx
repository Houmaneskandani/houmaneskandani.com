"use client";

import { SITE } from "@/lib/data";
import { Marquee } from "@/components/ui/Marquee";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative w-full overflow-hidden border-t border-(--color-line) bg-(--color-bg-elev)">
      {/* Marquee — used to say "Open to backend & platform roles" which read
          as a job-search pitch. Replaced with name + email (just identity,
          no solicitation) so the footer reads as a portfolio's sign-off. */}
      <Marquee speed={30} className="border-b border-(--color-line) py-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="mx-6 inline-flex items-center gap-6 text-display text-2xl text-(--color-fg)/80 md:text-3xl"
          >
            <span className="text-(--color-accent)">✺</span>
            {SITE.name}
            <span className="text-(--color-accent)">✺</span>
            {SITE.email}
          </span>
        ))}
      </Marquee>

      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-x-6 gap-y-10 px-6 py-16 md:px-10">
        <div className="col-span-12 md:col-span-6">
          <p className="font-display text-3xl tracking-tight md:text-4xl">
            {SITE.name}
          </p>
          <p className="text-eyebrow mt-3">{SITE.location}</p>
        </div>

        <div className="col-span-6 md:col-span-3">
          <p className="text-eyebrow">Find</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                className="hover:text-(--color-accent)"
                href={SITE.social.github}
              >
                GitHub ↗
              </a>
            </li>
            <li>
              <a
                className="hover:text-(--color-accent)"
                href={SITE.social.linkedin}
              >
                LinkedIn ↗
              </a>
            </li>
            <li>
              <a
                className="hover:text-(--color-accent)"
                href={SITE.resume}
                target="_blank"
                rel="noopener noreferrer"
              >
                Résumé ↗
              </a>
            </li>
          </ul>
        </div>

        <div className="col-span-6 md:col-span-3">
          <p className="text-eyebrow">Reach</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                className="hover:text-(--color-accent)"
                href={`mailto:${SITE.email}`}
              >
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>

        <div className="col-span-12 mt-6 flex flex-col items-start justify-between gap-3 border-t border-(--color-line) pt-8 text-eyebrow md:flex-row md:items-center">
          <span>© {year} {SITE.name}</span>
          <span className="opacity-60">
            Crafted with Next.js, Three.js & GSAP · Hosted on Vercel
          </span>
        </div>
      </div>
    </footer>
  );
}
