"use client";

import dynamic from "next/dynamic";

// Client-only: the agent reads the viewport, pointer and storage. Loaded
// after the page so it never competes with the hero for the first paint.
const Orbit = dynamic(() => import("./Orbit").then((m) => m.Orbit), { ssr: false });

export function OrbitMount() {
  return <Orbit />;
}
