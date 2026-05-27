"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { SITE } from "@/lib/data";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SplitText } from "@/components/ui/SplitText";

type Burst = { x: number; y: number; key: number };

function CopyBurst({ burst }: { burst: Burst }) {
  // Twelve particles spraying radially from the click point. Memoized per
  // burst so the angles/speeds stay stable across re-renders during the
  // ~700ms animation window.
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        angle: (i / 12) * Math.PI * 2 + Math.random() * 0.4,
        distance: 50 + Math.random() * 40,
        size: 4 + Math.random() * 4,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burst.key],
  );
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-50"
      style={{ left: burst.x, top: burst.y }}
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block rounded-full bg-(--color-accent)"
          style={{
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            boxShadow: "0 0 12px var(--color-accent)",
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: 0,
            scale: 1,
          }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

export function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 1.05]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.4, 1, 1]);

  const [copied, setCopied] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  const onCopyEmail = async (e: React.MouseEvent) => {
    if (!navigator.clipboard) return; // let the mailto: link fire
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      setBurst({ x: e.clientX, y: e.clientY, key: Date.now() });
      window.setTimeout(() => setCopied(false), 1800);
      window.setTimeout(() => setBurst(null), 800);
    } catch {
      // fallback: let the link's default mailto behavior happen
      window.location.href = `mailto:${SITE.email}`;
    }
  };

  return (
    <section
      id="contact"
      ref={ref}
      className="relative w-full overflow-hidden px-6 pb-24 pt-32 md:px-10 md:pb-32 md:pt-48"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <p className="text-eyebrow mb-12">
          <span className="text-(--color-accent)">(04)</span> Contact
        </p>

        <motion.div style={{ scale, opacity }} className="origin-left">
          {/* Was: "Hiring a backend engineer? Let's talk." — softened to a
              neutral portfolio invitation so the page doesn't read as a
              job-search pitch. */}
          <h2 className="text-display text-[14vw] leading-[0.9] md:text-[11vw]">
            <SplitText text="Say" className="block" />
            <SplitText
              text="hello."
              className="block text-(--color-accent)"
              delay={0.05}
            />
            <SplitText
              text="I'll reply."
              className="block opacity-80"
              delay={0.1}
            />
          </h2>
        </motion.div>

        <div className="mt-16 grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 md:col-span-7">
            <p className="text-eyebrow">Direct line</p>
            <div data-drop="email" className="relative mt-3">
              <MagneticButton
                href={`mailto:${SITE.email}`}
                onClick={() => {
                  // attached to the inner button click; the anchor click also fires
                }}
                cursorLabel={copied ? "COPIED" : "COPY"}
                className="text-display text-3xl leading-tight md:text-5xl"
                strength={0.18}
              >
                <button
                  type="button"
                  onClick={onCopyEmail}
                  className="cursor-pointer bg-transparent text-left"
                >
                  <span className="shimmer-text">{SITE.email}</span>
                </button>
              </MagneticButton>
              <AnimatePresence>
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="ml-3 inline-block align-middle text-eyebrow text-(--color-accent)"
                  >
                    ✓ COPIED
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
            <p className="mt-4 max-w-md text-sm text-(--color-muted)">
              Click to copy. Or grab the one-page CV below.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton
                href={SITE.resume}
                cursorLabel="DOWNLOAD"
                className="rounded-full border border-(--color-accent) bg-(--color-accent)/10 px-6 py-3 text-sm text-(--color-accent) transition-colors hover:bg-(--color-accent) hover:text-bg"
              >
                <span className="inline-flex items-center gap-2">
                  Download CV <span aria-hidden>↓</span>
                </span>
              </MagneticButton>
              <span className="text-eyebrow">PDF · 1 page · 2026</span>
            </div>
          </div>

          <div className="col-span-12 md:col-span-5 md:flex md:flex-col md:items-end md:justify-end">
            <p className="text-eyebrow mb-4">Elsewhere</p>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {[
                { label: "GitHub", href: SITE.social.github },
                { label: "LinkedIn", href: SITE.social.linkedin },
              ].map((s) => (
                <MagneticButton
                  key={s.label}
                  href={s.href}
                  cursorLabel="VISIT"
                  className="rounded-full border border-(--color-line) px-6 py-3 text-sm transition-colors hover:border-(--color-accent) hover:text-(--color-accent)"
                >
                  {s.label}
                  <span className="ml-2">↗</span>
                </MagneticButton>
              ))}
            </div>
            <p className="mt-6 max-w-xs text-right text-xs text-(--color-muted)">
              Based in {SITE.location}.
            </p>
          </div>
        </div>
      </div>
      <AnimatePresence>{burst ? <CopyBurst burst={burst} /> : null}</AnimatePresence>
    </section>
  );
}
