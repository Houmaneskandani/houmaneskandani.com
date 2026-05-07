"use client";

import dynamic from "next/dynamic";

const HeroScene = dynamic(
  () => import("@/components/three/HeroScene").then((m) => m.HeroScene),
  { ssr: false },
);

/**
 * Site-wide WebGL backdrop for the homepage. The blob fills the viewport at
 * scroll = 0 (hero), then a droplet pinches off and arcs to the top-right
 * corner as the user scrolls — staying alive in peripheral vision while
 * reading. Renders on all viewports; reduced-motion users get a static
 * gradient fallback inside HeroScene.
 */
export function PersistentDrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    >
      <HeroScene />
    </div>
  );
}
