"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, Suspense, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/hooks";

function StaticHeroFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(60% 60% at 50% 45%, rgba(138,92,255,0.45) 0%, transparent 60%), radial-gradient(40% 40% at 70% 65%, rgba(200,255,0,0.25) 0%, transparent 60%), linear-gradient(135deg, #07070a 0%, #0d0d12 100%)",
      }}
    />
  );
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDistortion;
  uniform float uRipple;
  uniform vec2 uMouse;

  varying vec3 vNormal;
  varying vec3 vPos;
  varying float vNoise;

  // Classic Perlin 3D noise by Stefan Gustavson, MIT
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}

  float cnoise(vec3 P){
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    return 2.2 * mix(n_yz.x, n_yz.y, fade_xyz.x);
  }

  void main() {
    vec3 pos = position;
    // Faster overall time + three noise scales = boiling water surface:
    // slow large-scale convection, medium turbulence, and fast micro-bubbles.
    float t = uTime * 0.55;
    float n = cnoise(normal * 1.4 + vec3(t * 0.8, t * 0.6, -t * 0.5));
    float n2 = cnoise(normal * 3.0 + vec3(-t * 1.6, t * 1.9, t * 1.1));
    float n3 = cnoise(normal * 5.5 + vec3(t * 2.6, -t * 2.1, t * 2.3));
    // Cursor ripple: push the sphere outward where the cursor is "near" in xy.
    vec2 mDir = uMouse - normal.xy;
    float mDist = length(mDir);
    float ripple = sin(mDist * 8.0 - uTime * 3.0) * exp(-mDist * 3.0);
    float displacement = (n * 0.5 + n2 * 0.35 + n3 * 0.18) * uDistortion
      + ripple * uRipple;
    pos += normal * displacement;
    pos.xy += uMouse * 0.08;

    vNormal = normalize(normalMatrix * normal);
    vPos = pos;
    vNoise = n;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying float vNoise;

  void main() {
    float fres = pow(1.0 - clamp(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.0);
    float band = smoothstep(-0.3, 0.4, vNoise);
    vec3 col = mix(uColorA, uColorB, band);
    col = mix(col, uColorC, fres);
    col += fres * 0.6;
    float r = length(vPos.xy) * 0.18;
    col *= 1.0 - r * 0.3;
    gl_FragColor = vec4(col, uOpacity);
  }
`;

function makeBlobUniforms(distortion: number, ripple: number, opacity: number) {
  return {
    uTime: { value: 0 },
    uDistortion: { value: distortion },
    uRipple: { value: ripple },
    uOpacity: { value: opacity },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uColorA: { value: new THREE.Color("#0a0a12") },
    uColorB: { value: new THREE.Color("#8a5cff") },
    uColorC: { value: new THREE.Color("#c8ff00") },
  };
}

function useSharedMouse() {
  const mouse = useRef(new THREE.Vector2(0, 0));
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return mouse;
}

function readDropProgress(): number {
  const sy = typeof window !== "undefined" ? window.scrollY : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 1;
  // Compress to 0.65vh so the drop completes faster — matches the energy of
  // the rest of the hero rather than dragging across a whole viewport.
  return Math.min(Math.max(sy / (vh * 0.65), 0), 1);
}

/**
 * Frame-rate independent lerp factor. `rate` is roughly "what fraction
 * approaches per second" — using exp keeps motion identical whether the
 * client renders at 60Hz, 120Hz, or drops to 30. Critical for the drop
 * separation reading the same on every machine.
 */
function lerpK(rate: number, delta: number): number {
  return 1 - Math.exp(-rate * delta);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function HeroBlob() {
  const mesh = useRef<THREE.Mesh>(null);
  const mouse = useSharedMouse();
  const uniforms = useMemo(() => makeBlobUniforms(0.6, 0.18, 1), []);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const m = mesh.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uMouse.value.lerp(mouse.current, lerpK(4, delta));

    const p = readDropProgress();

    // Phase 1 — pinch (0..0.18): hero builds tension as if surface tension
    // is bunching up before releasing the droplet. Returns to neutral by 0.18.
    const pinch = Math.sin(smoothstep(0, 0.18, p) * Math.PI) * 0.07;

    // Phase 2 — collapse (0.10..0.55): hero scale & opacity ease to 0 as the
    // droplet has now pinched off and is travelling.
    const fade = smoothstep(0.1, 0.55, p);
    const targetScale = 1 - fade;
    const targetOpacity = 1 - fade;

    const k = lerpK(8, delta);
    const cur = mesh.current.scale.y;
    const ns = cur + (targetScale - cur) * k;
    // Squash while pinching (X bulges out as Y compresses), then back to round.
    mesh.current.scale.set(ns * (1 + pinch * 0.6), ns * (1 - pinch), ns);
    m.uniforms.uOpacity.value +=
      (targetOpacity - m.uniforms.uOpacity.value) * k;

    mesh.current.rotation.y += delta * 0.06;
    mesh.current.rotation.x += delta * 0.02;
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.4, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

/**
 * Per-`data-drop` opacity so the droplet doesn't drown content. Sections
 * with a lot of small text get the lowest opacity; CTAs get the loudest.
 */
const DROP_OPACITY: Record<string, number> = {
  __corner: 0.55,
  portrait: 0.62,
  description: 0.32,
  experience: 0.4,
  project: 0.55,
  capability: 0.35,
  email: 0.7,
};

type Waypoint = {
  /** Center X / Y in viewport pixels, recomputed each frame. */
  cx: number;
  cy: number;
  /** Width / height in viewport pixels. */
  w: number;
  h: number;
  /** Document-Y (scroll position) where this waypoint is fully active. */
  trigger: number;
  /** Lookup key into DROP_OPACITY. */
  kind: string;
};

function Droplet() {
  const mesh = useRef<THREE.Mesh>(null);
  const mouse = useSharedMouse();
  const uniforms = useMemo(() => makeBlobUniforms(0.45, 0.14, 0), []);
  const lastPos = useRef(new THREE.Vector3());

  const waypointElsRef = useRef<HTMLElement[]>([]);
  useEffect(() => {
    const collect = () => {
      waypointElsRef.current = Array.from(
        document.querySelectorAll<HTMLElement>("[data-drop]"),
      );
    };
    collect();
    window.addEventListener("resize", collect);
    return () => window.removeEventListener("resize", collect);
  }, []);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const m = mesh.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uMouse.value.lerp(mouse.current, lerpK(3, delta));

    const p = readDropProgress();
    const cam = state.camera as THREE.PerspectiveCamera;
    const fovRad = (cam.fov * Math.PI) / 180;
    const visibleH = 2 * Math.tan(fovRad / 2) * cam.position.z;
    const visibleW = visibleH * cam.aspect;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1;
    const pxPerWorld = vh / visibleH;
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;

    const emerge = smoothstep(0.08, 0.22, p);

    // ─── Phase A — pinch off the hero and arc into the top-right corner.
    const cornerMargin = 0.85;
    const cornerSize = 0.4;
    const parkXworld = visibleW / 2 - cornerMargin;
    const parkYworld = visibleH / 2 - cornerMargin;
    const travel = smoothstep(0.1, 0.85, p);
    const arcCx = parkXworld * 0.35;
    const arcCy = parkYworld * 2.4;
    const omt = 1 - travel;
    const aX = 2 * omt * travel * arcCx + travel * travel * parkXworld;
    const aY = 2 * omt * travel * arcCy + travel * travel * parkYworld;
    const bulge = Math.sin(travel * Math.PI) * 0.08;
    const aScale = 0.4 + bulge;
    const aOpacity = 1 - 0.45 * travel;

    // ─── Phase B — scroll-driven continuous interpolation between
    // waypoints. Build the path each frame as: corner → wp1 → wp2 → … → wpN.
    // Position is a pure function of scroll inside this segment, so the
    // motion stays consistent regardless of framerate or scroll velocity.
    let bX = aX;
    let bY = aY;
    let bScaleX = aScale;
    let bScaleY = aScale;
    let bOpacity = aOpacity;

    const els = waypointElsRef.current;
    if (els.length > 0) {
      // Synthetic corner waypoint anchors the start of the journey at the
      // exact spot where Phase A left the droplet — so the handoff between
      // phases is seamless rather than a jump.
      const cornerCenterPx = {
        x: vw - cornerMargin * pxPerWorld,
        y: cornerMargin * pxPerWorld,
      };
      const cornerSizePx = cornerSize * 2 * 1.4 * pxPerWorld;
      const phaseAEndScroll = vh * 0.65; // matches readDropProgress() denominator
      const path: Waypoint[] = [
        {
          cx: cornerCenterPx.x,
          cy: cornerCenterPx.y,
          w: cornerSizePx,
          h: cornerSizePx,
          trigger: phaseAEndScroll,
          kind: "__corner",
        },
      ];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        path.push({
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          w: r.width,
          h: r.height,
          trigger: r.top + scrollY + r.height / 2 - vh / 2,
          kind: el.dataset.drop ?? "",
        });
      }
      // DOM order is mostly correct, but sort by trigger to be safe — handles
      // overlapping/out-of-order tags without surprises.
      path.sort((a, b) => a.trigger - b.trigger);

      // Find the segment we're in: between wp[i] and wp[i+1].
      let i = 0;
      while (i < path.length - 1 && scrollY > path[i + 1].trigger) i++;
      const from = path[i];
      const to = path[Math.min(i + 1, path.length - 1)];

      let t = 0;
      if (i >= path.length - 1 || scrollY >= to.trigger) {
        t = 1;
      } else if (scrollY <= from.trigger) {
        t = 0;
      } else {
        const span = to.trigger - from.trigger;
        t = span > 0 ? (scrollY - from.trigger) / span : 0;
      }
      // Smoothstep eases the arrival/departure on every segment so the
      // droplet doesn't bolt between adjacent rects at constant velocity.
      const eased = t * t * (3 - 2 * t);

      const cx = from.cx + (to.cx - from.cx) * eased;
      const cy = from.cy + (to.cy - from.cy) * eased;
      const w = from.w + (to.w - from.w) * eased;
      const h = from.h + (to.h - from.h) * eased;

      const ndcX = (cx / vw) * 2 - 1;
      const ndcY = -(((cy / vh) * 2) - 1);
      bX = (ndcX * visibleW) / 2;
      bY = (ndcY * visibleH) / 2;
      bScaleX = w / pxPerWorld / 2.8;
      bScaleY = h / pxPerWorld / 2.8;

      const opFrom = DROP_OPACITY[from.kind] ?? 0.5;
      const opTo = DROP_OPACITY[to.kind] ?? 0.5;
      bOpacity = opFrom + (opTo - opFrom) * eased;
    }

    // Handoff between Phase A and Phase B. A starts wholly in charge during
    // the hero pinch and arc; once the droplet has reached the corner, B
    // takes over. They share the corner state at the boundary so the swap
    // is invisible.
    const handoff = smoothstep(0.85, 1.0, p);
    const targetX = aX * (1 - handoff) + bX * handoff;
    const targetY = aY * (1 - handoff) + bY * handoff;
    const targetScaleX = aScale * (1 - handoff) + bScaleX * handoff;
    const targetScaleY = aScale * (1 - handoff) + bScaleY * handoff;
    const targetOpacity = emerge * (aOpacity * (1 - handoff) + bOpacity * handoff);

    // Position is a deterministic function of scroll → no lerp here. Lerp
    // would introduce lag and make the motion feel inconsistent; Lenis is
    // already smoothing scrollY at the source.
    mesh.current.position.set(targetX, targetY, 0);

    // Tiny breathing pulse so the droplet never reads as "frozen" while
    // the user pauses scrolling on a waypoint.
    const breath = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.015;
    const sx = emerge * targetScaleX * breath;
    const sy = emerge * targetScaleY * breath;
    const sz = emerge * ((targetScaleX + targetScaleY) / 2) * breath;
    mesh.current.scale.set(sx, sy, sz);

    m.uniforms.uOpacity.value +=
      (targetOpacity - m.uniforms.uOpacity.value) * lerpK(10, delta);

    // Slow continuous spin keeps the surface lively while parked.
    mesh.current.rotation.y += delta * 0.18;
    mesh.current.rotation.x += delta * 0.08;

    lastPos.current.copy(mesh.current.position);
  });

  return (
    <mesh ref={mesh} scale={0}>
      <icosahedronGeometry args={[1.4, 48]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

function Particles({ count = 600 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = Math.random() * 0.04 + 0.005;
    }
    return { positions, sizes };
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.04;
    ref.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.2) * 0.2;

    // Particles only really sell the hero halo; once the blob parks in the
    // corner they'd just be loose dots floating around it. Fade out fast.
    const sy = typeof window !== "undefined" ? window.scrollY : 0;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1;
    const raw = Math.min(Math.max(sy / (vh * 0.6), 0), 1);
    const target = 0.55 * (1 - raw);
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity += (target - mat.opacity) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        sizeAttenuation
        color="#f5f3ee"
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

export function HeroScene() {
  const [mounted, setMounted] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    // Defer Canvas mount until the browser is idle so the LCP text paints
    // first and Three.js parsing/init doesn't block the main thread.
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
      handle = w.requestIdleCallback(() => setMounted(true), { timeout: 800 });
    } else {
      timeoutId = setTimeout(() => setMounted(true), 200);
    }
    return () => {
      if (handle && typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(handle);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);
  if (!mounted) return <StaticHeroFallback />;
  if (reduced) return <StaticHeroFallback />;

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 3.6], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      fallback={<StaticHeroFallback />}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} />
        <HeroBlob />
        <Droplet />
        <Particles />
      </Suspense>
    </Canvas>
  );
}
