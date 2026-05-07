import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SplitText } from "@/components/ui/SplitText";
import { Reveal } from "@/components/ui/Reveal";
import { FluidTrail } from "@/components/three/FluidTrail";

const ShaderGrid = dynamic(
  () => import("@/components/three/ShaderGrid").then((m) => m.ShaderGrid),
);
const WarpField = dynamic(
  () => import("@/components/three/WarpField").then((m) => m.WarpField),
);

export const metadata: Metadata = {
  title: "Lab — Houman Eskandani",
  description:
    "Interactive WebGL experiments and visual sketches by Houman Eskandani.",
};

const EXPERIMENTS = [
  {
    id: "01",
    name: "Vector field",
    detail:
      "Procedural noise warped by cursor velocity, decaying over time. WebGL fragment shader, ~120 LoC of GLSL.",
    tag: "WebGL · Shader",
  },
  {
    id: "02",
    name: "Fluid trail",
    detail:
      "Lightweight 2D trail using additive blending and a soft-erase pass. Runs alongside Three.js without contention.",
    tag: "Canvas 2D",
  },
  {
    id: "03",
    name: "Warp lattice",
    detail:
      "Procedural grid bent radially around the cursor, with a chromatic-fringe edge tint and a violet halo glow.",
    tag: "WebGL · Shader",
  },
];

export default function LabPage() {
  return (
    <main className="relative">
      <Navbar />

      <section className="relative isolate flex min-h-[80svh] flex-col justify-end overflow-hidden px-6 pb-12 pt-32 md:px-10">
        <div className="absolute inset-0 -z-10">
          <ShaderGrid />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-[--color-bg]" />

        <div className="absolute left-6 top-28 md:left-10">
          <p className="text-eyebrow">
            <span className="text-[--color-accent]">●</span>{" "}
            <span className="ml-2">/ LAB</span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[1400px]">
          <h1 className="text-display text-[14vw] leading-[0.86] md:text-[10.5vw]">
            <SplitText text="Sketches," className="block" />
            <SplitText
              text="experiments,"
              className="block opacity-80"
              delay={0.1}
            />
            <SplitText
              text="loose ends."
              className="block text-[--color-accent]"
              delay={0.2}
            />
          </h1>

          <div className="mt-12 grid grid-cols-12 gap-x-6">
            <p className="col-span-12 max-w-md text-base leading-relaxed text-[--color-muted] md:col-span-5 md:col-start-7">
              A scratchpad for things I&apos;m exploring outside of work — mostly
              shaders, simulations, and small interactive ideas. Move your
              cursor around above.
            </p>
          </div>
        </div>
      </section>

      {/* Experiments grid */}
      <section className="relative w-full px-6 py-32 md:px-10 md:py-40">
        <div className="mx-auto w-full max-w-[1400px]">
          <Reveal>
            <p className="text-eyebrow">
              <span className="text-[--color-accent]">(02)</span> Experiments
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {EXPERIMENTS.map((e, i) => (
              <Reveal key={e.id} delay={i * 0.07}>
                <article className="group relative aspect-[4/5] overflow-hidden rounded-md border border-[--color-line] bg-[--color-bg-elev] p-6">
                  <div className="absolute inset-0">
                    {i === 0 ? (
                      <ShaderGrid />
                    ) : i === 1 ? (
                      <FluidTrail />
                    ) : (
                      <WarpField />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[--color-bg]/95 via-[--color-bg]/30 to-transparent" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-eyebrow">{e.id}</span>
                      <span className="text-eyebrow">{e.tag}</span>
                    </div>
                    <div>
                      <h3 className="text-display text-3xl leading-tight md:text-4xl">
                        {e.name}
                      </h3>
                      <p className="mt-3 max-w-[28ch] text-sm text-[--color-muted]">
                        {e.detail}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full px-6 pb-24 md:px-10 md:pb-40">
        <div className="mx-auto flex w-full max-w-[1400px] items-end justify-between border-t border-[--color-line] pt-10">
          <p className="text-eyebrow">More on the way</p>
          <Link
            href="/"
            data-cursor="HOME"
            className="text-display text-3xl leading-tight transition-colors hover:text-[--color-accent] md:text-5xl"
          >
            ← Back home
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
