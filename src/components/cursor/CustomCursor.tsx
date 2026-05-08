"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.body.classList.add("cursor-active");

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;
    let scale = 1;
    let scaleCurrent = 1;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot.current)
        dot.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const interactive = t.closest<HTMLElement>(
        'a, button, [role="button"], [data-cursor]',
      );
      if (interactive) {
        scale = 2.6;
        const text = interactive.dataset.cursor;
        if (label.current) {
          label.current.textContent = text ?? "";
          label.current.style.opacity = text ? "1" : "0";
        }
      } else {
        scale = 1;
        if (label.current) {
          label.current.textContent = "";
          label.current.style.opacity = "0";
        }
      }
    };

    const onDown = () => (scale = 0.7);
    const onUp = () => (scale = 1);

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      scaleCurrent += (scale - scaleCurrent) * 0.2;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scaleCurrent})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.body.classList.remove("cursor-active");
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-(--color-accent) mix-blend-difference"
      />
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-9 w-9 rounded-full border border-(--color-fg) mix-blend-difference flex items-center justify-center"
        style={{ transition: "border-color 0.3s ease" }}
      >
        <div
          ref={label}
          className="text-[10px] font-mono uppercase tracking-widest text-(--color-fg) opacity-0 transition-opacity"
        />
      </div>
    </>
  );
}
