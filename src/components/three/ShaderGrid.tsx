"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Cursor-reactive shader plane. The fragment shader draws a procedural
 * gradient field warped by a vector field that's pushed by the cursor.
 * The field decays over time, leaving a smooth trail.
 */

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Fullscreen quad: position is already in [-1, 1] clip space.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uMouseVel;
  uniform float uVelDecay;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // hash + smooth noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  vec3 palette(float t) {
    vec3 a = vec3(0.04, 0.04, 0.06);
    vec3 b = vec3(0.55, 0.36, 1.0);    // violet
    vec3 c = vec3(0.78, 1.0, 0.0);     // lime accent
    return mix(mix(a, b, smoothstep(0.0, 0.6, t)),
               c, smoothstep(0.7, 1.0, t));
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= aspect;

    vec2 m = uMouse * 2.0 - 1.0;
    m.x *= aspect;

    float d = distance(uv, m);
    // mouse halo
    float halo = smoothstep(0.6, 0.0, d);

    // displacement towards cursor velocity
    vec2 dir = normalize(uv - m + 1e-4);
    float push = halo * 0.35;
    vec2 disp = dir * push - uMouseVel * 0.5 * halo;

    // animated noise field
    vec2 q = uv * 1.4 + disp;
    float n = fbm(q + uTime * 0.08);
    float n2 = fbm(q * 2.0 - uTime * 0.05);

    float t = smoothstep(0.2, 0.95, n * 0.6 + n2 * 0.4 + halo * 0.3);
    vec3 col = palette(t);

    // halo glow ring
    col += vec3(0.78, 1.0, 0.0) * halo * 0.18;
    col += vec3(0.55, 0.36, 1.0) * smoothstep(0.45, 0.0, d) * 0.3;

    // vignette
    col *= 1.0 - length(vUv - 0.5) * 0.6;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Plane() {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const target = useRef(new THREE.Vector2(0.5, 0.5));
  const current = useRef(new THREE.Vector2(0.5, 0.5));
  const vel = useRef(new THREE.Vector2(0, 0));

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
    const prev = current.current.clone();
    current.current.lerp(target.current, 0.12);
    vel.current.copy(current.current).sub(prev).multiplyScalar(20);
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uMouse.value.copy(current.current);
    m.uniforms.uMouseVel.value.copy(vel.current);
    m.uniforms.uResolution.value.set(state.size.width, state.size.height);
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVel: { value: new THREE.Vector2(0, 0) },
      uVelDecay: { value: 0.94 },
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

export function ShaderGrid() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Canvas
      orthographic
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 1], zoom: 1 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <Plane />
      </Suspense>
    </Canvas>
  );
}
