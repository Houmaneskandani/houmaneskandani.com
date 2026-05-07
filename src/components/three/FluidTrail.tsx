"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * 2D canvas fluid-trail. Lightweight cousin of WebGL fluid sims.
 * Cursor leaves a colored trail that diffuses & advects on a grid.
 * Cheap enough to coexist with a Three.js canvas elsewhere on the page.
 */
export function FluidTrail({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      hue: number;
      r: number;
    };
    const particles: P[] = [];

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > w || y > h) return;
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 1.6;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1,
          hue: Math.random() < 0.5 ? 70 : 270,
          r: Math.random() * 18 + 8,
        });
      }
      // cap pool
      if (particles.length > 500) particles.splice(0, particles.length - 500);
    };
    canvas.addEventListener("pointermove", onMove);

    const tick = () => {
      // motion-trail: faded, not full clear
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= 0.012;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const a = Math.max(p.life, 0) * 0.55;
        grad.addColorStop(0, `hsla(${p.hue}, 100%, 65%, ${a})`);
        grad.addColorStop(1, `hsla(${p.hue}, 100%, 65%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(60% 60% at 30% 30%, rgba(138,92,255,0.35) 0%, transparent 60%), radial-gradient(40% 40% at 75% 70%, rgba(200,255,0,0.18) 0%, transparent 60%), linear-gradient(135deg, #07070a 0%, #0d0d12 100%)",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
