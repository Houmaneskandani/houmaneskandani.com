import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SplitText } from "@/components/ui/SplitText";
import { Reveal } from "@/components/ui/Reveal";
import { PROJECTS } from "@/lib/data";

const ProjectHero = dynamic(
  () => import("@/components/three/ProjectHero").then((m) => m.ProjectHero),
);

export function generateStaticParams() {
  // Skip projects whose `href` points outside `/work/` (e.g. Diamond Hand
  // lives at `/lab/diamond-hand`) — generating a thin `/work/<slug>` page
  // for them would just create an orphan with no content.
  return PROJECTS
    .filter((p) => !p.href || p.href.startsWith("/work/"))
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return { title: "Not found" };
  return {
    title: `${project.title} — Houman Eskandani`,
    description: project.summary,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();

  const idx = PROJECTS.findIndex((p) => p.slug === slug);
  const next = PROJECTS[(idx + 1) % PROJECTS.length];

  return (
    <main className="relative">
      <Navbar />

      {/* Cinematic hero */}
      <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden px-6 pb-12 pt-32 md:px-10">
        <div className="absolute inset-0 -z-10">
          <ProjectHero accent={project.accent} />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-(--color-bg)" />

        <div className="absolute left-6 top-28 md:left-10">
          <p className="text-eyebrow">
            <span className="text-(--color-accent)">●</span>{" "}
            <span className="ml-2">CASE STUDY · {project.id}</span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[1400px]">
          <h1 className="text-display text-[12vw] leading-[0.9] md:text-[8vw]">
            <SplitText text={project.title} className="block" />
          </h1>

          {project.client ? (
            <p className="mt-4 text-eyebrow">
              <span className="text-(--color-fg)">Client · </span>
              <span>{project.client}</span>
            </p>
          ) : null}

          <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-6">
            <div className="col-span-6 md:col-span-3">
              <p className="text-eyebrow">Year</p>
              <p className="mt-2 text-fg">{project.year}</p>
            </div>
            <div className="col-span-6 md:col-span-3">
              <p className="text-eyebrow">Role</p>
              <p className="mt-2 text-fg">{project.role}</p>
            </div>
            <div className="col-span-12 md:col-span-6">
              <p className="text-eyebrow">Stack</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {project.tags.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-(--color-line) px-3 py-1 text-[11px] uppercase tracking-widest text-(--color-muted)"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            {project.external ? (
              <div className="col-span-12">
                <a
                  href={project.external}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="VISIT"
                  className="inline-flex items-center gap-2 rounded-full border border-(--color-accent) bg-(--color-accent)/10 px-5 py-2 text-sm text-(--color-accent) transition-colors hover:bg-(--color-accent) hover:text-bg"
                >
                  Visit repository <span aria-hidden>↗</span>
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Context + problem */}
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
            <Reveal delay={0.1} className="mt-12">
              <p className="text-eyebrow">The problem</p>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-(--color-muted) md:text-lg">
                {project.problem}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Approach — pinned-feel split layout */}
      <section className="relative w-full border-t border-(--color-line) px-6 py-32 md:px-10 md:py-40">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-x-6">
          <div className="col-span-12 md:col-span-3">
            <p className="text-eyebrow sticky top-32">
              <span className="text-(--color-accent)">(02)</span> Approach
            </p>
          </div>
          <div className="col-span-12 md:col-span-9 md:col-start-4">
            <ul className="space-y-16 md:space-y-24">
              {(project.approach ?? []).map((step, i) => (
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

      {/* Outcome + metrics */}
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
                        style={{ color: project.accent }}
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

      {/* Next project */}
      <section className="relative w-full border-t border-(--color-line) px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-eyebrow">Next case</p>
            <Link
              href={`/work/${next.slug}`}
              data-cursor="NEXT"
              className="mt-3 block text-display text-4xl leading-tight transition-transform hover:translate-x-2 md:text-7xl"
            >
              {next.title} →
            </Link>
          </div>
          <Link
            href="/#work"
            data-cursor="BACK"
            className="text-eyebrow hover:text-(--color-accent)"
          >
            All work ↗
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
