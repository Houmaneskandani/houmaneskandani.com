"use client";

import { CAPABILITIES } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";
import { SplitText } from "@/components/ui/SplitText";
import { Marquee } from "@/components/ui/Marquee";

// Only things that appear in CAPABILITIES or a case study on this site —
// the previous list claimed Kafka / ClickHouse / event-driven architecture,
// none of which show up anywhere else here.
const MARQUEE_ITEMS = [
  "Distributed systems",
  "GraphQL",
  "gRPC",
  "Postgres & PostGIS",
  "Kubernetes",
  "Multi-tenancy",
  "Idempotency",
  "Observability",
  "PCI-DSS",
  "LLM agents",
];

export function Capabilities() {
  return (
    <section
      id="capabilities"
      className="relative w-full overflow-hidden border-t border-(--color-line) py-24 md:py-36"
    >
      <Marquee speed={60} className="mb-24 md:mb-32">
        {MARQUEE_ITEMS.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="mx-8 inline-flex items-center gap-8 text-display text-[12vw] leading-none text-(--color-fg)/95 md:text-[8vw]"
          >
            {t}
            <span className="text-(--color-accent)">✺</span>
          </span>
        ))}
      </Marquee>

      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 md:col-span-3">
            <p className="text-eyebrow">
              <span className="text-(--color-accent)">(03)</span> Capabilities
            </p>
          </div>
          <div className="col-span-12 md:col-span-9 md:col-start-4">
            <h2 className="text-display text-[8vw] leading-[1.02] md:text-[5vw]">
              <SplitText text="Tools and patterns" className="block" />
              <SplitText
                text="I reach for."
                className="block opacity-70"
                delay={0.05}
              />
            </h2>

            <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
              {CAPABILITIES.map((cap, i) => (
                <Reveal key={cap.label} delay={i * 0.07}>
                  <div data-drop="capability" className="border-t border-(--color-line) pt-6">
                    <p className="text-eyebrow text-(--color-fg)">
                      0{i + 1} · {cap.label}
                    </p>
                    <ul className="mt-5 space-y-2 text-sm text-(--color-muted) md:text-base">
                      {cap.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-baseline gap-2 transition-colors hover:text-(--color-fg)"
                        >
                          <span className="text-(--color-accent)">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
