"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useRef, Suspense, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { Vector2 } from "three";
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
  uniform float uClickStrength;
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
    // Click shockwave: a sharper, faster, larger-amplitude ripple radiating
    // from the cursor position, gated by uClickStrength which JS decays
    // exponentially after each click. Reads as a tap on the surface.
    float shock = sin(mDist * 5.0 - uTime * 8.0) * exp(-mDist * 1.4)
      * uClickStrength * 0.5;
    float displacement = (n * 0.5 + n2 * 0.35 + n3 * 0.18) * uDistortion
      + ripple * uRipple + shock;
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
    uClickStrength: { value: 0 },
    uOpacity: { value: opacity },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uColorA: { value: new THREE.Color("#0a0a12") },
    uColorB: { value: new THREE.Color("#8a5cff") },
    uColorC: { value: new THREE.Color("#c8ff00") },
  };
}

/**
 * Global pointer-down listener that tells every blob to punch a click
 * shockwave from the cursor position. Each blob installs its own copy of
 * this so they decay independently — keeps the responsibility local and
 * avoids a context provider just for one number.
 */
function useClickShock(meshRef: React.RefObject<THREE.Mesh | null>) {
  useEffect(() => {
    const onDown = () => {
      const mesh = meshRef.current;
      if (!mesh) return;
      const m = mesh.material as THREE.ShaderMaterial;
      if (!m?.uniforms?.uClickStrength) return;
      m.uniforms.uClickStrength.value = 1;
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, [meshRef]);
}

/**
 * Type "houman" anywhere on the page → the timestamp lands here. Blobs
 * read it each frame, compute time-since-trigger, and spike their
 * distortion / scale wildly for ~2.5 seconds before decaying back. The
 * easter egg is shared across all blobs so they react together.
 */
const easterEggRef = { triggered: 0 };

function useEasterEgg() {
  useEffect(() => {
    const seq = "houman";
    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      // Don't fire while user is typing in inputs.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      const c = e.key.toLowerCase();
      if (c === seq[progress]) {
        progress++;
        if (progress === seq.length) {
          easterEggRef.triggered = performance.now();
          progress = 0;
        }
      } else if (c === seq[0]) {
        progress = 1;
      } else {
        progress = 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

function eggIntensity(): number {
  if (!easterEggRef.triggered) return 0;
  const sec = (performance.now() - easterEggRef.triggered) / 1000;
  if (sec >= 2.5) return 0;
  return Math.max(0, 1 - sec / 2.5);
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
  useClickShock(mesh);
  useEasterEgg();

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const m = mesh.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uMouse.value.lerp(mouse.current, lerpK(4, delta));
    // Click shockwave decay: ~half-life 350ms.
    m.uniforms.uClickStrength.value *= Math.exp(-2 * delta);
    // Easter egg: typed "houman" → spike distortion + click strength so the
    // blob bursts and recovers over ~2.5s.
    const egg = eggIntensity();
    m.uniforms.uDistortion.value = 0.6 + egg * 1.4;
    m.uniforms.uClickStrength.value = Math.max(
      m.uniforms.uClickStrength.value,
      egg,
    );

    const p = readDropProgress();

    // Phase 1 — pinch (0..0.15): hero builds tension as if surface tension
    // is bunching up before releasing the droplet.
    const pinch = Math.sin(smoothstep(0, 0.15, p) * Math.PI) * 0.07;

    // Phase 2 — fast collapse (0.15..0.32): once the droplet has pinched
    // off, the hero rapidly contracts to nothing so there's never a moment
    // where the user sees a half-hero next to a fully-formed droplet.
    const fade = smoothstep(0.15, 0.32, p);
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
        <Particles />
        {/* Post: gentle bloom on the boiling-water highlights + a faint
            chromatic aberration that bleeds the violet/lime accents at the
            blob's silhouette. Tuned soft so it reads as cinematic glow,
            not a screen-space FX showcase. */}
        <EffectComposer multisampling={0}>
          {/* Bloom: only the brightest highlights bleed, narrow radius. The
              previous tuning (threshold 0.25, intensity 0.55) made the lime
              accent burn out into a fake-looking yellow halo around the blob.
              Tightened so the glow reads as a subtle inner light, not a glow
              effect plastered on top. */}
          <Bloom
            mipmapBlur
            intensity={0.28}
            luminanceThreshold={0.7}
            luminanceSmoothing={0.4}
            radius={0.55}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={new Vector2(0.0006, 0.0009)}
            radialModulation={false}
            modulationOffset={0}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
