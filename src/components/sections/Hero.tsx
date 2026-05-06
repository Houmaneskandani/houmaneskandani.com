"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { SITE } from "@/lib/data";
import { SplitText } from "@/components/ui/SplitText";

const HeroScene = dynamic(
  () => import("@/components/three/HeroScene").then((m) => m.HeroScene),
  { ssr: false },
);

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden px-6 pb-12 pt-32 md:px-10"
    >
      <div className="absolute inset-0 -z-10">
        <HeroScene />
      </div>

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-[--color-bg]" />

      <div className="pointer-events-none absolute left-6 top-28 md:left-10">
        <p className="text-eyebrow">
          <span className="text-[--color-accent]">●</span>{" "}
          <span className="ml-2">PORTFOLIO · 2026</span>
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[1400px]">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="text-display text-[14vw] leading-[0.86] md:text-[10.5vw]"
        >
          <SplitText text="Backend." className="block" delay={0.1} />
          <SplitText
            text="APIs."
            className="block text-[--color-accent]"
            delay={0.25}
          />
          <SplitText
            text="Cloud platform."
            className="block opacity-80"
            delay={0.4}
          />
        </motion.h1>

        <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.0 }}
            className="col-span-12 md:col-span-5 md:col-start-7"
          >
            <p className="max-w-md text-base leading-relaxed text-[--color-muted] md:text-lg">
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
              <span className="relative block h-12 w-px overflow-hidden bg-[--color-line]">
                <span className="absolute inset-x-0 -top-full block h-full bg-[--color-accent] [animation:scroll-cue_2.4s_var(--ease-expo-out)_infinite]" />
              </span>
            </a>
            <div className="hidden text-right text-eyebrow md:block">
              <p className="opacity-60">Currently shipping</p>
              <p className="mt-1 text-[--color-fg]">
                VCloud · GraphQL · GKE
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
