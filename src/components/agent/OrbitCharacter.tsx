"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, type MotionValue } from "framer-motion";

export type Mood =
  | "sleeping"
  | "idle"
  | "curious"
  | "thinking"
  | "speaking"
  | "moving"
  | "pointing"
  | "happy";

type MoodParams = {
  ring: number; // seconds per rotation
  orbit: number; // seconds per particle rotation
  glow: number; // 0..1
  eyes: "open" | "closed" | "narrow";
};

const MOODS: Record<Mood, MoodParams> = {
  sleeping: { ring: 48, orbit: 36, glow: 0.22, eyes: "closed" },
  idle: { ring: 16, orbit: 10, glow: 0.5, eyes: "open" },
  curious: { ring: 11, orbit: 7, glow: 0.62, eyes: "open" },
  thinking: { ring: 2.4, orbit: 1.7, glow: 0.9, eyes: "narrow" },
  speaking: { ring: 7, orbit: 4.5, glow: 0.75, eyes: "open" },
  moving: { ring: 3, orbit: 2, glow: 0.85, eyes: "open" },
  pointing: { ring: 9, orbit: 6, glow: 0.7, eyes: "open" },
  happy: { ring: 4, orbit: 2.5, glow: 1, eyes: "open" },
};

type Props = {
  size: number;
  mood: Mood;
  /** Where the orb wants to be (top-left corner, screen px). */
  goal: React.RefObject<{ x: number; y: number }>;
  /** Where it is — written every frame by the spring integrator here. */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Screen point the eyes should look at (e.g. a spotlighted element). */
  lookAt: { x: number; y: number } | null;
  reduced: boolean;
  onClick: () => void;
  label: string;
  expanded: boolean;
};

/**
 * The visible agent: a luminous core with two eyes, a thin rotating ring,
 * three orbiting particles, and a comet trail when it moves. SVG + one
 * requestAnimationFrame loop that writes transforms directly (no React
 * re-render per pointer move or per frame).
 */
export function OrbitCharacter({ size, mood, goal, x, y, lookAt, reduced, onClick, label, expanded }: Props) {
  const p = MOODS[mood];
  const eyesRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const lookRef = useRef(lookAt);
  lookRef.current = lookAt;
  const blinkRef = useRef({ next: 0, until: 0 });

  // Trail: three followers that lag behind the orb, each lazier than the
  // last. They read as a short comet tail only while moving.
  const t1x = useMotionValue(-200);
  const t1y = useMotionValue(-200);
  const t2x = useMotionValue(-200);
  const t2y = useMotionValue(-200);
  const t3x = useMotionValue(-200);
  const t3y = useMotionValue(-200);
  const trailRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  // Spring state (position lives in x / y; velocity here).
  const vel = useRef({ x: 0, y: 0 });
  const lastT = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    if (!reduced) window.addEventListener("pointermove", onMove, { passive: true });
    let raf = 0;
    // Critically-damped-ish spring: snappy departure, soft landing.
    const K = 110; // stiffness
    const C = 15; // damping
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, lastT.current ? (now - lastT.current) / 1000 : 0.016);
      lastT.current = now;
      const g = goal.current;
      let px = x.get();
      let py = y.get();
      if (reduced || (px < -100 && py < -100)) {
        // First frame (or reduced motion): appear in place, no flight.
        px = g.x;
        py = g.y;
        vel.current = { x: 0, y: 0 };
      } else {
        const ax = (g.x - px) * K - vel.current.x * C;
        const ay = (g.y - py) * K - vel.current.y * C;
        vel.current.x += ax * dt;
        vel.current.y += ay * dt;
        px += vel.current.x * dt;
        py += vel.current.y * dt;
        if (Math.abs(g.x - px) < 0.05 && Math.abs(vel.current.x) < 0.5) px = g.x;
        if (Math.abs(g.y - py) < 0.05 && Math.abs(vel.current.y) < 0.5) py = g.y;
      }
      x.set(px);
      y.set(py);
      // Followers.
      t1x.set(t1x.get() + (px - t1x.get()) * 0.32);
      t1y.set(t1y.get() + (py - t1y.get()) * 0.32);
      t2x.set(t2x.get() + (t1x.get() - t2x.get()) * 0.3);
      t2y.set(t2y.get() + (t1y.get() - t2y.get()) * 0.3);
      t3x.set(t3x.get() + (t2x.get() - t3x.get()) * 0.28);
      t3y.set(t3y.get() + (t2y.get() - t3y.get()) * 0.28);
      if (reduced) return;

      const cx = px + size / 2;
      const cy = py + size / 2;

      // Eyes: look at the spotlight target if any, else the pointer.
      const target = lookRef.current ?? pointer.current;
      let ex = 0;
      let ey = 0;
      if (target && p.eyes !== "closed") {
        const dx = target.x - cx;
        const dy = target.y - cy;
        const d = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, d / 160) * 2.4;
        ex = (dx / d) * reach;
        ey = (dy / d) * reach;
      }
      if (p.eyes === "narrow") ey -= 0.8; // glance up while thinking
      // Blink every 3–6 s for ~120 ms.
      if (now > blinkRef.current.next) {
        blinkRef.current.next = now + 3000 + Math.random() * 3000;
        blinkRef.current.until = now + 120;
      }
      const blinking = now < blinkRef.current.until;
      const sy = p.eyes === "closed" ? 0.12 : p.eyes === "narrow" ? 0.55 : blinking ? 0.1 : 1;
      if (eyesRef.current) {
        eyesRef.current.setAttribute("transform", `translate(${ex.toFixed(2)} ${ey.toFixed(2)}) scale(1 ${sy})`);
      }

      // Squash & stretch along the direction of travel.
      const vx = vel.current.x;
      const vy = vel.current.y;
      const speed = Math.hypot(vx, vy);
      if (ringRef.current) {
        const k = Math.min(speed / 3500, 0.32);
        const angle = (Math.atan2(vy, vx) * 180) / Math.PI;
        ringRef.current.setAttribute(
          "transform",
          speed > 40 ? `rotate(${angle.toFixed(1)}) scale(${(1 + k).toFixed(3)} ${(1 - k * 0.7).toFixed(3)})` : "",
        );
      }
      // Trail opacity follows speed.
      const o = Math.min(speed / 2500, 1);
      trailRefs.forEach((r, i) => {
        if (r.current) r.current.style.opacity = String(o * (0.55 - i * 0.15));
      });
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, size, p.eyes]);

  return (
    <>
      {!reduced
        ? [
            [t1x, t1y],
            [t2x, t2y],
            [t3x, t3y],
          ].map(([tx, ty], i) => (
            <motion.div
              key={i}
              ref={trailRefs[i]}
              aria-hidden
              className="pointer-events-none fixed left-0 top-0 z-[89] rounded-full bg-(--color-accent)"
              style={{
                x: tx,
                y: ty,
                width: size,
                height: size,
                opacity: 0,
                scale: 0.28 - i * 0.06,
                filter: "blur(1px)",
                boxShadow: "0 0 18px var(--color-accent)",
              }}
            />
          ))
        : null}

      <motion.button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-expanded={expanded}
        data-cursor="ORBIT"
        className="fixed left-0 top-0 z-[90] cursor-pointer rounded-full bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
        style={{ x, y, width: size, height: size }}
        whileTap={{ scale: 0.92 }}
        animate={mood === "happy" ? { scale: [1, 1.22, 0.96, 1] } : { scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg viewBox="-32 -32 64 64" width={size} height={size} className="block overflow-visible">
          <defs>
            <radialGradient id="orbit-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.55" />
              <stop offset="60%" stopColor="var(--color-accent)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="orbit-core" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#1a1a22" />
              <stop offset="100%" stopColor="#07070a" />
            </radialGradient>
          </defs>

          {/* Ambient glow — intensity is the mood. */}
          <circle
            r="30"
            fill="url(#orbit-glow)"
            style={{ opacity: p.glow, transition: "opacity 600ms ease" }}
          />

          <g ref={ringRef}>
            {/* Open ring: two arcs, rotating. */}
            <g
              style={{
                animation: reduced ? undefined : `orbit-spin ${p.ring}s linear infinite`,
                transformOrigin: "0 0",
                transition: "animation-duration 800ms ease",
              }}
            >
              <circle
                r="21"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeDasharray="52 20 36 24"
                opacity="0.9"
              />
            </g>
            {/* Three particles on a wider orbit. */}
            <g
              style={{
                animation: reduced ? undefined : `orbit-spin ${p.orbit}s linear infinite`,
                transformOrigin: "0 0",
              }}
            >
              <circle cx="26" cy="0" r="1.9" fill="var(--color-accent)" />
              <circle cx="-13" cy="22.5" r="1.4" fill="var(--color-accent)" opacity="0.8" />
              <circle cx="-13" cy="-22.5" r="1.1" fill="var(--color-accent)" opacity="0.6" />
            </g>
          </g>

          {/* Core */}
          <circle r="12.5" fill="url(#orbit-core)" stroke="rgba(200,255,0,0.55)" strokeWidth="1" />
          <circle r="12.5" fill="none" stroke="rgba(245,243,238,0.08)" strokeWidth="2.5" />

          {/* Eyes (pupils move; the group is transformed per frame). */}
          <g ref={eyesRef} style={{ transformOrigin: "0 0" }}>
            <rect x="-6.2" y="-4" width="3.4" height="7.2" rx="1.7" fill="var(--color-accent)" />
            <rect x="2.8" y="-4" width="3.4" height="7.2" rx="1.7" fill="var(--color-accent)" />
          </g>
        </svg>
      </motion.button>
    </>
  );
}
