"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Curtain-style page transition. On route change, an overlay sweeps in,
 * then sweeps out from the new page. Bracketed by short "PORTFOLIO ↗"
 * stamp text, in line with the editorial tone of the rest of the site.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showCurtain, setShowCurtain] = useState(true);

  useEffect(() => {
    setShowCurtain(true);
    const t = window.setTimeout(() => setShowCurtain(false), 50);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showCurtain ? (
          <motion.div
            key={`curtain-${pathname}`}
            initial={{ y: "0%" }}
            animate={{ y: "-100%" }}
            exit={{ y: "-100%" }}
            transition={{
              duration: 1.1,
              ease: [0.87, 0, 0.13, 1],
              delay: 0.05,
            }}
            className="pointer-events-none fixed inset-0 z-[100] flex items-end justify-between bg-[--color-bg-elev] px-8 pb-10"
          >
            <span className="text-eyebrow text-[--color-fg]">
              <span className="text-[--color-accent]">●</span>{" "}
              <span className="ml-2">{pathname === "/" ? "HOME" : pathname.toUpperCase()}</span>
            </span>
            <span className="text-eyebrow text-[--color-fg]">PORTFOLIO ↗</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {children}
    </>
  );
}
