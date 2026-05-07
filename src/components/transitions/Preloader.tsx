"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

/**
 * Entry preloader. ~1.2s visible window where 14 small lime particles fly
 * in from random positions, converge to center, briefly form a dot, then
 * the whole overlay fades to reveal the page. Sets the tone before any
 * content paints. Runs once per browser session — sessionStorage gates it.
 */
export function Preloader() {
  const [show, setShow] = useState<boolean | null>(null);

  // Decide on first client render whether to show. Server returns null →
  // the markup matches; the actual overlay only mounts on the client after
  // the gate decision, avoiding a hydration mismatch.
  useEffect(() => {
    if (typeof sessionStorage === "undefined") {
      setShow(true);
      return;
    }
    const seen = sessionStorage.getItem("preloader_seen");
    if (seen) {
      setShow(false);
      return;
    }
    sessionStorage.setItem("preloader_seen", "1");
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 1200);
    return () => window.clearTimeout(t);
  }, []);

  // Stable random particle positions per mount.
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        startX: (Math.random() - 0.5) * 800,
        startY: (Math.random() - 0.5) * 600,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 0.18,
      })),
    [],
  );

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-[--color-bg]"
        >
          <div className="relative">
            {particles.map((p, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute block rounded-full bg-[--color-accent]"
                style={{
                  width: p.size,
                  height: p.size,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                  boxShadow: "0 0 14px var(--color-accent)",
                }}
                initial={{
                  x: p.startX,
                  y: p.startY,
                  opacity: 0,
                  scale: 0.6,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: [0, 1, 1, 0],
                  scale: [0.6, 1, 1.4, 0.4],
                }}
                transition={{
                  duration: 1.0,
                  delay: p.delay,
                  ease: [0.16, 1, 0.3, 1],
                  times: [0, 0.55, 0.85, 1],
                }}
              />
            ))}
            {/* The "formed" core dot — a slightly larger lime sphere that
                fades in once the particles converge, then bursts outward
                under the exit transition. */}
            <motion.span
              aria-hidden
              className="absolute block rounded-full bg-[--color-accent]"
              style={{
                width: 14,
                height: 14,
                marginLeft: -7,
                marginTop: -7,
                boxShadow: "0 0 30px var(--color-accent)",
              }}
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: [0, 0, 1, 0], scale: [0.2, 0.2, 1.2, 3] }}
              transition={{
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1],
                times: [0, 0.55, 0.78, 1],
              }}
            />
          </div>
          {/* Brand stamp at bottom — same editorial tone as the page
              transition curtain, so the entry feels consistent. */}
          <span className="text-eyebrow absolute bottom-8 left-8 text-[--color-fg]">
            <span className="text-[--color-accent]">●</span>
            <span className="ml-2">HOUMAN ESKANDANI</span>
          </span>
          <span className="text-eyebrow absolute bottom-8 right-8 text-[--color-fg]">
            PORTFOLIO ↗
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
