// @ts-nocheck — ARCHIVED file. Type-checking disabled because the file
// contains version-drift errors (disableNormalPass was renamed in
// @react-three/postprocessing v3; MotionValue<number> typing changed in
// framer-motion v12). Not worth fixing on a path that isn't shipped. If you
// restore this hero, remove this line and chase the type errors then.
"use client";

/**
 * ⚠️ ARCHIVED — not imported anywhere as of this commit.
 *
 * Kept in-tree so the cinematic 5-beat scroll hero is recoverable. To restore
 * it, swap the import in src/app/page.tsx:
 *   - import { ParticleNameHero } from "@/components/three/ParticleNameHero";
 *   + import { RequestJourney } from "@/components/three/RequestJourney";
 *   ...
 *   - <ParticleNameHero />
 *   + <RequestJourney />
 *
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Cinematic scroll hero — "A Request's Journey".
 *
 * Five beats, scrubbed by scroll position:
 *   1. The spark    — a single point of light appears (the request).
 *   2. The gate     — middleware. Translucent plane with a scanning grid.
 *                     The request passes through.
 *   3. The badge    — auth. Three portals; the request is steered through the
 *                     gold one (its identity).
 *   4. The depth    — database. Camera tilts down into a vault of floating
 *                     data cubes; the request grabs one.
 *   5. The return + reveal — request rockets back to surface. Camera pulls
 *                            way back to show the whole system at scale, and
 *                            the headline text fades in.
 *
 * The outer <section> is 500vh tall to give the cinematic five screens of
 * scroll room. An inner sticky container pins the canvas + text overlay to
 * the viewport for the duration. Plays alongside Lenis smooth-scroll
 * without conflict — framer-motion's useScroll reads window scroll, not its
 * own scroller, so Lenis stays the source of truth.
 *
 * Replaces the old <PersistentDrop /> + <Hero /> pair. The SR-only h1 with
 * the SEO copy is preserved at the top of this section.
 */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { motion, useMotionValue, useTransform } from "framer-motion";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { SITE } from "@/lib/data";

// ── Palette (shared with the rest of the site) ────────────────────────────
const C = {
  bg:        new THREE.Color("#07070a"),
  bone:      new THREE.Color("#f5f3ee"),
  request:   new THREE.Color("#c8ff00"), // lime — the request
  authGold:  new THREE.Color("#ffb547"), // gold — the auth match
  authViolet:new THREE.Color("#8a5cff"), // alt identity (not ours)
  authBlue:  new THREE.Color("#42e2ff"), // alt identity (not ours)
  line:      new THREE.Color("#1e1e26"), // architectural surface, dim
};

// ── Shared scroll progress (0..1) ─────────────────────────────────────────
// Written by framer-motion's useScroll callback, read inside useFrame.
// Decouples React's render cadence from the 60fps animation loop.
const progress = { current: 0 };

// Beat windows — what fraction of total scroll each beat occupies.
const B = {
  spark:  [0.00, 0.18] as const,
  gate:   [0.18, 0.36] as const,
  badge:  [0.36, 0.54] as const,
  depth:  [0.54, 0.74] as const,
  reveal: [0.74, 1.00] as const,
};

// Linear remap. Returns 0..1 for t in [a..b], clamped.
function ramp(t: number, a: number, b: number) {
  if (b === a) return t < a ? 0 : 1;
  const v = (t - a) / (b - a);
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function smoothstep(t: number) { return t * t * (3 - 2 * t); }

// ────────────────────────────────────────────────────────────────────────
// SCENE — runs inside R3F's <Canvas>. Reads progress.current each frame
// and re-poses every object for the current scroll position.
// ────────────────────────────────────────────────────────────────────────
function Scene() {
  // Request — the protagonist light. A single instanced point we move along
  // a hand-authored path through the five beats.
  const requestRef = useRef<THREE.Mesh>(null);
  const requestLightRef = useRef<THREE.PointLight>(null);

  // Gate — a tall thin glass-like plane with a scrolling scan grid.
  const gateRef = useRef<THREE.Group>(null);
  const gateScanRef = useRef<THREE.ShaderMaterial>(null);

  // Auth portals — three doorway frames in a row at the badge beat.
  const portalsRef = useRef<THREE.Group>(null);

  // Depth — vertical infrastructure rods + a floating field of data cubes.
  const depthRef = useRef<THREE.Group>(null);
  const cubeFieldRef = useRef<THREE.InstancedMesh>(null);
  const carriedCubeRef = useRef<THREE.Mesh>(null);

  // Reveal — the wide pull-back, many parallel request paths.
  const cityRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.InstancedMesh>(null);

  // Camera handled directly (instead of OrbitControls) — drives the whole
  // cinematic. Position + look-at interpolated through 6 keyframes.
  const camRig = useRef<{ pos: THREE.Vector3; look: THREE.Vector3 }>({
    pos: new THREE.Vector3(0, 0, 6),
    look: new THREE.Vector3(0, 0, 0),
  });

  // Build instanced cube transforms once. The cube field reused throughout
  // the depth beat — too many to render as individual meshes.
  const cubeMatrices = useMemo(() => {
    const m: { pos: THREE.Vector3; rot: THREE.Euler; scale: number }[] = [];
    const rnd = (seed: number) => {
      // deterministic so the layout is stable across reloads
      const x = Math.sin(seed * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 60; i++) {
      m.push({
        pos: new THREE.Vector3(
          (rnd(i * 1.1) - 0.5) * 14,
          -3 - rnd(i * 2.3) * 10,
          -2 - rnd(i * 3.7) * 10,
        ),
        rot: new THREE.Euler(rnd(i * 4.1) * Math.PI, rnd(i * 5.3) * Math.PI, 0),
        scale: 0.25 + rnd(i * 6.7) * 0.35,
      });
    }
    return m;
  }, []);

  // Initialize cube field matrices once on mount.
  useEffect(() => {
    if (!cubeFieldRef.current) return;
    const dummy = new THREE.Object3D();
    cubeMatrices.forEach((c, i) => {
      dummy.position.copy(c.pos);
      dummy.rotation.copy(c.rot);
      dummy.scale.setScalar(c.scale);
      dummy.updateMatrix();
      cubeFieldRef.current!.setMatrixAt(i, dummy.matrix);
    });
    cubeFieldRef.current.instanceMatrix.needsUpdate = true;
  }, [cubeMatrices]);

  // Parallel-request lines for the reveal — many faint streaks visible
  // when the camera pulls back at the end.
  useEffect(() => {
    if (!linesRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const r = 8 + Math.random() * 18;
      dummy.position.set(Math.cos(a) * r, -2 + Math.random() * 4, Math.sin(a) * r);
      dummy.scale.set(0.02, 0.5 + Math.random() * 2.5, 0.02);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      linesRef.current.setMatrixAt(i, dummy.matrix);
    }
    linesRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const t = progress.current;
    const time = state.clock.elapsedTime;

    // ── Camera path ───────────────────────────────────────────────
    // Five keyframes — one per beat. Camera lerps smoothly between them.
    const keyframes: { t: number; pos: [number, number, number]; look: [number, number, number] }[] = [
      { t: 0.00, pos: [0, 0, 8],     look: [0, 0, 0]   },
      { t: 0.18, pos: [0, 0, 5],     look: [0, 0, -4]  },   // approaching gate
      { t: 0.36, pos: [0, 0, 3],     look: [0, 0, -6]  },   // through the gate
      { t: 0.54, pos: [0, 0.3, 2],   look: [0, 0, -8]  },   // portals
      { t: 0.74, pos: [0, -3, 1],    look: [0, -8, -6] },   // descending
      { t: 0.90, pos: [10, 14, 18],  look: [0, -2, -4] },   // pull back
      { t: 1.00, pos: [12, 16, 22],  look: [0, -2, -4] },   // settled
    ];
    let from = keyframes[0], to = keyframes[1];
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (t >= keyframes[i].t && t <= keyframes[i + 1].t) {
        from = keyframes[i];
        to = keyframes[i + 1];
        break;
      }
    }
    if (t >= keyframes[keyframes.length - 1].t) {
      from = to = keyframes[keyframes.length - 1];
    }
    const segT = smoothstep(ramp(t, from.t, to.t));
    state.camera.position.set(
      lerp(from.pos[0], to.pos[0], segT),
      lerp(from.pos[1], to.pos[1], segT),
      lerp(from.pos[2], to.pos[2], segT),
    );
    camRig.current.look.set(
      lerp(from.look[0], to.look[0], segT),
      lerp(from.look[1], to.look[1], segT),
      lerp(from.look[2], to.look[2], segT),
    );
    state.camera.lookAt(camRig.current.look);

    // ── BEAT 1 — The spark ────────────────────────────────────────
    // The request's path: appears at center, drifts forward through every
    // beat, ends back at the surface in the reveal.
    const sparkP = ramp(t, B.spark[0], B.spark[1]);
    const gateP  = ramp(t, B.gate[0],  B.gate[1]);
    const badgeP = ramp(t, B.badge[0], B.badge[1]);
    const depthP = ramp(t, B.depth[0], B.depth[1]);
    const revealP= ramp(t, B.reveal[0], B.reveal[1]);

    if (requestRef.current) {
      // Path: surface (0,0,0) → past the gate (0,0,-6) → through portals
      // (0,0,-8) → down into the depth (0,-8,-6) → return surface (0,0,0).
      let px = 0, py = 0, pz = 0, pscale = 0;

      if (t < B.spark[1]) {
        // Already visible at progress=0 so the page never opens to a blank
        // canvas; drifts forward through the beat 1 window.
        pscale = 1;
        pz = lerp(0, -3, smoothstep(sparkP));
      } else if (t < B.gate[1]) {
        pscale = 1;
        pz = lerp(-3, -6, smoothstep(gateP));
      } else if (t < B.badge[1]) {
        pscale = 1;
        pz = lerp(-6, -8, smoothstep(badgeP));
        // small wiggle as it enters the gold portal
        py = Math.sin(badgeP * Math.PI) * 0.15;
      } else if (t < B.depth[1]) {
        pscale = 1;
        pz = lerp(-8, -6, smoothstep(depthP));
        py = lerp(0, -8, smoothstep(depthP));
      } else {
        // reveal — rocket back to surface
        const r = smoothstep(revealP);
        pscale = lerp(1, 1.4, Math.sin(r * Math.PI)); // brief flare
        py = lerp(-8, 0, r);
        pz = lerp(-6, 0, r);
      }

      requestRef.current.position.set(px, py, pz);
      requestRef.current.scale.setScalar(pscale * 0.18);
      // Subtle breathing pulse
      const pulse = 1 + Math.sin(time * 4) * 0.06;
      requestRef.current.scale.multiplyScalar(pulse);

      if (requestLightRef.current) {
        requestLightRef.current.position.copy(requestRef.current.position);
        requestLightRef.current.intensity = pscale * 4;
      }
    }

    // ── BEAT 2 — The gate ─────────────────────────────────────────
    if (gateRef.current) {
      // Gate is at z = -5. Fully opaque at peak of beat 2, fades after.
      const opacity =
        t < B.spark[0] ? 0
        : t < B.gate[0] ? smoothstep(ramp(t, B.spark[1] - 0.05, B.gate[0]))
        : t < B.gate[1] ? 1 - smoothstep(ramp(t, B.gate[1] - 0.04, B.gate[1])) * 0.4
        : t < B.badge[1] ? 0.6 - smoothstep(ramp(t, B.gate[1], B.badge[1])) * 0.6
        : 0;
      gateRef.current.visible = opacity > 0.01;
      gateRef.current.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.material && "opacity" in mesh.material) {
          (mesh.material as THREE.Material & { opacity: number }).opacity = opacity;
        }
      });
      if (gateScanRef.current) {
        gateScanRef.current.uniforms.uTime.value = time;
        gateScanRef.current.uniforms.uIntensity.value = opacity;
      }
    }

    // ── BEAT 3 — Three portals ────────────────────────────────────
    if (portalsRef.current) {
      const opacity =
        t < B.gate[0] ? 0
        : t < B.badge[0] ? smoothstep(ramp(t, B.gate[1] - 0.04, B.badge[0]))
        : t < B.badge[1] ? 1
        : t < B.depth[1] ? 1 - smoothstep(ramp(t, B.badge[1], B.depth[0] + 0.05))
        : 0;
      portalsRef.current.visible = opacity > 0.01;
      portalsRef.current.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.material && "opacity" in mesh.material) {
          (mesh.material as THREE.Material & { opacity: number }).opacity = opacity;
        }
      });
      // Subtle individual pulse on each portal
      portalsRef.current.children.forEach((p, i) => {
        const s = 1 + Math.sin(time * 1.5 + i * 1.3) * 0.04;
        p.scale.setScalar(s);
      });
    }

    // ── BEAT 4 — Depth (cubes + carried cube) ─────────────────────
    if (depthRef.current) {
      const opacity =
        t < B.badge[0] ? 0
        : t < B.depth[0] ? smoothstep(ramp(t, B.badge[1] - 0.06, B.depth[0]))
        : t < B.depth[1] ? 1
        : t < B.reveal[1] ? 1 - smoothstep(ramp(t, B.depth[1], B.reveal[0] + 0.08)) * 0.4
        : 0.6;
      depthRef.current.visible = opacity > 0.01;
    }
    if (carriedCubeRef.current && requestRef.current) {
      // The "grabbed" cube — appears at end of depth beat, follows the
      // request back to the surface during reveal.
      const carry =
        t < B.depth[0] + 0.06 ? 0
        : t < B.depth[1] ? smoothstep(ramp(t, B.depth[0] + 0.06, B.depth[1]))
        : 1;
      carriedCubeRef.current.visible = carry > 0.01;
      carriedCubeRef.current.position.copy(requestRef.current.position);
      carriedCubeRef.current.position.x += 0.25;
      carriedCubeRef.current.rotation.x = time * 0.8;
      carriedCubeRef.current.rotation.y = time * 1.1;
      carriedCubeRef.current.scale.setScalar(0.18 * carry);
    }

    // ── BEAT 5 — Reveal (city + parallel lines) ───────────────────
    if (cityRef.current) {
      const opacity = smoothstep(ramp(t, B.depth[1] - 0.02, B.reveal[0] + 0.10));
      cityRef.current.visible = opacity > 0.01;
      cityRef.current.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.material && "opacity" in mesh.material) {
          (mesh.material as THREE.Material & { opacity: number }).opacity = opacity * 0.8;
        }
      });
    }
    if (linesRef.current) {
      const op = smoothstep(ramp(t, B.depth[1], B.reveal[0] + 0.12));
      (linesRef.current.material as THREE.Material & { opacity: number }).opacity = op * 0.55;
      // Slow rotation of the parallel-request field for a "still alive" feel
      linesRef.current.rotation.y = time * 0.04;
    }
  });

  // Gate scan shader — vertical line sweep + horizontal grid
  const gateUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uColor: { value: C.bone },
    }),
    [],
  );

  return (
    <>
      <ambientLight intensity={0.18} color={C.bone} />
      <directionalLight position={[6, 8, 4]} intensity={0.45} color={C.bone} />

      {/* ── BEAT 1 — The request itself (also persists through all beats) ── */}
      <mesh ref={requestRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={C.request}
          emissive={C.request}
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={requestLightRef} color={C.request} distance={6} decay={2} />

      {/* ── BEAT 2 — The gate ── */}
      <group ref={gateRef} position={[0, 0, -5]}>
        {/* Frame — vertical bone-white columns */}
        <mesh position={[-2, 0, 0]}>
          <boxGeometry args={[0.08, 4.5, 0.08]} />
          <meshStandardMaterial color={C.bone} transparent opacity={0} metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[2, 0, 0]}>
          <boxGeometry args={[0.08, 4.5, 0.08]} />
          <meshStandardMaterial color={C.bone} transparent opacity={0} metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.25, 0]}>
          <boxGeometry args={[4.08, 0.06, 0.08]} />
          <meshStandardMaterial color={C.bone} transparent opacity={0} metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, -2.25, 0]}>
          <boxGeometry args={[4.08, 0.06, 0.08]} />
          <meshStandardMaterial color={C.bone} transparent opacity={0} metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Scan plane — translucent panel with shader grid */}
        <mesh>
          <planeGeometry args={[3.9, 4.4]} />
          <shaderMaterial
            ref={gateScanRef}
            transparent
            uniforms={gateUniforms}
            vertexShader={`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              precision highp float;
              uniform float uTime;
              uniform float uIntensity;
              uniform vec3 uColor;
              varying vec2 vUv;
              void main() {
                // Horizontal grid lines
                float grid = step(0.96, fract(vUv.y * 12.0));
                // Sweeping scan line (top to bottom, loops)
                float scan = smoothstep(0.03, 0.0, abs(vUv.y - fract(uTime * 0.25)));
                // Edge falloff so it feels like a contained panel
                float edge = (1.0 - smoothstep(0.45, 0.5, abs(vUv.x - 0.5)))
                           * (1.0 - smoothstep(0.45, 0.5, abs(vUv.y - 0.5)));
                float a = (grid * 0.18 + scan * 0.55) * edge * uIntensity;
                gl_FragColor = vec4(uColor, a);
              }
            `}
          />
        </mesh>
      </group>

      {/* ── BEAT 3 — Three portals (auth) ── */}
      <group ref={portalsRef} position={[0, 0, -7]}>
        <Portal x={-2.4} color={C.authViolet} />
        <Portal x={0}    color={C.authGold} accent />
        <Portal x={2.4}  color={C.authBlue} />
      </group>

      {/* ── BEAT 4 — Depth: vertical rods + floating cube field ── */}
      <group ref={depthRef} position={[0, -5, -5]}>
        {/* Vertical structural rods — the database "infrastructure" */}
        {[-6, -3, 0, 3, 6].map((x, i) => (
          <mesh key={i} position={[x, 0, -2 + Math.sin(i) * 2]}>
            <cylinderGeometry args={[0.05, 0.05, 18, 8]} />
            <meshStandardMaterial color={C.bone} transparent opacity={0.35} metalness={0.2} roughness={0.7} />
          </mesh>
        ))}
        {/* Floating data cubes */}
        <instancedMesh ref={cubeFieldRef} args={[undefined, undefined, 60]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={C.bone}
            emissive={C.bone}
            emissiveIntensity={0.15}
            transparent
            opacity={0.6}
            metalness={0.3}
            roughness={0.5}
          />
        </instancedMesh>
      </group>

      {/* The single cube the request "grabs" and carries back up */}
      <mesh ref={carriedCubeRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={C.request}
          emissive={C.request}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>

      {/* ── BEAT 5 — Reveal: city of parallel paths + city floor ── */}
      <group ref={cityRef} position={[0, -2, -4]}>
        {/* A wide subtle floor that contextualizes the pulled-back shot */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
          <ringGeometry args={[6, 30, 64]} />
          <meshStandardMaterial color={C.bone} transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Many faint vertical streaks — parallel requests, the "thousands of
          paths" at the reveal. Instanced for performance. */}
      <instancedMesh ref={linesRef} args={[undefined, undefined, 120]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={C.request} transparent opacity={0} toneMapped={false} />
      </instancedMesh>

      <EffectComposer disableNormalPass>
        <Bloom intensity={0.85} luminanceThreshold={0.35} luminanceSmoothing={0.6} mipmapBlur />
      </EffectComposer>
    </>
  );
}

// Single auth portal — a torus frame.
function Portal({ x, color, accent }: { x: number; color: THREE.Color; accent?: boolean }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <torusGeometry args={[1.0, 0.04, 12, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={accent ? 2.4 : 0.9}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ────────────────────────────────────────────────────────────────────────
// HOST — outer scroll container + sticky inner + text overlay.
// ────────────────────────────────────────────────────────────────────────
export function RequestJourney() {
  const containerRef = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  // Manual scroll-progress measurement.
  //
  // We tried framer-motion's `useScroll({ target })` first — it kept missing
  // updates under Lenis smooth-scroll and emitting "container has static
  // position" warnings even when the target was clearly `position: relative`.
  // Measuring the section's bounding rect on each scroll/resize event is
  // 10 lines, has no edge cases, and feeds the same MotionValue interface
  // the text overlay uses for opacity ramps.
  const scrollYProgress = useMotionValue(0);

  useEffect(() => {
    const update = () => {
      const sec = containerRef.current;
      if (!sec) return;
      const rect = sec.getBoundingClientRect();
      const traveled = -rect.top;                       // pixels scrolled past section top
      const total = rect.height - window.innerHeight;   // total scroll range (last beat ends at end-end)
      const t = total > 0 ? traveled / total : 0;
      const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
      scrollYProgress.set(clamped);
      progress.current = clamped;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [scrollYProgress]);

  // Per-beat overlay text opacity — quick fade in, hold, quick fade out
  // so each line gets a brief solo moment. Tuned to overlap slightly with
  // the camera's natural pauses between beats.
  const o1 = useTransform(scrollYProgress, [0.02, 0.06, 0.14, 0.18], [0, 1, 1, 0]);
  const o2 = useTransform(scrollYProgress, [0.20, 0.24, 0.32, 0.36], [0, 1, 1, 0]);
  const o3 = useTransform(scrollYProgress, [0.38, 0.42, 0.50, 0.54], [0, 1, 1, 0]);
  const o4 = useTransform(scrollYProgress, [0.56, 0.60, 0.68, 0.72], [0, 1, 1, 0]);
  // Beat 5 — staged reveal across three substeps so the final headline lands
  const oA = useTransform(scrollYProgress, [0.78, 0.81, 0.86, 0.88], [0, 1, 1, 0]);
  const oB = useTransform(scrollYProgress, [0.86, 0.89, 0.92, 0.94], [0, 1, 1, 0]);
  const oC = useTransform(scrollYProgress, [0.93, 0.97, 1.00], [0, 1, 1]);

  if (reduced) {
    return <ReducedFallback />;
  }

  return (
    <section
      ref={containerRef}
      className="relative h-[500vh] w-full"
      aria-label="Hero — a request's journey through middleware, auth, database, and back"
    >
      {/* SR-only heading preserves the SEO copy the previous Hero had. */}
      <h1 className="sr-only">
        Houman Eskandani — Backend &amp; Cloud Platform Engineer.
        Building high-security, multi-tenant APIs and cloud platforms in Go,
        GraphQL, Python, Java, PostgreSQL, and Kubernetes. Currently shipping
        the GraphQL platform at The Vport; previously at IDEMIA on a
        card-personalization platform serving tier-1 U.S. banks.
      </h1>

      {/* Sticky inner — pinned to viewport for the duration of the scroll */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <Canvas
          gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
          dpr={[1, 1.6]}
          camera={{ position: [0, 0, 8], fov: 45, near: 0.1, far: 100 }}
        >
          <color attach="background" args={["#07070a"]} />
          <Scene />
        </Canvas>

        {/* ── Eyebrow (top-left), location/role tag like before ──────── */}
        <div className="pointer-events-none absolute left-6 top-28 md:left-10">
          <p className="text-eyebrow">
            <span className="text-(--color-accent)">●</span>{" "}
            <span className="ml-2">
              IRVINE, CA · OPEN TO BACKEND / PLATFORM ROLES
            </span>
          </p>
        </div>

        {/* ── Beat subtitles — center-low, film convention ─────────── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[22%] flex justify-center px-6">
          <div className="relative w-full max-w-3xl">
            <Subtitle style={{ opacity: o1 }}>Somewhere, someone taps.</Subtitle>
            <Subtitle style={{ opacity: o2 }}>First, it has to be allowed.</Subtitle>
            <Subtitle style={{ opacity: o3 }}>
              Every request carries an identity.
              <span className="mt-2 block text-(--color-muted)">
                Every identity opens different doors.
              </span>
            </Subtitle>
            <Subtitle style={{ opacity: o4 }}>
              Somewhere underneath is the answer it came for.
            </Subtitle>

            {/* Beat 5 — the staged final reveal */}
            <Subtitle style={{ opacity: oA }}>
              200 milliseconds. Round trip.
              <span className="mt-2 block text-(--color-muted)">
                The user sees nothing of this.
              </span>
            </Subtitle>
            <Subtitle style={{ opacity: oB }}>
              <span className="text-(--color-accent)">
                Backend is the invisible roads.
              </span>
            </Subtitle>

            {/* The actual headline — fades in last, sits center-screen */}
            <motion.div
              style={{ opacity: oC }}
              className="absolute inset-x-0 -top-32 text-center md:-top-48"
            >
              <p className="text-display text-5xl leading-[0.95] md:text-7xl">
                I build those roads.
              </p>
              <p className="mt-6 text-eyebrow">
                <span className="opacity-60">CURRENTLY AT</span>{" "}
                <span className="text-(--color-fg)">The Vport · IDEMIA before that</span>
              </p>
              <p className="mt-3 mx-auto max-w-md text-sm leading-relaxed text-(--color-muted) md:text-base">
                {SITE.tagline}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Scroll cue — vanishes once we're past beat 1 */}
        <motion.a
          href="#about"
          data-cursor="EXPLORE"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.06], [1, 0]) }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex flex-col items-center gap-2"
        >
          <span className="text-eyebrow">Scroll</span>
          <span className="relative block h-12 w-px overflow-hidden bg-(--color-line)">
            <span className="absolute inset-x-0 -top-full block h-full bg-(--color-accent) [animation:rj-cue_2.4s_var(--ease-expo-out)_infinite]" />
          </span>
        </motion.a>
      </div>

      <style jsx global>{`
        @keyframes rj-cue {
          0% { transform: translateY(0%); }
          60% { transform: translateY(200%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </section>
  );
}

// Subtle film-subtitle wrapper. Center-aligned, display font, room to
// breathe. Each beat's text gets the same baseline treatment.
function Subtitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
}) {
  return (
    <motion.p
      style={style}
      className="absolute inset-x-0 top-0 text-center text-display text-3xl leading-tight md:text-5xl"
    >
      {children}
    </motion.p>
  );
}

// Reduced-motion fallback — show the headline statically, no WebGL.
function ReducedFallback() {
  return (
    <section className="relative flex min-h-[100svh] w-full flex-col items-center justify-center px-6 py-32 text-center md:px-10">
      <h1 className="sr-only">
        Houman Eskandani — Backend &amp; Cloud Platform Engineer. Building
        high-security, multi-tenant APIs and cloud platforms in Go, GraphQL,
        Python, Java, PostgreSQL, and Kubernetes. Currently shipping the
        GraphQL platform at The Vport; previously at IDEMIA on a
        card-personalization platform serving tier-1 U.S. banks.
      </h1>
      <p className="text-eyebrow mb-8">
        <span className="text-(--color-accent)">●</span>{" "}
        <span className="ml-2">IRVINE, CA · OPEN TO BACKEND / PLATFORM ROLES</span>
      </p>
      <p className="text-display text-3xl md:text-5xl">
        <span className="text-(--color-accent)">Backend is the invisible roads.</span>
        <span className="mt-3 block">I build those roads.</span>
      </p>
      <p className="mt-6 max-w-md text-base leading-relaxed text-(--color-muted) md:text-lg">
        {SITE.tagline}
      </p>
    </section>
  );
}
