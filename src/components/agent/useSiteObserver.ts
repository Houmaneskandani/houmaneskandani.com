"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TARGETS, type Target } from "@/lib/agent/siteIndex";
import { resolveElement } from "./dom";

/**
 * Watches which agent targets are on screen. Exposes:
 *   - visible: target ids in the viewport (most visible first) — sent to
 *     the model as context, so "spotlight" can point at what's on screen.
 *   - dominant: the section/page target the visitor is dwelling on.
 *   - hovered: the project/side row under the pointer (desktop only).
 */
export function useSiteObserver() {
  const pathname = usePathname();
  const [visible, setVisible] = useState<string[]>([]);
  const [dominant, setDominant] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Target | null>(null);
  const ratios = useRef(new Map<string, number>());

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    ratios.current.clear();
    setVisible([]);
    setDominant(null);

    const onPage = TARGETS.filter((t) => t.path === pathname && t.selector !== "main");
    const byEl = new Map<Element, Target>();
    for (const t of onPage) {
      const el = resolveElement(t);
      if (el) byEl.set(el, t);
    }
    if (byEl.size === 0) return;

    let raf = 0;
    const flush = () => {
      raf = 0;
      const entries = [...ratios.current.entries()].filter(([, r]) => r > 0).sort((a, b) => b[1] - a[1]);
      setVisible(entries.map(([id]) => id));
      // Dominant = the section with the largest visible share; rows don't
      // count (they'd flicker as the visitor scrolls a list).
      const sections = entries.filter(([id]) => id.startsWith("section:"));
      setDominant(sections.length && sections[0][1] > 0.25 ? sections[0][0] : null);
    };

    const io = new IntersectionObserver(
      (list) => {
        for (const e of list) {
          const t = byEl.get(e.target);
          if (!t) continue;
          ratios.current.set(t.id, e.isIntersecting ? e.intersectionRatio : 0);
        }
        if (!raf) raf = requestAnimationFrame(flush);
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );
    for (const el of byEl.keys()) io.observe(el);

    // Hover (fine pointers only): which row is under the pointer.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-agent-id]");
      if (!el) {
        setHovered(null);
        return;
      }
      const id = el.dataset.agentId ?? "";
      const t = onPage.find((x) => x.id === id && (x.kind === "project" || x.kind === "side"));
      setHovered(t ?? null);
    };
    if (fine) window.addEventListener("pointerover", onOver, { passive: true });

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (fine) window.removeEventListener("pointerover", onOver);
    };
  }, [pathname]);

  return { pathname, visible, dominant, hovered };
}
