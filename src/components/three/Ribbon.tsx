"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Ribbon mesh — a thick tube swept along a Catmull-Rom curve that snakes
 * around `[data-drop]` content cards as the user scrolls. The curve is
 * built in *document space* (encoded as if scrollY = 0) and the entire
 * mesh is translated by scrollY each frame so the same mesh tracks the
 * page perfectly without per-frame geometry rebuilds.
 *
 * Rebuilds happen only on layout changes (resize) — content positions are
 * stable between resizes, so geometry is amortized.
 *
 * Designed to live inside the RibbonOverlay canvas, which sits ABOVE the
 * page content with mix-blend-mode: screen. Where the ribbon overlaps an
 * image / card, the screen blend brightens that content with the ribbon's
 * color — that's the "tints content" Lusion effect.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDistortion;
  varying vec3 vNormal;
  varying float vNoise;
  varying float vT;

  // Classic Perlin 3D noise (Stefan Gustavson, MIT)
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}

  float cnoise(vec3 P){
    vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
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
    float t = uTime * 0.4;
    // Three noise scales sampled along the tube — gives the surface that
    // boiling-water shimmer where the ribbon flows. The arc parameter (uv.y
    // when wrapped in TubeGeometry) is encoded in position.x of the curve,
    // but we just use position directly for noise input.
    float n = cnoise(pos * 0.6 + vec3(t * 0.6, t * 0.4, -t * 0.3));
    float n2 = cnoise(pos * 1.4 + vec3(-t * 1.1, t * 1.3, t * 0.9));
    float displacement = (n * 0.5 + n2 * 0.3) * uDistortion;
    pos += normal * displacement;

    vNormal = normalize(normalMatrix * normal);
    vNoise = n;
    vT = uv.x; // along-the-tube parameter

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vNormal;
  varying float vNoise;
  varying float vT;

  void main() {
    float fres = pow(1.0 - clamp(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 1.6);
    float band = smoothstep(-0.3, 0.5, vNoise);
    vec3 col = mix(uColorA, uColorB, band);
    col += fres * 0.4;
    // Color shifts subtly along the tube — gives the ribbon a sense of flow
    // (not just a uniform color worm).
    col = mix(col, uColorB, sin(vT * 18.0) * 0.08 + 0.08);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

type Anchor = { x: number; y: number };

/**
 * Build curve anchors that snake around each `[data-drop]` element.
 * Sides alternate left/right so the ribbon weaves across the column instead
 * of clinging to one edge. Coordinates are in WORLD units, encoded as if
 * scrollY = 0 — the mesh translates by scrollY per frame.
 */
function buildAnchors(
  vw: number,
  vh: number,
  pxPerWorld: number,
): Anchor[] {
  const toWorldX = (px: number) => (px - vw / 2) / pxPerWorld;
  const toWorldY = (docY: number) => (vh / 2 - docY) / pxPerWorld;

  const els = Array.from(
    document.querySelectorAll<HTMLElement>("[data-drop]"),
  );
  if (els.length === 0) return [];

  const anchors: Anchor[] = [];

  // Entry anchor: where the ribbon "drops in" from above the first content.
  // Placed near the right edge a little above the first card, in document
  // space so it scrolls with the page.
  const firstRect = els[0].getBoundingClientRect();
  const firstDocTop = firstRect.top + window.scrollY;
  anchors.push({
    x: toWorldX(vw * 0.92),
    y: toWorldY(firstDocTop - vh * 0.6),
  });
  anchors.push({
    x: toWorldX(vw * 0.88),
    y: toWorldY(firstDocTop - vh * 0.2),
  });

  // For each element, alternate which side we wrap around. Three anchors
  // per rect: above-outside, mid-outside, below-outside. The Catmull-Rom
  // curve through these naturally arcs around the rect.
  let wrapRight = true;
  const margin = 60; // pixels outside the rect's edge
  for (const el of els) {
    const r = el.getBoundingClientRect();
    const docTop = r.top + window.scrollY;
    const docBottom = r.bottom + window.scrollY;
    const docMid = (docTop + docBottom) / 2;
    const sideX = wrapRight ? r.right + margin : r.left - margin;

    anchors.push({
      x: toWorldX(sideX),
      y: toWorldY(docTop - 30),
    });
    anchors.push({
      x: toWorldX(sideX + (wrapRight ? margin * 0.4 : -margin * 0.4)),
      y: toWorldY(docMid),
    });
    anchors.push({
      x: toWorldX(sideX),
      y: toWorldY(docBottom + 30),
    });

    wrapRight = !wrapRight;
  }

  // Exit anchor: drift past the last element so the ribbon exits cleanly.
  const last = els[els.length - 1].getBoundingClientRect();
  const lastDocBottom = last.bottom + window.scrollY;
  anchors.push({
    x: toWorldX(vw * 0.5),
    y: toWorldY(lastDocBottom + vh * 0.4),
  });

  return anchors;
}

export function Ribbon() {
  const mesh = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.TubeGeometry | null>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistortion: { value: 0.18 },
      uOpacity: { value: 0 },
      uColorA: { value: new THREE.Color("#0a0a12") },
      uColorB: { value: new THREE.Color("#8a5cff") },
    }),
    [],
  );

  // Build/rebuild the tube geometry when the page layout settles or resizes.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const rebuild = () => {
      const fov = 45;
      const camZ = 3.6;
      const fovRad = (fov * Math.PI) / 180;
      const visibleH = 2 * Math.tan(fovRad / 2) * camZ;
      const pxPerWorld = window.innerHeight / visibleH;

      const anchors = buildAnchors(
        window.innerWidth,
        window.innerHeight,
        pxPerWorld,
      );
      if (anchors.length < 3) return;

      const points = anchors.map(
        (a) => new THREE.Vector3(a.x, a.y, 0),
      );
      const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);

      const segments = Math.min(400, anchors.length * 30);
      geometryRef.current?.dispose();
      const geom = new THREE.TubeGeometry(curve, segments, 0.22, 12, false);
      geometryRef.current = geom;
      if (mesh.current) {
        mesh.current.geometry = geom;
      }
    };

    // Initial build a tick after mount so layout has settled (Reveal anims
    // and font swaps don't shift element rects mid-build).
    const tInit = window.setTimeout(rebuild, 350);
    const tFollow = window.setTimeout(rebuild, 1500);
    window.addEventListener("resize", rebuild);
    return () => {
      window.clearTimeout(tInit);
      window.clearTimeout(tFollow);
      window.removeEventListener("resize", rebuild);
      geometryRef.current?.dispose();
    };
  }, []);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const m = mesh.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = state.clock.elapsedTime;

    // Translate the entire ribbon mesh by scrollY so the document-encoded
    // anchors slide into view as the user scrolls.
    const fov = (state.camera as THREE.PerspectiveCamera).fov;
    const fovRad = (fov * Math.PI) / 180;
    const visibleH = 2 * Math.tan(fovRad / 2) * state.camera.position.z;
    const pxPerWorld = window.innerHeight / visibleH;
    mesh.current.position.y = window.scrollY / pxPerWorld;

    // Fade in past the hero. While the hero blob is still center-stage the
    // ribbon would compete for attention; let the hero close out first.
    const heroEnd = window.innerHeight * 0.65;
    const fadeIn = Math.min(
      Math.max((window.scrollY - heroEnd * 0.6) / (heroEnd * 0.6), 0),
      1,
    );
    const targetOpacity = fadeIn;
    m.uniforms.uOpacity.value +=
      (targetOpacity - m.uniforms.uOpacity.value) * (1 - Math.exp(-6 * delta));
  });

  return (
    <mesh ref={mesh}>
      <bufferGeometry />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
