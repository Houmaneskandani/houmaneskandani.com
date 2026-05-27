"use client";

/**
 * Hero — "sands on the water".
 *
 * ~4000 fine grains scattered across a horizontal surface. The surface is a
 * living wave (three superimposed sin functions, slow phases) so the grains
 * ride a gentle swell. Your cursor projects onto the wave plane and pushes
 * grains away with full physics: radial repulsion, cursor-velocity wind
 * transfer, leading-edge bias, plus a small vertical kick so grains "jump"
 * off the surface like sand brushed by a finger. They fall back into the
 * wave via a spring force that always targets the CURRENT wave height —
 * which means even idle grains never sit still; they're always being
 * carried by the surface.
 *
 * Same theme as the rest of the site (#c8ff00 accent, #07070a bg). Same
 * text overlay (eyebrow, SplitText headlines, tagline, scroll cue) as the
 * earlier Hero.tsx — only the background scene is new.
 *
 * Replaces the cinematic five-beat <RequestJourney /> with one calm screen.
 */

import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion } from "framer-motion";
import * as THREE from "three";
import { SITE } from "@/lib/data";
import { SplitText } from "@/components/ui/SplitText";
import { usePrefersReducedMotion } from "@/lib/hooks";

// ── Theme RGB (matches globals.css --color-accent #c8ff00 / --color-fg #f5f3ee)
const ACCENT_RGB = [0.78, 1.0, 0.0] as const;
const BONE_RGB = [0.96, 0.95, 0.93] as const;

// ── PHYSICS CONSTANTS — tuned for the "sands on water" feel
const REPEL_RADIUS = 0.55; // fingertip-sized — only grains the cursor visually touches
const REPEL_STRENGTH = 0.04; // base radial push from cursor presence
const VERTICAL_KICK = 0.7; // extra upward velocity → grains jump off the surface
const VEL_TRANSFER = 1.2; // cursor velocity → grain velocity (wind / drag)
const LEADING_BIAS = 1.2; // extra push for grains in cursor's path of motion
const SPRING = 0.018; // pulls grains back to current wave height
const DAMPING = 0.91; // velocity friction (lower = settles faster)
const MAX_VEL = 0.5; // velocity clamp
const COLOR_LERP = 0.1;
const BRIGHTNESS_GAIN = 2.2;

// ── WAVE — three superimposed sin waves give an organic, never-repeating swell
function waveY(x: number, z: number, t: number) {
  return (
    0.13 * Math.sin(0.42 * x + 0.30 * t) +
    0.09 * Math.sin(0.34 * z + 0.40 * t) +
    0.06 * Math.sin(0.21 * (x + z) + 0.50 * t)
  );
}

// ── GRAIN FIELD — area & density. Wide enough to feel infinite on most screens.
const GRAIN_COUNT = 4000;
const AREA_X = 24; // x spread (camera frustum at z=0 with fov 50 from z=7 is ~12)
const AREA_Z = 16;

// ──────────────────────────────────────────────────────────────────────────
// R3F SCENE
// ──────────────────────────────────────────────────────────────────────────
function SandOnWaterScene({
  wrapperRef,
}: {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { camera } = useThree();
  const pointsRef = useRef<THREE.Points>(null);

  // Camera tilt — set once. We look down + forward so the surface fills the
  // lower 2/3 of the viewport (like a beach horizon line).
  useEffect(() => {
    camera.position.set(0, 3, 7);
    camera.lookAt(0, -0.6, -1);
  }, [camera]);

  // Build all per-grain buffers once.
  const data = useMemo(() => {
    const N = GRAIN_COUNT;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const baseColor = new Float32Array(N * 3);
    const groundX = new Float32Array(N); // fixed lateral home
    const groundZ = new Float32Array(N); // fixed depth home
    const vels = new Float32Array(N * 3);
    const invMass = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * AREA_X;
      const z = (Math.random() - 0.5) * AREA_Z;
      groundX[i] = x;
      groundZ[i] = z;

      // Initial position: scattered above the surface so they "rain in" on load
      positions[i * 3] = x + (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = 3 + Math.random() * 3;
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;

      // ~15% accent green, rest warm white. Slight desaturation on white so
      // they read as "grain" not "stars" against the dark bg.
      const accent = Math.random() < 0.15;
      const [r0, g0, b0] = accent ? ACCENT_RGB : BONE_RGB;
      baseColor[i * 3] = r0;
      baseColor[i * 3 + 1] = g0;
      baseColor[i * 3 + 2] = b0;
      colors[i * 3] = r0;
      colors[i * 3 + 1] = g0;
      colors[i * 3 + 2] = b0;

      // Mass: lighter grains drift further, heavier resist — natural variation
      const mass = 0.6 + Math.random() * 0.9;
      invMass[i] = 1.0 / mass;
    }
    return { N, positions, colors, baseColor, groundX, groundZ, vels, invMass };
  }, []);

  // Mouse tracking — listener fires on the wrapping div so it works even with
  // pointer-events:none on the canvas (so text above is still clickable).
  const mouseRef = useRef({
    inside: false,
    ndc: new THREE.Vector2(),
    world: new THREE.Vector3(999, 999, 999),
    prevWorld: new THREE.Vector3(999, 999, 999),
    vel: new THREE.Vector3(),
    speed: 0,
    lastMoveTime: 0,
  });
  const raycaster = useRef(new THREE.Raycaster());
  // Cursor projects onto the HORIZONTAL plane y=0 (NOT z=0 like before) —
  // that's the wave surface. Particles live on this plane (modulated by waveY).
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const onMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const inX = e.clientX >= rect.left && e.clientX <= rect.right;
      const inY = e.clientY >= rect.top && e.clientY <= rect.bottom;
      mouseRef.current.inside = inX && inY;
      if (!mouseRef.current.inside) return;
      mouseRef.current.ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.lastMoveTime = performance.now();
    };
    const onLeave = () => {
      mouseRef.current.inside = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [wrapperRef]);

  const startTime = useRef(performance.now());

  useFrame(() => {
    const t = (performance.now() - startTime.current) / 1000;

    // === MOUSE → WORLD (projected onto wave plane) + cursor velocity ===
    const ms = mouseRef.current;
    if (ms.inside) {
      raycaster.current.setFromCamera(ms.ndc, camera);
      raycaster.current.ray.intersectPlane(plane.current, ms.world);
      ms.vel.subVectors(ms.world, ms.prevWorld);
      ms.speed = ms.vel.length();
      if (ms.speed > 1.5) {
        ms.vel.multiplyScalar(1.5 / ms.speed);
        ms.speed = 1.5;
      }
      ms.prevWorld.copy(ms.world);
    } else {
      ms.world.set(999, 999, 999);
      ms.vel.set(0, 0, 0);
      ms.speed = 0;
    }
    // decay cursor velocity if mouse stopped moving
    if (performance.now() - ms.lastMoveTime > 50) {
      ms.vel.multiplyScalar(0.85);
      ms.speed = ms.vel.length();
    }
    const mDirX = ms.speed > 0.001 ? ms.vel.x / ms.speed : 0;
    const mDirZ = ms.speed > 0.001 ? ms.vel.z / ms.speed : 0;

    const { N, positions, colors, baseColor, groundX, groundZ, vels, invMass } =
      data;

    for (let i = 0; i < N; i++) {
      const im = invMass[i];
      const gx = groundX[i],
        gz = groundZ[i];
      // CURRENT wave height for this grain's ground position — recomputed
      // every frame so grains ride the moving surface.
      const homeY = waveY(gx, gz, t);

      let x = positions[i * 3],
        y = positions[i * 3 + 1],
        z = positions[i * 3 + 2];
      let vx = vels[i * 3],
        vy = vels[i * 3 + 1],
        vz = vels[i * 3 + 2];

      // Spring back to current wave position
      vx += (gx - x) * SPRING * im;
      vy += (homeY - y) * SPRING * im;
      vz += (gz - z) * SPRING * im;

      // Cursor interaction — distance is 3D from grain to cursor on the wave plane
      const dx = x - ms.world.x;
      const dy = y - ms.world.y;
      const dz = z - ms.world.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < REPEL_RADIUS * REPEL_RADIUS && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist,
          ny = dy / dist,
          nz = dz / dist;
        const falloff = 1 - dist / REPEL_RADIUS;

        // (1) radial push outward from cursor
        const f = falloff * falloff * REPEL_STRENGTH;
        vx += nx * f * im;
        vy += ny * f * im;
        vz += nz * f * im;

        // (2) vertical kick — grains jump off the surface like brushed sand
        vy += falloff * REPEL_STRENGTH * VERTICAL_KICK * im;

        // (3) wind: cursor velocity transfers to grains in the radius
        const drag = falloff * VEL_TRANSFER * im * (0.3 + ms.speed * 4);
        vx += ms.vel.x * drag;
        vz += ms.vel.z * drag;

        // (4) leading-edge bias: grains in cursor's path get an extra push
        if (ms.speed > 0.005) {
          const ahead = nx * mDirX + nz * mDirZ;
          if (ahead > 0) {
            const lead = ahead * falloff * LEADING_BIAS * ms.speed * im;
            vx += mDirX * lead;
            vz += mDirZ * lead;
          }
        }
      }

      // Damping
      vx *= DAMPING;
      vy *= DAMPING;
      vz *= DAMPING;

      // Clamp velocity
      const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (vMag > MAX_VEL) {
        const s = MAX_VEL / vMag;
        vx *= s;
        vy *= s;
        vz *= s;
      }

      // Integrate
      positions[i * 3] = x + vx;
      positions[i * 3 + 1] = y + vy;
      positions[i * 3 + 2] = z + vz;
      vels[i * 3] = vx;
      vels[i * 3 + 1] = vy;
      vels[i * 3 + 2] = vz;

      // Brightness modulation: moving grains glow (kinetic energy made visible)
      const energy = Math.min(1, vMag * BRIGHTNESS_GAIN);
      const boost = 1 + energy * 0.6;
      colors[i * 3] += (baseColor[i * 3] * boost - colors[i * 3]) * COLOR_LERP;
      colors[i * 3 + 1] +=
        (baseColor[i * 3 + 1] * boost - colors[i * 3 + 1]) * COLOR_LERP;
      colors[i * 3 + 2] +=
        (baseColor[i * 3 + 2] * boost - colors[i * 3 + 2]) * COLOR_LERP;
    }

    if (pointsRef.current) {
      const geo = pointsRef.current.geometry as THREE.BufferGeometry;
      (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  // Build geometry imperatively (live arrays mutated in-place every frame).
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(data.positions, 3),
    );
    geo.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    return geo;
  }, [data]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.92}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// HOST — section + text overlay (matches the original Hero.tsx structure so
// theme + copy stay identical).
// ──────────────────────────────────────────────────────────────────────────
export function ParticleNameHero() {
  const reduced = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  if (reduced) return <ReducedFallback />;

  return (
    <section
      id="top"
      className="relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden px-6 pb-12 pt-32 md:px-10"
    >
      {/* === 3D BACKGROUND — sand on a wave === */}
      <div ref={wrapperRef} className="absolute inset-0 -z-10">
        <Canvas
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          dpr={[1, 1.6]}
          camera={{ position: [0, 3, 7], fov: 50, near: 0.1, far: 100 }}
        >
          <SandOnWaterScene wrapperRef={wrapperRef} />
        </Canvas>
        {/* Soft fade to bg color at the bottom — anchors the overlay text */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-(--color-bg)" />
      </div>

      {/* === EYEBROW — top-left location/role tag === */}
      <div className="pointer-events-none absolute left-6 top-28 md:left-10">
        <p className="text-eyebrow">
          <span className="text-(--color-accent)">●</span>{" "}
          <span className="ml-2">
            IRVINE, CA · OPEN TO BACKEND / PLATFORM ROLES
          </span>
        </p>
      </div>

      {/* === HEADLINE + COPY === */}
      <div className="relative mx-auto w-full max-w-[1400px]">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="text-display text-[11vw] leading-[0.92] md:text-[7.5vw]"
        >
          {/* SEO-friendly h1 — invisible to sighted users, read by screen
              readers and search engines. */}
          <span className="sr-only">
            Houman Eskandani — Backend &amp; Cloud Platform Engineer. Building
            high-security, multi-tenant APIs and cloud platforms in Go,
            GraphQL, Python, Java, PostgreSQL, and Kubernetes. Currently
            shipping the GraphQL platform at The Vport; previously at IDEMIA
            on a card-personalization platform serving tier-1 U.S. banks.
          </span>
          <span aria-hidden>
            <SplitText text="Hi, I'm Houman." className="block" delay={0.1} />
            <SplitText
              text="Backend engineer."
              className="block text-(--color-accent)"
              delay={0.25}
            />
            <SplitText
              text="Building APIs and AI agents."
              className="block opacity-80"
              delay={0.4}
            />
          </span>
        </motion.h1>

        <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.0 }}
            className="col-span-12 md:col-span-5 md:col-start-7"
          >
            <p className="max-w-md text-base leading-relaxed text-(--color-muted) md:text-lg">
              {SITE.tagline}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="col-span-12 flex items-end justify-between md:col-span-12"
          >
            <a
              href="#work"
              data-cursor="EXPLORE"
              className="group inline-flex flex-col gap-2"
            >
              <span className="text-eyebrow">Scroll</span>
              <span className="relative block h-12 w-px overflow-hidden bg-(--color-line)">
                <span className="absolute inset-x-0 -top-full block h-full bg-(--color-accent) [animation:scroll-cue_2.4s_var(--ease-expo-out)_infinite]" />
              </span>
            </a>
            <div className="hidden text-right text-eyebrow md:block">
              <p className="opacity-60">Currently at</p>
              <p className="mt-1 text-(--color-fg)">
                The Vport · IDEMIA before that
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scroll-cue {
          0% {
            transform: translateY(0%);
          }
          60% {
            transform: translateY(200%);
          }
          100% {
            transform: translateY(200%);
          }
        }
      `}</style>
    </section>
  );
}

// Static, no-WebGL fallback for users with prefers-reduced-motion.
// Identical text + theme, no 3D scene.
function ReducedFallback() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden px-6 pb-12 pt-32 md:px-10"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-(--color-bg)" />

      <div className="pointer-events-none absolute left-6 top-28 md:left-10">
        <p className="text-eyebrow">
          <span className="text-(--color-accent)">●</span>{" "}
          <span className="ml-2">
            IRVINE, CA · OPEN TO BACKEND / PLATFORM ROLES
          </span>
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[1400px]">
        <h1 className="text-display text-[11vw] leading-[0.92] md:text-[7.5vw]">
          <span className="sr-only">
            Houman Eskandani — Backend &amp; Cloud Platform Engineer. Building
            high-security, multi-tenant APIs and cloud platforms in Go,
            GraphQL, Python, Java, PostgreSQL, and Kubernetes. Currently
            shipping the GraphQL platform at The Vport; previously at IDEMIA
            on a card-personalization platform serving tier-1 U.S. banks.
          </span>
          <span aria-hidden className="block">
            Hi, I&apos;m Houman.
          </span>
          <span aria-hidden className="block text-(--color-accent)">
            Backend engineer.
          </span>
          <span aria-hidden className="block opacity-80">
            Building APIs and AI agents.
          </span>
        </h1>

        <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-6">
          <p className="col-span-12 max-w-md text-base leading-relaxed text-(--color-muted) md:col-span-5 md:col-start-7 md:text-lg">
            {SITE.tagline}
          </p>
        </div>
      </div>
    </section>
  );
}
