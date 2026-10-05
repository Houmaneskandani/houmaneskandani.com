"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type SpotlightTarget = { el: HTMLElement; key: number };

/**
 * A soft outline that hugs an element for a couple of seconds. It follows
 * the element while the page scrolls (re-measured each frame) so the glow
 * never detaches from the row it belongs to.
 */
export function Spotlight({ target, duration = 2600 }: { target: SpotlightTarget | null; duration?: number }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [active, setActive] = useState<SpotlightTarget | null>(null);

  useEffect(() => {
    if (!target) return;
    setActive(target);
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      setRect(target.el.getBoundingClientRect());
      if (performance.now() - start < duration) raf = requestAnimationFrame(tick);
      else setActive(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return (
    <AnimatePresence>
      {active && rect ? (
        <motion.div
          key={active.key}
          aria-hidden
          data-orbit-spotlight
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed z-[85] rounded-lg"
          style={{
            left: rect.left - 8,
            top: rect.top - 6,
            width: rect.width + 16,
            height: rect.height + 12,
            border: "1px solid rgba(200,255,0,0.55)",
            boxShadow: "0 0 0 1px rgba(200,255,0,0.12), 0 0 48px -12px rgba(200,255,0,0.55), inset 0 0 40px -30px rgba(200,255,0,0.35)",
            background: "linear-gradient(90deg, rgba(200,255,0,0.06), transparent 60%)",
          }}
        />
      ) : null}
    </AnimatePresence>
  );
}
