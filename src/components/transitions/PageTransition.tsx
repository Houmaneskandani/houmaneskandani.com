"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Fluid page transition. The new page mounts behind a full-viewport
 * overlay; the overlay then collapses inward as a circular clip-path
 * centered on wherever the user last clicked an internal link, "wiping"
 * the new content into view. Reads as the persistent droplet expanding
 * to swallow the old page and then dilating away to reveal the next.
 *
 * Falls back to a viewport-center origin if the user navigated via a
 * means other than clicking a link (e.g. browser back, programmatic).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showCurtain, setShowCurtain] = useState(true);
  // Origin in viewport percentages. Captured on click ahead of navigation
  // so the wipe radiates from the spot the user actually pressed.
  const originRef = useRef({ x: 50, y: 50 });
  const [originSnapshot, setOriginSnapshot] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      // Only capture for internal navigations — external links open in a
      // new tab anyway and won't trigger a transition.
      if (
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !href.startsWith("/#")
      ) {
        originRef.current = {
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100,
        };
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    setOriginSnapshot(originRef.current);
    setShowCurtain(true);
    const t = window.setTimeout(() => setShowCurtain(false), 50);
    return () => window.clearTimeout(t);
  }, [pathname]);

  const startClip = `circle(150% at ${originSnapshot.x}% ${originSnapshot.y}%)`;
  const endClip = `circle(0% at ${originSnapshot.x}% ${originSnapshot.y}%)`;

  return (
    <>
      <AnimatePresence mode="wait">
        {showCurtain ? (
          <motion.div
            key={`curtain-${pathname}`}
            initial={{ clipPath: startClip }}
            animate={{ clipPath: endClip }}
            exit={{ clipPath: endClip }}
            transition={{
              duration: 1.05,
              ease: [0.83, 0, 0.17, 1],
              delay: 0.05,
            }}
            className="pointer-events-none fixed inset-0 z-[100] flex items-end justify-between px-8 pb-10"
            style={{
              background:
                "radial-gradient(circle at " +
                originSnapshot.x +
                "% " +
                originSnapshot.y +
                "%, rgba(138,92,255,0.45) 0%, rgba(13,13,18,0.98) 55%, var(--color-bg-elev) 100%)",
            }}
          >
            <span className="text-eyebrow text-[--color-fg]">
              <span className="text-[--color-accent]">●</span>
              <span className="ml-2">
                {pathname === "/" ? "HOME" : pathname.toUpperCase()}
              </span>
            </span>
            <span className="text-eyebrow text-[--color-fg]">PORTFOLIO ↗</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {children}
    </>
  );
}
