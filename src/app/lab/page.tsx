import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SplitText } from "@/components/ui/SplitText";
import { Reveal } from "@/components/ui/Reveal";
import { SIDE_PROJECTS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Side projects — Houman Eskandani",
  description:
    "Backend and AI side projects by Houman Eskandani — including ApplyAgent, an autonomous job-application agent powered by Claude.",
};

export default function SideProjectsPage() {
  return (
    <main className="relative">
      <Navbar />

      <section className="relative isolate flex min-h-[70svh] flex-col justify-end overflow-hidden px-6 pb-12 pt-32 md:px-10">
        {/* Static gradient background — no WebGL on this page anymore. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 70% 30%, rgba(138,92,255,0.32) 0%, transparent 60%), radial-gradient(40% 40% at 25% 75%, rgba(200,255,0,0.18) 0%, transparent 60%), linear-gradient(135deg, #07070a 0%, #0d0d12 100%)",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-(--color-bg)" />

        <div className="absolute left-6 top-28 md:left-10">
          <p className="text-eyebrow">
            <span className="text-(--color-accent)">●</span>{" "}
            <span className="ml-2">/ SIDE PROJECTS</span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[1400px]">
          <h1 className="text-display text-[11vw] leading-[0.92] md:text-[7.5vw]">
            <SplitText text="Things I build" className="block" />
            <SplitText
              text="on my own time."
              className="block text-(--color-accent)"
              delay={0.1}
            />
          </h1>

          <div className="mt-10 grid grid-cols-12 gap-x-6">
            <p className="col-span-12 max-w-md text-base leading-relaxed text-(--color-muted) md:col-span-5 md:col-start-7 md:text-lg">
              Most of what I build outside of work is exploratory — small
              tools, AI experiments, things I want to understand by writing
              them. The ones worth showing live here.
            </p>
          </div>
        </div>
      </section>

      {/* Side-projects list */}
      <section className="relative w-full px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto w-full max-w-[1400px]">
          <Reveal>
            <p className="text-eyebrow">
              <span className="text-(--color-accent)">(02)</span> Currently
              shipping
            </p>
          </Reveal>

          <ul className="mt-12 border-t border-(--color-line)">
            {SIDE_PROJECTS.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <li className="group relative border-b border-(--color-line)">
                  <Link
                    href={p.href ?? p.external ?? "#"}
                    target={p.href ? undefined : "_blank"}
                    rel={p.href ? undefined : "noreferrer"}
                    data-cursor={p.href ? "READ" : "VISIT"}
                    className="relative grid grid-cols-12 items-center gap-x-6 gap-y-4 px-1 py-8 md:py-12"
                  >
                    <span className="hidden text-eyebrow md:col-span-1 md:block">
                      {p.id}
                    </span>
                    <div className="col-span-12 md:col-span-7">
                      <p className="text-eyebrow mb-2 md:hidden">
                        <span className="text-(--color-accent)">{p.id}</span>
                        {p.status ? (
                          <span className="opacity-60"> · {p.status}</span>
                        ) : null}
                      </p>
                      <h3 className="text-display text-[2rem] leading-[1.05] transition-transform duration-700 group-hover:translate-x-3 md:text-5xl">
                        {p.name}
                      </h3>
                      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-(--color-muted) md:text-base">
                        {p.description}
                      </p>
                    </div>
                    <div className="col-span-12 flex flex-wrap gap-2 md:col-span-3">
                      {p.tag.split(" · ").map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-(--color-line) px-3 py-1 text-[11px] uppercase tracking-widest text-(--color-muted)"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="hidden text-eyebrow md:col-span-1 md:block md:text-right">
                      ↗
                    </div>

                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-(--color-accent) transition-transform duration-700 group-hover:scale-x-100"
                    />
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative w-full px-6 pb-24 md:px-10 md:pb-32">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 border-t border-(--color-line) pt-10 md:flex-row md:items-end md:justify-between">
          <p className="text-eyebrow">More on the way</p>
          <Link
            href="/"
            data-cursor="HOME"
            className="text-display text-3xl leading-tight transition-colors hover:text-(--color-accent) md:text-5xl"
          >
            ← Back home
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
