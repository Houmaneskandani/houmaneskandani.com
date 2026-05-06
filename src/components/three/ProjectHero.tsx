"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect, useState, Suspense } from "react";
import * as THREE from "three";

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Fullscreen quad in NDC.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uAccent;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // simple value noise
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v=0.0; float a=0.5;
    for (int i=0; i<5; i++) { v += a*noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    p += (uMouse - 0.5) * 0.15;
    float t = uTime * 0.06;
    float n = fbm(p * 1.6 + t);
    float n2 = fbm(p * 4.0 - t * 0.8);
    float band = smoothstep(0.25, 0.85, n*0.7 + n2*0.3);

    vec3 base = vec3(0.027, 0.027, 0.04);
    vec3 mid = mix(base, vec3(0.55, 0.36, 1.0), 0.55);
    vec3 col = mix(base, mid, band);
    col = mix(col, uAccent, smoothstep(0.78, 1.05, band));

    // subtle grain
    float g = hash(uv * uResolution + uTime) * 0.04;
    col += g - 0.02;

    // vignette
    col *= 1.0 - length(uv - 0.5) * 0.6;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Plane({ accent }: { accent: string }) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const target = useRef(new THREE.Vector2(0.5, 0.5));
  const current = useRef(new THREE.Vector2(0.5, 0.5));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(accent) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [accent],
  );

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
    current.current.lerp(target.current, 0.06);
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uMouse.value.copy(current.current);
    m.uniforms.uResolution.value.set(state.size.width, state.size.height);
  });

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

export function ProjectHero({ accent }: { accent: string }) {
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
        <Plane accent={accent} />
      </Suspense>
    </Canvas>
  );
}
