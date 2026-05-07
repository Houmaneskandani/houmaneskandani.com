"use client";

import dynamic from "next/dynamic";

const HeroScene = dynamic(
  () => import("@/components/three/HeroScene").then((m) => m.HeroScene),
  { ssr: false },
);

/**
 * Site-wide WebGL backdrop for the homepage. The blob fills the viewport at
 * scroll = 0 (hero) and drifts to the top-right corner as the user scrolls
 * past the first viewport — staying alive in peripheral vision while reading.
 *
 * Hidden below `md` so phones don't pay the WebGL battery cost.
 */
export function PersistentDrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden md:block"
    >
      <HeroScene />
    </div>
  );
}
