"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { SplitText } from "@/components/ui/SplitText";
import { EXPERIENCE, EDUCATION } from "@/lib/data";

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Subtle parallax on desktop only; capped low enough to never overlap the
  // static eyebrow column, even on narrow viewports where the grid stacks.
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-4%"]);

  return (
    <section
      id="about"
      ref={ref}
      className="relative w-full px-6 py-32 md:px-10 md:py-48"
    >
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-x-6 gap-y-12">
        <div className="col-span-12 md:col-span-3">
          <p className="text-eyebrow">
            <span className="text-[--color-accent]">(01)</span> About
          </p>
        </div>

        <motion.div
          style={{ y }}
          className="col-span-12 mt-2 md:col-span-9 md:col-start-4 md:mt-0"
        >
          <h2 className="text-display text-[8vw] leading-[1.02] md:text-[5.6vw]">
            <SplitText text="I build the parts most people" className="block" />
            <SplitText
              text="never see — and feel only when they"
              className="block opacity-80"
              delay={0.05}
            />
            <SplitText
              text="break."
              className="block text-[--color-accent]"
              delay={0.1}
            />
          </h2>

          <div className="mt-16 grid grid-cols-12 gap-x-6 gap-y-8">
            {/* Photo slot — drop your portrait into /public/portrait.jpg
                and it will replace this gradient placeholder automatically. */}
            <Reveal className="col-span-12 md:col-span-4">
              <PhotoSlot />
            </Reveal>

            <div className="col-span-12 md:col-span-8 md:pl-2">
              <Reveal>
                <p className="text-base leading-relaxed text-[--color-muted] md:text-lg">
                  I&apos;m a backend engineer with 5+ years building
                  high-security, multi-tenant APIs — most of that time at
                  IDEMIA, on the card-issuance platform that ships secure
                  card transactions at bank scale for{" "}
                  <span className="text-[--color-fg]">Wells Fargo, Capital
                  One, and Citi</span>.
                </p>
              </Reveal>
              <Reveal delay={0.07} className="mt-5">
                <p className="text-base leading-relaxed text-[--color-muted] md:text-lg">
                  Today I&apos;m at <span className="text-[--color-fg]">The
                  Vport</span>, designing the GraphQL platform behind a
                  multi-tenant venue product — JWT auth, deny-by-default
                  RBAC, GKE operations, and the kind of observability that
                  lets a small team sleep at night.
                </p>
              </Reveal>
              <Reveal delay={0.14} className="mt-5">
                <p className="text-base leading-relaxed text-[--color-muted] md:text-lg">
                  On the side I build with AI. Most recently{" "}
                  <a
                    href="https://github.com/Houmaneskandani/ApplyAgent"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[--color-fg] underline decoration-[--color-line] underline-offset-4 transition-colors hover:text-[--color-accent] hover:decoration-[--color-accent]"
                  >
                    ApplyAgent
                  </a>
                  , an autonomous agent that fills out and submits real job
                  applications by reasoning over live DOM with Claude and
                  Playwright.
                </p>
              </Reveal>
              <Reveal delay={0.21} className="mt-5">
                <p className="text-base leading-relaxed text-[--color-muted] md:text-lg">
                  I obsess over the boring guarantees — idempotency,
                  ordering, durability — because that&apos;s where products
                  live or die at scale.
                </p>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.18} className="mt-16">
            <ul className="grid grid-cols-2 gap-y-6 border-t border-[--color-line] pt-8 md:grid-cols-4">
              {[
                ["5+", "yrs in backend"],
                ["1M+", "tx / day shipped"],
                ["3", "tier-1 banks supported"],
                ["6", "GKE namespaces operated"],
              ].map(([n, label]) => (
                <li key={label}>
                  <p className="text-display text-3xl md:text-5xl">{n}</p>
                  <p className="text-eyebrow mt-2">{label}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Experience timeline */}
          <Reveal delay={0.22} className="mt-20">
            <p className="text-eyebrow">Experience</p>
            <ul className="mt-6 divide-y divide-[--color-line] border-y border-[--color-line]">
              {EXPERIENCE.map((e) => (
                <li
                  key={`${e.company}-${e.period}`}
                  className="grid grid-cols-12 gap-x-6 py-5"
                >
                  <span className="col-span-3 text-sm text-[--color-muted] md:col-span-2">
                    {e.period}
                  </span>
                  <span className="col-span-9 text-sm text-[--color-fg] md:col-span-5">
                    {e.role}
                  </span>
                  <span className="col-span-6 mt-1 text-sm text-[--color-fg] md:col-span-3 md:mt-0">
                    {e.company}
                  </span>
                  <span className="col-span-6 mt-1 text-right text-sm text-[--color-muted] md:col-span-2 md:mt-0">
                    {e.location.split(" · ")[0]}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Education */}
          <Reveal delay={0.28} className="mt-12">
            <p className="text-eyebrow">Education</p>
            <ul className="mt-6 divide-y divide-[--color-line] border-y border-[--color-line]">
              {EDUCATION.map((e) => (
                <li
                  key={`${e.school}-${e.period}`}
                  className="grid grid-cols-12 gap-x-6 py-5"
                >
                  <span className="col-span-3 text-sm text-[--color-muted] md:col-span-2">
                    {e.period}
                  </span>
                  <span className="col-span-9 text-sm text-[--color-fg] md:col-span-5">
                    {e.degree}
                  </span>
                  <span className="col-span-12 mt-1 text-sm text-[--color-fg] md:col-span-5 md:mt-0">
                    {e.school}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </motion.div>
      </div>
    </section>
  );
}

function PhotoSlot() {
  // /public/portrait.jpg exists; the gradient stays as the loading background
  // and as the visual treatment that surrounds the photo.
  const hasPortrait = true;
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: photoProgress } = useScroll({
    target: wrapRef,
    offset: ["start end", "end start"],
  });
  // Ken Burns–style slow scale, plus a tiny vertical drift.
  const scale = useTransform(photoProgress, [0, 1], [1.02, 1.08]);
  const yDrift = useTransform(photoProgress, [0, 1], ["-1%", "1%"]);

  return (
    <div
      ref={wrapRef}
      className="group relative aspect-[4/5] overflow-hidden rounded-md border border-[--color-line] bg-[--color-bg-elev]"
    >
      {hasPortrait ? (
        <>
          <motion.div
            style={{ scale, y: yDrift }}
            className="absolute inset-0 transition-[filter] duration-700 [filter:saturate(0.85)_contrast(1.05)] group-hover:[filter:saturate(1)_contrast(1)]"
          >
            <Image
              src="/portrait.jpg"
              alt="Houman Eskandani"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              priority={false}
            />
          </motion.div>
          {/* Editorial gradient: subtle violet wash + bottom darkening for legibility */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 30% 20%, rgba(138,92,255,0.18) 0%, transparent 60%), linear-gradient(to top, rgba(7,7,10,0.6) 0%, transparent 35%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
            <span className="text-eyebrow text-[--color-fg]">
              Houman Eskandani
            </span>
            <span className="text-eyebrow text-[--color-accent]">●</span>
          </div>
        </>
      ) : (
        <>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 30% 20%, rgba(138,92,255,0.45) 0%, transparent 60%), radial-gradient(80% 60% at 80% 80%, rgba(200,255,0,0.25) 0%, transparent 60%), linear-gradient(135deg, #0d0d12 0%, #11111a 100%)",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-start justify-end p-5">
            <span className="text-eyebrow">Portrait · TBD</span>
            <span className="mt-2 text-xs text-[--color-muted]">
              Drop a photo at /public/portrait.jpg
            </span>
          </div>
        </>
      )}
    </div>
  );
}
