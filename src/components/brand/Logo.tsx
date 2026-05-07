"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const BASE = {
  hLeftX: 11,
  hRightX: 22,
  hY1: 9,
  hY2: 31,
  crossY: 20,
  sStart: 27,
  sCtrl: 14,
  sEnd: 27,
  kEndX1: 32,
  kEndY1: 11,
  kEndX2: 32,
  kEndY2: 29,
  dotX: 32,
  dotY: 11,
  dotR: 1.6,
  tilt: 0,
};

function jitter() {
  const r = (range: number) => (Math.random() - 0.5) * range;
  return {
    hLeftX: 11 + r(0.6),
    hRightX: 22 + r(0.6),
    hY1: 9 + r(0.6),
    hY2: 31 + r(0.6),
    crossY: 20 + r(0.5),
    sStart: 27 + r(1),
    sCtrl: 14 + r(2.2),
    sEnd: 27 + r(1),
    kEndX1: 32 + r(0.8),
    kEndY1: 11 + r(0.8),
    kEndX2: 32 + r(0.8),
    kEndY2: 29 + r(0.8),
    dotX: 32 + r(0.6),
    dotY: 11 + r(0.6),
    dotR: 1.6 + r(0.25),
    tilt: r(2.4),
  };
}

/**
 * HSK monogram — generative.
 *
 * Three letterforms living inside the same square, all reduced to their
 * dominant strokes and overlapped so the mark reads as an abstract sigil
 * first and the letters resolve on closer inspection. The mark is
 * subtly perturbed on every mount so two visits never see exactly the
 * same logo — small jitter on stroke positions, S-curve tension, K-slash
 * endpoints, and accent dot location. Looks identical at a glance, but
 * a careful eye catches the variation.
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
  // SSR uses BASE coords so the server HTML matches the first client render
  // (no hydration mismatch). After hydration, swap to a per-mount random
  // jitter so each visit shows a slightly different mark.
  const [j, setJ] = useState(BASE);
  useEffect(() => {
    setJ(jitter());
  }, []);

  return (
    <motion.svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      aria-label="HSK monogram"
      role="img"
      initial={animate ? { opacity: 0, scale: 0.8, rotate: -8 + j.tilt } : false}
      animate={animate ? { opacity: 1, scale: 1, rotate: j.tilt } : undefined}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
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

      <g stroke={stroke} strokeWidth="1.6" strokeLinecap="round" fill="none">
        <line x1={j.hLeftX} y1={j.hY1} x2={j.hLeftX} y2={j.hY2} />
        <line x1={j.hRightX} y1={j.hY1} x2={j.hRightX} y2={j.hY2} />
        <line x1={j.hLeftX} y1={j.crossY} x2={j.hRightX} y2={j.crossY} />

        <path
          d={`M${j.sStart} 11
             C ${j.sCtrl} 11, ${j.sCtrl} 19, ${j.sEnd} 19
             C ${j.sCtrl} 19, ${j.sCtrl} 27, ${j.sEnd} 27`}
        />

        <line
          x1={j.hRightX}
          y1={j.crossY}
          x2={j.kEndX1}
          y2={j.kEndY1}
          strokeOpacity="0.85"
        />
        <line
          x1={j.hRightX}
          y1={j.crossY}
          x2={j.kEndX2}
          y2={j.kEndY2}
          strokeOpacity="0.85"
        />
      </g>

      <circle
        cx={j.dotX}
        cy={j.dotY}
        r={j.dotR}
        fill="var(--color-accent, #c8ff00)"
      />
    </motion.svg>
  );
}
