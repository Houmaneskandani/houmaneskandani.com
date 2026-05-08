"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PROJECTS, type Project } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";
import { SplitText } from "@/components/ui/SplitText";

export function Work() {
  const [hovered, setHovered] = useState<Project | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = previewRef.current;
    if (!el) return;
    el.style.left = `${e.clientX}px`;
    el.style.top = `${e.clientY}px`;
  };

  return (
    <section
      id="work"
      onMouseMove={onMove}
      className="relative w-full px-6 py-32 md:px-10 md:py-48"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-12 gap-x-6 gap-y-6">
          <div className="col-span-12 md:col-span-3">
            <p className="text-eyebrow">
              <span className="text-(--color-accent)">(02)</span> Selected Work
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

        <ul className="mt-20 border-t border-(--color-line)">
          {PROJECTS.map((p, i) => (
            <li
              key={p.id}
              data-drop="project"
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              className="group relative border-b border-(--color-line)"
            >
              <Reveal delay={i * 0.05}>
                <Link
                  href={p.href ?? `/work/${p.slug}`}
                  data-cursor="VIEW"
                  className="relative grid grid-cols-12 items-center gap-x-6 gap-y-4 px-1 py-7 md:py-10"
                >
                  {/* Standalone number column — desktop only. On mobile the
                      number rides as a small eyebrow above the title so the
                      title can use the full row width. */}
                  <span className="hidden text-eyebrow md:col-span-1 md:block">
                    {p.id}
                  </span>
                  <div className="col-span-12 md:col-span-6">
                    <p className="text-eyebrow mb-2 md:hidden">
                      <span className="text-(--color-accent)">{p.id}</span>
                      <span className="opacity-60">
                        {" "}· {p.year} · {p.role}
                      </span>
                    </p>
                    <h3 className="text-display text-[2rem] leading-[1.05] transition-transform duration-700 group-hover:translate-x-3 md:text-5xl">
                      {p.title}
                    </h3>
                  </div>
                  <div className="col-span-12 flex flex-wrap gap-2 md:col-span-3">
                    {p.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-(--color-line) px-3 py-1 text-[11px] uppercase tracking-widest text-(--color-muted)"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {/* Year/role — desktop only, mirrored above on mobile. */}
                  <div className="hidden text-eyebrow md:col-span-2 md:block md:text-right">
                    {p.year} · {p.role}
                  </div>

                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-(--color-accent) transition-transform duration-700 group-hover:scale-x-100"
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed z-30 hidden h-72 w-96 -translate-x-1/2 -translate-y-1/2 rounded-xl p-8 md:block"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${hovered.accent}40 0%, transparent 60%), linear-gradient(135deg, #0d0d12 0%, #1a1a22 100%)`,
              border: `1px solid ${hovered.accent}40`,
              boxShadow: `0 30px 80px -20px ${hovered.accent}30`,
            }}
          >
            <p className="text-eyebrow" style={{ color: hovered.accent }}>
              {hovered.id}
            </p>
            <p className="mt-3 text-display text-2xl leading-tight">
              {hovered.title}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
              {hovered.summary}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
