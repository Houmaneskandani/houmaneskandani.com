import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SplitText } from "@/components/ui/SplitText";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SIDE_PROJECTS } from "@/lib/data";

const ProjectHero = dynamic(
  () => import("@/components/three/ProjectHero").then((m) => m.ProjectHero),
);

// Only side projects with their own slug get a `/lab/[slug]` page.
// Side projects whose `href` points elsewhere (e.g. `/work/applyagent`)
// are intentionally excluded.
const CASE_STUDIES = SIDE_PROJECTS.filter((p) => Boolean(p.slug));

export function generateStaticParams() {
  return CASE_STUDIES.map((p) => ({ slug: p.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = CASE_STUDIES.find((p) => p.slug === slug);
  if (!project) return { title: "Not found" };
  return {
    title: `${project.name} — Houman Eskandani`,
    description: project.summary ?? project.description,
  };
}

export default async function LabCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = CASE_STUDIES.find((p) => p.slug === slug);
  if (!project) notFound();

  const accent = project.accent ?? "#c8ff00";
  const tags = project.tag.split(" · ");

  // Cycle through other case-studied side projects for the "next" link.
  // Falls back to the /lab index when there's only one.
  const idx = CASE_STUDIES.findIndex((p) => p.slug === slug);
  const next =
    CASE_STUDIES.length > 1
      ? CASE_STUDIES[(idx + 1) % CASE_STUDIES.length]
      : null;

  return (
    <main className="relative">
      <Navbar />

      {/* Cinematic hero */}
      <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden px-6 pb-12 pt-32 md:px-10">
        <div className="absolute inset-0 -z-10">
          <ProjectHero accent={accent} />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-(--color-bg)" />

        <div className="absolute left-6 top-28 md:left-10">
          <p className="text-eyebrow">
            <span className="text-(--color-accent)">●</span>{" "}
            <span className="ml-2">SIDE PROJECT · {project.id}</span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[1400px]">
          <h1 className="text-display text-[14vw] leading-[0.9] md:text-[10vw]">
            <SplitText text={project.name} className="block" />
          </h1>

          {project.status ? (
            <p className="mt-4 text-eyebrow">
              <span className="text-(--color-fg)">Status · </span>
              <span>{project.status}</span>
            </p>
          ) : null}

          <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-6">
            {project.year ? (
              <div className="col-span-6 md:col-span-3">
                <p className="text-eyebrow">Year</p>
                <p className="mt-2 text-fg">{project.year}</p>
              </div>
            ) : null}
            {project.role ? (
              <div className="col-span-6 md:col-span-3">
                <p className="text-eyebrow">Role</p>
                <p className="mt-2 text-fg">{project.role}</p>
              </div>
            ) : null}
            <div className="col-span-12 md:col-span-6">
              <p className="text-eyebrow">Focus</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-(--color-line) px-3 py-1 text-[11px] uppercase tracking-widest text-(--color-muted)"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Context + problem */}
      {project.context ? (
        <section className="relative w-full px-6 py-32 md:px-10 md:py-40">
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-x-6 gap-y-10">
            <div className="col-span-12 md:col-span-3">
              <p className="text-eyebrow">
                <span className="text-(--color-accent)">(01)</span> Context
              </p>
            </div>
            <div className="col-span-12 md:col-span-9 md:col-start-4">
              <Reveal>
                <p className="text-display text-3xl leading-tight md:text-5xl">
                  {project.context}
                </p>
              </Reveal>
              {project.problem ? (
                <Reveal delay={0.1} className="mt-12">
                  <p className="text-eyebrow">The problem</p>
                  <p className="mt-3 max-w-3xl text-base leading-relaxed text-(--color-muted) md:text-lg">
                    {project.problem}
                  </p>
                </Reveal>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Approach */}
      {project.approach && project.approach.length > 0 ? (
        <section className="relative w-full border-t border-(--color-line) px-6 py-32 md:px-10 md:py-40">
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-x-6">
            <div className="col-span-12 md:col-span-3">
              <p className="text-eyebrow sticky top-32">
                <span className="text-(--color-accent)">(02)</span> Approach
              </p>
            </div>
            <div className="col-span-12 md:col-span-9 md:col-start-4">
              <ul className="space-y-16 md:space-y-24">
                {project.approach.map((step, i) => (
                  <li key={step.heading}>
                    <Reveal delay={i * 0.05}>
                      <span className="text-eyebrow">0{i + 1}</span>
                      <h3 className="mt-3 text-display text-3xl leading-tight md:text-5xl">
                        {step.heading}
                      </h3>
                      <p className="mt-5 max-w-3xl text-base leading-relaxed text-(--color-muted) md:text-lg">
                        {step.body}
                      </p>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* Outcome + metrics */}
      {project.outcome ? (
        <section className="relative w-full border-t border-(--color-line) px-6 py-32 md:px-10 md:py-40">
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-x-6 gap-y-10">
            <div className="col-span-12 md:col-span-3">
              <p className="text-eyebrow">
                <span className="text-(--color-accent)">(03)</span> Outcome
              </p>
            </div>
            <div className="col-span-12 md:col-span-9 md:col-start-4">
              <Reveal>
                <p className="text-display text-3xl leading-tight md:text-5xl">
                  {project.outcome}
                </p>
              </Reveal>
              {project.metrics ? (
                <Reveal delay={0.1} className="mt-16">
                  <ul className="grid grid-cols-1 gap-y-8 border-t border-(--color-line) pt-8 md:grid-cols-3 md:gap-x-6">
                    {project.metrics.map((m) => (
                      <li key={m.label}>
                        <p
                          className="text-display text-5xl md:text-6xl"
                          style={{ color: accent }}
                        >
                          {m.value}
                        </p>
                        <p className="text-eyebrow mt-3">{m.label}</p>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Live console CTA — the obvious button to trade.houmaneskandani.com */}
      {project.liveUrl ? (
        <section
          className="relative isolate w-full overflow-hidden border-t border-(--color-line) px-6 py-32 md:px-10 md:py-40"
          style={{
            background: `radial-gradient(60% 60% at 50% 30%, ${accent}1f 0%, transparent 70%)`,
          }}
        >
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-x-6 gap-y-10">
            <div className="col-span-12 md:col-span-3">
              <p className="text-eyebrow">
                <span className="text-(--color-accent)">(04)</span> Live
              </p>
            </div>
            <div className="col-span-12 md:col-span-9 md:col-start-4">
              <Reveal>
                <p className="text-eyebrow flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full blink"
                    style={{ background: accent }}
                  />
                  RUNNING NOW
                </p>
                <h2 className="mt-4 text-display text-4xl leading-[1.02] md:text-7xl">
                  See it in action.
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-(--color-muted) md:text-lg">
                  The live console runs 24/7 — open positions, recent moves,
                  and system health, all updating in real time.
                </p>
              </Reveal>

              <Reveal delay={0.1} className="mt-12">
                <MagneticButton
                  href={project.liveUrl}
                  cursorLabel="OPEN"
                  strength={0.18}
                  className="rounded-full border bg-(--color-bg-elev) px-10 py-5 text-display text-2xl transition-colors md:px-14 md:py-6 md:text-3xl"
                >
                  <span
                    className="inline-flex items-center gap-3"
                    style={{ color: accent }}
                  >
                    {project.liveLabel ?? "Open live console"}
                    <span aria-hidden>↗</span>
                  </span>
                </MagneticButton>
                {project.liveNote ? (
                  <p className="text-eyebrow mt-6">{project.liveNote}</p>
                ) : null}
              </Reveal>
            </div>
          </div>
        </section>
      ) : null}

      {/* Next */}
      <section className="relative w-full border-t border-(--color-line) px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-eyebrow">{next ? "Next case" : "More"}</p>
            <Link
              href={next ? `/lab/${next.slug}` : "/lab"}
              data-cursor={next ? "NEXT" : "BACK"}
              className="mt-3 block text-display text-4xl leading-tight transition-transform hover:translate-x-2 md:text-7xl"
            >
              {next ? `${next.name} →` : "All side projects →"}
            </Link>
          </div>
          <Link
            href="/lab"
            data-cursor="BACK"
            className="text-eyebrow hover:text-(--color-accent)"
          >
            All side projects ↗
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
