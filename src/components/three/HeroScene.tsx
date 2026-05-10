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
import { usePrefersReducedMotion, useIsMobile } from "@/lib/hooks";

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
  // Per-section shape morph. uStretch scales the sphere along x/y/z BEFORE
  // displacement, so the silhouette itself elongates / compresses (a true
  // shape change, not a scale). uNoiseFreq scales the Perlin sample
  // frequency — higher = busier, spikier surface. uNoiseAmp scales the
  // total displacement amplitude on top of uDistortion.
  uniform vec3 uStretch;
  uniform float uNoiseFreq;
  uniform float uNoiseAmp;

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
    // Per-section silhouette stretch: scale the base sphere position before
    // displacement so each section's "shape mood" reads as a true change in
    // form (elongated streak in Work, faceted spike-ball in Capabilities,
    // gathered pearl in About) rather than just a scale change.
    vec3 pos = position * uStretch;
    // Faster overall time + three noise scales = boiling water surface:
    // slow large-scale convection, medium turbulence, and fast micro-bubbles.
    // uNoiseFreq scales the frequencies together so the surface stays
    // multi-octave but moves through "calm" → "spiky" per section.
    float t = uTime * 0.55;
    float nf = uNoiseFreq;
    float n = cnoise(normal * (1.4 * nf) + vec3(t * 0.8, t * 0.6, -t * 0.5));
    float n2 = cnoise(normal * (3.0 * nf) + vec3(-t * 1.6, t * 1.9, t * 1.1));
    float n3 = cnoise(normal * (5.5 * nf) + vec3(t * 2.6, -t * 2.1, t * 2.3));
    // Cursor ripple: push the sphere outward where the cursor is "near" in xy.
    vec2 mDir = uMouse - normal.xy;
    float mDist = length(mDir);
    float ripple = sin(mDist * 8.0 - uTime * 3.0) * exp(-mDist * 3.0);
    // Click shockwave: a sharper, faster, larger-amplitude ripple radiating
    // from the cursor position, gated by uClickStrength which JS decays
    // exponentially after each click. Reads as a tap on the surface.
    float shock = sin(mDist * 5.0 - uTime * 8.0) * exp(-mDist * 1.4)
      * uClickStrength * 0.5;
    float displacement =
      (n * 0.5 + n2 * 0.35 + n3 * 0.18) * uDistortion * uNoiseAmp
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
    // Shape morph defaults — neutral organic sphere. Per-section targets
    // overwrite these via JS lerping in the Droplet useFrame.
    uStretch: { value: new THREE.Vector3(1, 1, 1) },
    uNoiseFreq: { value: 1 },
    uNoiseAmp: { value: 1 },
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
 * 0 while reading the middle of the page, 1 once the user is at the very
 * bottom. Smoothstepped over the final 0.8vh of scroll so the re-expansion
 * eases in rather than snapping. Drives the hero blob blooming back at the
 * end of the page (and the droplet fading out so they don't co-exist).
 */
function readBottomProgress(): number {
  if (typeof window === "undefined" || typeof document === "undefined") return 0;
  const vh = window.innerHeight;
  const docH = document.documentElement.scrollHeight;
  const maxScroll = Math.max(docH - vh, 1);
  const remaining = maxScroll - window.scrollY;
  const trigger = vh * 0.8;
  const raw = 1 - Math.min(Math.max(remaining / trigger, 0), 1);
  return raw * raw * (3 - 2 * raw);
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

/**
 * The whole homepage backdrop, in one continuously evolving shape.
 *
 * On scroll the hero shrinks, drifts to the corners along a Catmull-Rom
 * journey path, and morphs its silhouette + palette per section as the
 * user reads. At the bottom of the page it blooms back to its opening
 * pose — same shape, same place, full size — bookending the journey.
 *
 * Replaces the previous "pinch off into a separate Droplet" architecture.
 * One shape, one journey, five forms — easier to read as a single
 * narrative element rather than two parallel actors.
 *
 * On mobile the journey portion is skipped (no edge real estate to drift
 * along without overlapping the reading column). The blob fades out
 * during the middle of the page and re-blooms at the bottom.
 */
function HeroBlob({ isMobile }: { isMobile: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mouse = useSharedMouse();
  const uniforms = useMemo(() => makeBlobUniforms(0.6, 0.18, 1), []);
  useClickShock(mesh);
  useEasterEgg();

  // Per-section bounds — same structure the old Droplet used. Cached on
  // resize since layout can shift section offsets.
  const sectionsRef = useRef<Array<{ id: string; top: number; bottom: number }>>(
    [],
  );
  useEffect(() => {
    const collect = () => {
      sectionsRef.current = SECTION_IDS.map((id) => {
        const el = document.getElementById(id);
        const top = el?.offsetTop ?? 0;
        const height = el?.offsetHeight ?? 0;
        return { id, top, bottom: top + height };
      });
    };
    collect();
    window.addEventListener("resize", collect);
    return () => window.removeEventListener("resize", collect);
  }, []);

  // Last detected section — drives the one-shot pulse that fires when the
  // user crosses into a new section, so each shape change reads as a beat
  // rather than a silent slow lerp.
  const lastSectionRef = useRef<string>("top");

  // Cached pointer to the About-section portrait. Looked up once on mount
  // and refreshed lazily inside useFrame if the element disappears (e.g.
  // hot-reload). Drives the "ribbon orbiting the photo" mode.
  const portraitElRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    portraitElRef.current = document.querySelector<HTMLElement>(
      '[data-drop="portrait"]',
    );
  }, []);

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
    m.uniforms.uClickStrength.value = Math.max(
      m.uniforms.uClickStrength.value,
      egg,
    );

    const p = readDropProgress();
    const bottom = readBottomProgress();

    // Centeredness: 1 = centered hero pose (opening + closing); 0 = fully
    // committed to the journey. Smoothly drops as the user scrolls past
    // the hero band, then ramps back up when the bottom-progress kicks in.
    const drifted = smoothstep(0.15, 0.30, p);
    const centerness = Math.max(1 - drifted, bottom);

    // ─── Position ───────────────────────────────────────────────────────
    // Center anchor at world (0,0). Journey anchor follows the existing
    // path through the corners (desktop only). Portrait anchor wraps the
    // About portrait on a tangent orbit when the photo is in view.
    // Final position lerps between them by centerness + portraitVis.
    let journeyX = 0;
    let journeyY = 0;
    let orbitX = 0;
    let orbitY = 0;
    let orbitAngle = 0;
    let portraitVis = 0;

    if (!isMobile) {
      const cam = state.camera as THREE.PerspectiveCamera;
      const fovRad = (cam.fov * Math.PI) / 180;
      const visibleH = 2 * Math.tan(fovRad / 2) * cam.position.z;
      const visibleW = visibleH * cam.aspect;
      const sy = typeof window !== "undefined" ? window.scrollY : 0;
      const vh = typeof window !== "undefined" ? window.innerHeight : 1;
      const docH =
        typeof document !== "undefined"
          ? document.documentElement.scrollHeight
          : vh;

      // Journey starts the moment the blob has fully drifted out of the
      // hero pose (~scrollY = vh*0.20). Maps the rest of the scroll across
      // the spline so each section gets a clean stretch of the journey.
      const journeyStart = vh * 0.20;
      const journeyEnd = Math.max(docH - vh, journeyStart + 1);
      const journeyRaw = (sy - journeyStart) / (journeyEnd - journeyStart);
      const journeyClamped = Math.min(Math.max(journeyRaw, 0), 1);
      const journeyEased =
        journeyClamped * journeyClamped * (3 - 2 * journeyClamped);
      const [nx, ny] = pathPoint(journeyEased);
      const ndcX = nx * 2 - 1;
      const ndcY = -(ny * 2 - 1);
      journeyX = (ndcX * visibleW) / 2;
      journeyY = (ndcY * visibleH) / 2;

      // Portrait orbit — when the About photo is in view, the blob morphs
      // into a thin ribbon and orbits around the portrait. As the user
      // scrolls past, portraitVis fades back to 0 and the blob releases
      // back into its normal journey toward Work.
      let portraitEl = portraitElRef.current;
      if (!portraitEl) {
        portraitEl = document.querySelector<HTMLElement>(
          '[data-drop="portrait"]',
        );
        portraitElRef.current = portraitEl;
      }
      if (portraitEl) {
        const rect = portraitEl.getBoundingClientRect();
        if (rect.width > 0) {
          // Visibility peaks when the portrait's vertical center sits ~45%
          // down the viewport (the natural reading anchor). Falls to 0
          // when the photo is fully off-screen above or below.
          const portraitCenterY = rect.top + rect.height / 2;
          const sweetSpotY = vh * 0.45;
          const distance = Math.abs(portraitCenterY - sweetSpotY);
          portraitVis = 1 - smoothstep(vh * 0.18, vh * 0.55, distance);

          // Portrait center → world coordinates.
          const portraitCenterX = rect.left + rect.width / 2;
          const ndcPx = (portraitCenterX / window.innerWidth) * 2 - 1;
          const ndcPy = -((portraitCenterY / vh) * 2 - 1);
          const portraitWorldX = (ndcPx * visibleW) / 2;
          const portraitWorldY = (ndcPy * visibleH) / 2;

          // Orbit radius: a touch bigger than the portrait so the ribbon
          // actually goes around the photo edge rather than across it.
          const portraitWorldHalfW = (rect.width / window.innerWidth) * visibleW * 0.5;
          const portraitWorldHalfH = (rect.height / vh) * visibleH * 0.5;
          const orbitRadius =
            Math.max(portraitWorldHalfW, portraitWorldHalfH) * 1.35;

          orbitAngle = state.clock.elapsedTime * 0.85;
          orbitX = portraitWorldX + orbitRadius * Math.cos(orbitAngle);
          orbitY = portraitWorldY + orbitRadius * Math.sin(orbitAngle);
        }
      }
    }

    // Hero pose dominates while centered (opening + closing). Portrait
    // orbit only kicks in once the blob is committed to the journey, so
    // the hero never gets disrupted.
    const orbitInfluence = portraitVis * (1 - centerness);
    const baseX = journeyX * (1 - centerness);
    const baseY = journeyY * (1 - centerness);
    const targetX = baseX * (1 - orbitInfluence) + orbitX * orbitInfluence;
    const targetY = baseY * (1 - orbitInfluence) + orbitY * orbitInfluence;
    const posK = lerpK(6, delta);
    mesh.current.position.x +=
      (targetX - mesh.current.position.x) * posK;
    mesh.current.position.y +=
      (targetY - mesh.current.position.y) * posK;

    // Tangent rotation — when in orbit, point the blob's long axis along
    // the orbit tangent so the ribbon traces around the portrait edge.
    // Lerp into/out of the rotation so the snap doesn't read as a jolt.
    const tangentZ = orbitAngle + Math.PI / 2;
    const targetRotZ = tangentZ * orbitInfluence;
    mesh.current.rotation.z +=
      (targetRotZ - mesh.current.rotation.z) * lerpK(4, delta);

    // ─── Scale ──────────────────────────────────────────────────────────
    // Centered pose = full hero size. Drifting on desktop = ~40% so the
    // blob still reads as a presence in the corner without dominating the
    // column. Mobile drifts to 0 (invisible) since there's no corner real
    // estate that doesn't overlap reading.
    const driftScale = isMobile ? 0 : 0.4;
    const targetScale = driftScale + (1 - driftScale) * centerness;
    const pinch = Math.sin(smoothstep(0, 0.15, p) * Math.PI) * 0.07;
    const k = lerpK(8, delta);
    const cur = mesh.current.scale.y;
    const ns = cur + (targetScale - cur) * k;
    mesh.current.scale.set(ns * (1 + pinch * 0.6), ns * (1 - pinch), ns);

    // ─── Opacity ────────────────────────────────────────────────────────
    // Desktop stays nearly opaque end-to-end (slight dim during the drift
    // so it sits comfortably under content). Mobile fully fades out
    // mid-page so it doesn't overlap reading.
    const targetOpacity = isMobile
      ? Math.max(centerness, 0)
      : Math.max(centerness, 0.78);
    m.uniforms.uOpacity.value +=
      (targetOpacity - m.uniforms.uOpacity.value) * k;

    // Distortion baseline ramps from 0.6 (full hero) toward 0.45 mid-page
    // so the small drifting form doesn't read as turbulent as the full
    // opening hero. Set outside the section block so it always lands.
    const baseDist = 0.6 - 0.15 * (1 - centerness);
    m.uniforms.uDistortion.value = baseDist + egg * 1.4;

    // ─── Section detection: color, shape, pulse ─────────────────────────
    const sections = sectionsRef.current;
    if (sections.length > 0) {
      const sy = typeof window !== "undefined" ? window.scrollY : 0;
      const vh = typeof window !== "undefined" ? window.innerHeight : 1;
      const center = sy + vh / 2;
      let activeId = "top";
      for (const s of sections) {
        if (center >= s.top && center < s.bottom) {
          activeId = s.id;
          break;
        }
      }

      // Color mood
      const palette = SECTION_MOOD[activeId] ?? SECTION_MOOD.top;
      const tColor = new THREE.Color(palette[0]);
      const cColor = new THREE.Color(palette[1]);
      const colorK = lerpK(1.2, delta);
      m.uniforms.uColorB.value.lerp(tColor, colorK);
      m.uniforms.uColorC.value.lerp(cColor, colorK);

      // Shape mood — silhouette stretch + noise frequency/amplitude.
      // During the portrait orbit, blend toward a thin elongated ribbon
      // so the blob reads as a streak going around the photo.
      const shape = SECTION_SHAPE[activeId] ?? SECTION_SHAPE.top;
      const sectionStretch = new THREE.Vector3(shape[0], shape[1], shape[2]);
      const ribbonStretch = new THREE.Vector3(2.6, 0.22, 0.22);
      const stretchTarget = sectionStretch
        .clone()
        .lerp(ribbonStretch, orbitInfluence);
      const ribbonNoiseFreq = 0.6;
      const ribbonNoiseAmp = 0.55;
      const noiseFreqTarget =
        shape[3] * (1 - orbitInfluence) + ribbonNoiseFreq * orbitInfluence;
      const noiseAmpTarget =
        shape[4] * (1 - orbitInfluence) + ribbonNoiseAmp * orbitInfluence;
      const shapeK = lerpK(1.4, delta);
      m.uniforms.uStretch.value.lerp(stretchTarget, shapeK);
      m.uniforms.uNoiseFreq.value +=
        (noiseFreqTarget - m.uniforms.uNoiseFreq.value) * shapeK;
      m.uniforms.uNoiseAmp.value +=
        (noiseAmpTarget - m.uniforms.uNoiseAmp.value) * shapeK;

      // Pulse on section change
      if (activeId !== lastSectionRef.current) {
        lastSectionRef.current = activeId;
        m.uniforms.uClickStrength.value = Math.max(
          m.uniforms.uClickStrength.value,
          0.85,
        );
      }
    }

    // Continuous slow spin keeps the surface alive whether the blob is
    // parked at hero or hovering on a journey waypoint mid-scroll.
    mesh.current.rotation.y += delta * 0.08;
    mesh.current.rotation.x += delta * 0.03;
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
 * Per-section color mood. As the user reads each section the droplet's
 * surface colors lerp toward that section's palette — subtle but the page
 * feels staged: violet in the hero, warmer amber over Work, cool cyan
 * over Capabilities, brand lime at the email finale.
 */
const SECTION_MOOD: Record<string, [string, string]> = {
  top: ["#8a5cff", "#c8ff00"],
  about: ["#9d6cff", "#c8ff00"],
  work: ["#ff7a3d", "#c8ff00"],
  capabilities: ["#3ad4ff", "#c8ff00"],
  contact: ["#c8ff00", "#8a5cff"],
};

/**
 * Per-section shape mood — the droplet's actual silhouette morphs as you
 * scroll through the page, not just its color. Each entry is
 * [stretchX, stretchY, stretchZ, noiseFreq, noiseAmp]:
 *
 * - top         organic baseline (matches the hero blob's shape)
 * - about       compact pearl — slight vertical lean, calmer surface
 * - work        horizontal streak — wide and elongated, more turbulent
 * - capabilities spike-ball — tight stretch but high-frequency, high-amp
 *                noise so the surface reads as crystalline / faceted
 * - contact     alive — bigger, brighter surface activity at the finale
 */
const SECTION_SHAPE: Record<string, [number, number, number, number, number]> = {
  top:          [1.0, 1.0, 1.0, 1.0, 1.0],
  about:        [0.9, 1.1, 0.9, 0.7, 0.8],
  work:         [1.55, 0.7, 0.9, 1.2, 1.05],
  capabilities: [1.0, 1.0, 1.0, 2.2, 1.4],
  contact:      [1.1, 1.1, 1.1, 1.1, 1.3],
};

const SECTION_IDS = ["top", "about", "work", "capabilities", "contact"];

/**
 * Path the droplet traces through the viewport as the page scrolls past
 * the hero. Each entry is a normalized viewport coordinate (0,0 = top-left,
 * 1,1 = bottom-right). The droplet glides along a Catmull-Rom spline
 * through these points, so it stays in your peripheral vision (always near
 * the edge, never over the reading column) while the page scrolls.
 *
 * Treat this as a single continuous gesture: top-right corner → down the
 * right edge → across the bottom → up the left edge → settles near the
 * email CTA. One smooth flowing motion the whole way down.
 */
const JOURNEY_PATH: ReadonlyArray<readonly [number, number]> = [
  [0.92, 0.13], // corner park (matches Phase A's parking spot)
  [0.96, 0.34], // upper right edge
  [0.93, 0.6], // mid right edge
  [0.84, 0.86], // bottom-right corner
  [0.5, 0.93], // bottom middle
  [0.16, 0.86], // bottom-left corner
  [0.07, 0.55], // mid left edge
  [0.22, 0.45], // drift into email area
];

/**
 * Catmull-Rom interpolation between two anchors with neighbor influence.
 * Centripetal-ish curve: smooth, no overshoot, stays close to control
 * points. Perfect for a drifting motion that feels organic but predictable.
 */
function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function pathPoint(progress: number): [number, number] {
  const segs = JOURNEY_PATH.length - 1;
  const total = progress * segs;
  const segIdx = Math.min(Math.floor(total), segs - 1);
  const t = total - segIdx;
  const p0 = JOURNEY_PATH[Math.max(segIdx - 1, 0)];
  const p1 = JOURNEY_PATH[segIdx];
  const p2 = JOURNEY_PATH[Math.min(segIdx + 1, JOURNEY_PATH.length - 1)];
  const p3 = JOURNEY_PATH[Math.min(segIdx + 2, JOURNEY_PATH.length - 1)];
  return [
    catmullRom(p0[0], p1[0], p2[0], p3[0], t),
    catmullRom(p0[1], p1[1], p2[1], p3[1], t),
  ];
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
  const isMobile = useIsMobile();
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
        {/* One persistent shape across the entire page — opens centered as
            the hero, shrinks + drifts along the journey path while morphing
            per section, then re-blooms centered at the bottom. Replaces the
            previous "pinch off into a separate droplet" architecture. */}
        <HeroBlob isMobile={isMobile} />
        {/* Particle cloud is desktop-only — fades out fast and doesn't add
            much value on a narrow viewport. */}
        {!isMobile && <Particles />}
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
