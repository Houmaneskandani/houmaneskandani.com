"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { PROJECTS, type Project } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";
import { SplitText } from "@/components/ui/SplitText";

const ProjectHero = dynamic(
  () => import("@/components/three/ProjectHero").then((m) => m.ProjectHero),
  { ssr: false },
);

// Preview card dimensions — kept in sync with the className below so we can
// position the card via inline left/top without relying on a CSS translate
// (framer-motion's animated transform would override Tailwind's translate
// utilities and leave the card off-screen).
const PREVIEW_W = 448; // tailwind w-[28rem]
const PREVIEW_H = 320; // tailwind h-80

export function Work() {
  const [hovered, setHovered] = useState<Project | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const cursor = useRef({ x: 0, y: 0 });

  // Position the card under the cursor without using CSS translate (which
  // framer-motion overwrites once the entrance animation settles). We track
  // the cursor at the document level so the card has a valid position the
  // moment it mounts — no flash off-screen on first hover.
  const place = (x: number, y: number) => {
    const el = previewRef.current;
    if (!el) return;
    el.style.left = `${x - PREVIEW_W / 2}px`;
    el.style.top = `${y - PREVIEW_H / 2}px`;
  };

  useEffect(() => {
    const onDocMove = (e: MouseEvent) => {
      cursor.current.x = e.clientX;
      cursor.current.y = e.clientY;
      if (hovered) place(e.clientX, e.clientY);
    };
    window.addEventListener("mousemove", onDocMove, { passive: true });
    return () => window.removeEventListener("mousemove", onDocMove);
  }, [hovered]);

  // When a row activates, snap the card to the last known cursor position so
  // it appears in the right place even before the next mousemove fires.
  useEffect(() => {
    if (hovered) place(cursor.current.x, cursor.current.y);
  }, [hovered]);

  return (
    <section
      id="work"
      className="relative w-full px-6 py-32 md:px-10 md:py-48"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-12 gap-x-6 gap-y-6">
          <div className="col-span-12 md:col-span-3">
            <p className="text-eyebrow">
              <span className="text-[--color-accent]">(02)</span> Selected Work
            </p>
          </div>
          <div className="col-span-12 md:col-span-9 md:col-start-4">
            <h2 className="text-display text-[8vw] leading-[1.02] md:text-[5vw]">
              <SplitText text="Things I helped" className="block" />
              <SplitText
                text="get to production."
                className="block opacity-70"
                delay={0.06}
              />
            </h2>
          </div>
        </div>

        <ul className="mt-20 border-t border-[--color-line]">
          {PROJECTS.map((p, i) => (
            <li
              key={p.id}
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              className="group relative border-b border-[--color-line]"
            >
              <Reveal delay={i * 0.05}>
                <Link
                  href={p.href ?? `/work/${p.slug}`}
                  data-cursor="VIEW"
                  className="relative grid grid-cols-12 items-center gap-x-6 px-1 py-8 md:py-10"
                >
                  <span className="col-span-2 text-eyebrow md:col-span-1">
                    {p.id}
                  </span>
                  <div className="col-span-10 md:col-span-6">
                    <h3 className="text-display text-3xl leading-[1.05] transition-transform duration-700 group-hover:translate-x-3 md:text-5xl">
                      {p.title}
                    </h3>
                  </div>
                  <div className="col-span-12 mt-2 flex flex-wrap gap-2 md:col-span-3 md:mt-0">
                    {p.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-[--color-line] px-3 py-1 text-[11px] uppercase tracking-widest text-[--color-muted]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="col-span-12 text-eyebrow md:col-span-2 md:text-right">
                    {p.year} · {p.role}
                  </div>

                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[--color-accent] transition-transform duration-700 group-hover:scale-x-100"
                  />
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {hovered ? (
          <motion.div
            ref={previewRef}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed z-30 hidden h-80 w-[28rem] overflow-hidden rounded-xl md:block"
            style={{
              border: `1px solid ${hovered.accent}55`,
              boxShadow: `0 30px 80px -20px ${hovered.accent}40`,
            }}
          >
            {/* Per-project shader scene, tinted by accent. Remounts per row
                so the shader picks up the new accent color cleanly. */}
            <div className="absolute inset-0">
              <ProjectHero key={hovered.id} accent={hovered.accent} />
            </div>
            {/* Bottom-fade for legibility */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(7,7,10,0.85) 0%, rgba(7,7,10,0.25) 35%, transparent 65%)",
              }}
            />
            <div className="relative flex h-full flex-col justify-end p-6">
              <p className="text-eyebrow" style={{ color: hovered.accent }}>
                {hovered.id} · {hovered.year}
              </p>
              <p className="mt-2 text-display text-2xl leading-tight">
                {hovered.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[--color-muted]">
                {hovered.summary}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
