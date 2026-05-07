"use client";

import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

// Defer the Ribbon mesh import so the WebGL chunk doesn't block LCP.
const Ribbon = dynamic(
  () => import("@/components/three/Ribbon").then((m) => m.Ribbon),
  { ssr: false },
);

/**
 * Overlay canvas mounted ABOVE the page content (z-30) with
 * `mix-blend-mode: screen` so the ribbon brightens / tints content where
 * it overlaps. Sits on top of <main> while still being non-interactive
 * (pointer-events-none) so links and buttons keep working.
 *
 * Reduced-motion users skip the WebGL chunk entirely.
 */
export function RibbonOverlay() {
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    type IdleHandle = number;
    type IdleWindow = Window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => IdleHandle;
      cancelIdleCallback?: (h: IdleHandle) => void;
    };
    const w = window as IdleWindow;
    let handle: IdleHandle;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (typeof w.requestIdleCallback === "function") {
      handle = w.requestIdleCallback(() => setMounted(true), { timeout: 1200 });
    } else {
      timeoutId = setTimeout(() => setMounted(true), 400);
    }
    return () => {
      if (handle && typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(handle);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (reduced || !mounted) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
      style={{ mixBlendMode: "screen" }}
    >
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 3.6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 4, 5]} intensity={0.9} />
          <Ribbon />
        </Suspense>
      </Canvas>
    </div>
  );
}
