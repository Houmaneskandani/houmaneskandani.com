import type { Metadata } from "next";
import { SITE } from "@/lib/data";

export const metadata: Metadata = {
  title: "Be right back — Houman Eskandani",
  description: "The site is briefly down for maintenance.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="relative isolate flex min-h-svh flex-col justify-between overflow-hidden px-6 py-12 md:px-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 60% at 70% 30%, rgba(138,92,255,0.32) 0%, transparent 60%), radial-gradient(40% 40% at 25% 75%, rgba(200,255,0,0.18) 0%, transparent 60%), linear-gradient(135deg, #07070a 0%, #0d0d12 100%)",
        }}
      />

      <header className="flex items-center justify-between">
        <p className="text-eyebrow">
          <span style={{ color: "var(--color-accent)" }}>●</span>
          <span className="ml-2">/ MAINTENANCE</span>
        </p>
        <p className="text-eyebrow">{SITE.shortName.toUpperCase()}</p>
      </header>

      <section className="mx-auto w-full max-w-[1400px] py-16 md:py-24">
        <h1 className="text-display text-[12vw] leading-[0.92] md:text-[8vw]">
          <span className="block">Be right</span>
          <span className="block" style={{ color: "var(--color-accent)" }}>
            back.
          </span>
        </h1>

        <div className="mt-10 grid grid-cols-12 gap-x-6">
          <p className="col-span-12 max-w-md text-base leading-relaxed text-[--color-muted] md:col-span-5 md:col-start-7 md:text-lg">
            The site is briefly down for an update. Nothing&apos;s broken — I&apos;m
            shipping a small change. If you need to reach me in the meantime,
            email is the fastest path.
          </p>
        </div>

        <a
          href={`mailto:${SITE.email}`}
          className="mt-12 inline-flex items-center gap-3 border-b border-[var(--color-line)] pb-2 text-display text-2xl transition-colors hover:[color:var(--color-accent)] md:text-3xl"
        >
          {SITE.email}
          <span aria-hidden>↗</span>
        </a>
      </section>

      <footer className="flex items-center justify-between border-t border-[var(--color-line)] pt-6">
        <p className="text-eyebrow">
          {SITE.name.toUpperCase()} · {SITE.location.toUpperCase()}
        </p>
        <p className="text-eyebrow">© {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}
