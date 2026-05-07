"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Warped grid: a procedural line lattice bent radially around the cursor.
 * Distinct from ShaderGrid (gradient noise) and FluidTrail (particle
 * trail) — this one's all geometry, with a chromatic-fringe edge tint.
 */

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // Distance to the nearest line of a grid with given period.
  float gridLine(vec2 p, float period, float thickness) {
    vec2 g = abs(fract(p / period - 0.5) - 0.5) * period;
    float d = min(g.x, g.y);
    return 1.0 - smoothstep(0.0, thickness, d);
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 uv = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);

    // Radial warp: pull grid coordinates toward the cursor with a falloff.
    vec2 d = uv - m;
    float r = length(d);
    float pull = exp(-r * 3.5) * 0.18;
    vec2 warpedUv = uv - normalize(d + 1e-4) * pull;

    // Animated drift so the lattice never feels static.
    warpedUv += vec2(sin(uTime * 0.15) * 0.02, cos(uTime * 0.12) * 0.02);

    float fine = gridLine(warpedUv, 0.07, 0.0035);
    float coarse = gridLine(warpedUv, 0.28, 0.006);

    // Chromatic fringe near the cursor — sample the line field with a tiny
    // RGB offset that grows with proximity.
    float fringe = smoothstep(0.5, 0.0, r) * 0.012;
    float rChan = gridLine(warpedUv + vec2(fringe, 0.0), 0.07, 0.0035);
    float bChan = gridLine(warpedUv - vec2(fringe, 0.0), 0.07, 0.0035);

    vec3 base = vec3(0.04, 0.04, 0.06);
    vec3 line = vec3(rChan, fine, bChan) * 0.85;
    vec3 col = base + line;

    // Coarse lines tinted with the lime accent for hierarchy.
    col += vec3(0.78, 1.0, 0.0) * coarse * 0.4;

    // Cursor halo glow.
    col += vec3(0.55, 0.36, 1.0) * smoothstep(0.45, 0.0, r) * 0.35;

    // Vignette.
    col *= 1.0 - length(vUv - 0.5) * 0.55;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Plane() {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const target = useRef(new THREE.Vector2(0.5, 0.5));
  const current = useRef(new THREE.Vector2(0.5, 0.5));

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.set(
        e.clientX / window.innerWidth,
        1 - e.clientY / window.innerHeight,
      );
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    current.current.lerp(target.current, 0.08);
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uMouse.value.copy(current.current);
    m.uniforms.uResolution.value.set(state.size.width, state.size.height);
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={ref}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function StaticWarpFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundColor: "#07070a",
        backgroundImage:
          "linear-gradient(rgba(245,243,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(245,243,238,0.06) 1px, transparent 1px), radial-gradient(50% 50% at 60% 40%, rgba(138,92,255,0.25), transparent 60%)",
        backgroundSize: "32px 32px, 32px 32px, 100% 100%",
      }}
    />
  );
}

export function WarpField() {
  const [mounted, setMounted] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (reduced) return <StaticWarpFallback />;

  return (
    <Canvas
      orthographic
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 1], zoom: 1 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      fallback={<StaticWarpFallback />}
    >
      <Suspense fallback={null}>
        <Plane />
      </Suspense>
    </Canvas>
  );
}
