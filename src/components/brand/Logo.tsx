"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * HSK monogram.
 *
 * Three letterforms living inside the same square, all reduced to their
 * dominant strokes and overlapped so the mark reads as an abstract sigil
 * first and the letters resolve on closer inspection.
 *
 * Composition (40x40 viewBox):
 *  - H  → two verticals + horizontal cross-bar, full height (the "skeleton")
 *  - S  → continuous Bézier curve threading between the H verticals
 *  - K  → one vertical (shared) + diagonal slash extending to the right
 *  - A small lime accent dot, deliberately off-center, anchors the mark.
 */
export function Logo({
  size = 40,
  className,
  animate = true,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  const stroke = "currentColor";
  return (
    <motion.svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      aria-label="HSK monogram"
      role="img"
      initial={animate ? { opacity: 0, scale: 0.8, rotate: -8 } : false}
      animate={animate ? { opacity: 1, scale: 1, rotate: 0 } : undefined}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Outer rounded frame: gives the mark a "stamp" silhouette */}
      <rect
        x="2.5"
        y="2.5"
        width="35"
        height="35"
        rx="6"
        fill="none"
        stroke={stroke}
        strokeOpacity="0.2"
        strokeWidth="1"
      />

      {/* H-skeleton (two verticals + crossbar). Slight inward bias so the S
          can thread between them without the mark looking like a literal H. */}
      <g stroke={stroke} strokeWidth="1.6" strokeLinecap="round" fill="none">
        <line x1="11" y1="9" x2="11" y2="31" />
        <line x1="22" y1="9" x2="22" y2="31" />
        <line x1="11" y1="20" x2="22" y2="20" />

        {/* S-curve threading the H. Two stacked half-loops, compressed so it
            integrates rather than reads as a separate letter. */}
        <path
          d="M27 11
             C 14 11, 14 19, 27 19
             C 14 19, 14 27, 27 27"
        />

        {/* K diagonals — share the right H vertical (x=22) as their stem and
            slash outward. The crossing on the right edge creates the "X" that
            anchors the abstraction. */}
        <line x1="22" y1="20" x2="32" y2="11" strokeOpacity="0.85" />
        <line x1="22" y1="20" x2="32" y2="29" strokeOpacity="0.85" />
      </g>

      {/* Off-center accent — the brand spark */}
      <circle cx="32" cy="11" r="1.6" fill="var(--color-accent, #c8ff00)" />
    </motion.svg>
  );
}
