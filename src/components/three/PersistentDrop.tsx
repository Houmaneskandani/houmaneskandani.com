"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";

const HeroScene = dynamic(
  () => import("@/components/three/HeroScene").then((m) => m.HeroScene),
  { ssr: false },
);

/**
 * Site-wide WebGL backdrop for the homepage. One persistent shape opens
 * centered as the hero, drifts along a journey path as the user reads,
 * morphs per section, orbits the About portrait when in view, and
 * re-blooms at the bottom. See HeroScene for the full choreography.
 *
 * Sits behind a sibling "lens" div whose CSS backdrop-filter blurs +
 * desaturates whatever DOM content is behind it in real time, giving the
 * blob the visual character of a glass lens distorting the page text.
 * The lens follows the blob's projected screen position via an
 * imperative ref update inside useFrame (no React re-renders per frame).
 */
export function PersistentDrop() {
  const lensRef = useRef<HTMLDivElement>(null);
  return (
    // z-30 sits ABOVE the main content (z-10) so the lens div inside can
    // backdrop-filter the actual page text behind it. The canvas itself
    // is mostly transparent, so the page reads normally where the blob
    // isn't, and shows the lens-distorted view where it is.
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      {/* Lens div is painted FIRST so its backdrop-filter sees the page
          beneath the wrapper, and the canvas paints OVER the lens
          (blob on top of blurred page). */}
      <div
        ref={lensRef}
        className="absolute"
        style={{
          // Centered on the parent's (0, 0) — useFrame will translate it
          // to the blob's projected screen position each frame.
          left: 0,
          top: 0,
          width: 360,
          height: 360,
          marginLeft: -180,
          marginTop: -180,
          borderRadius: "50%",
          // The lens itself: real backdrop blur + saturation pulls the
          // page content behind it through a frosted-glass distortion.
          // Slight hue rotation gives the prismatic edge feel.
          backdropFilter: "blur(14px) saturate(1.7) hue-rotate(8deg)",
          WebkitBackdropFilter: "blur(14px) saturate(1.7) hue-rotate(8deg)",
          // A faint colored vignette inside the lens so it has presence
          // even where the blur alone wouldn't show much (over solid bg).
          background:
            "radial-gradient(circle at 50% 50%, rgba(200,255,0,0.04) 0%, rgba(138,92,255,0.06) 60%, transparent 100%)",
          // Hidden until the first frame writes a real transform.
          opacity: 0,
          transform: "translate(-9999px, -9999px) scale(0)",
          willChange: "transform, opacity",
          transition: "opacity 220ms ease-out",
        }}
      />
      <HeroScene lensRef={lensRef} />
    </div>
  );
}
