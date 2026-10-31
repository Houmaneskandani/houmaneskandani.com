"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePrefersReducedMotion } from "@/lib/hooks";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) return; // honor OS preference; native scroll only
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    document.documentElement.classList.add("lenis", "lenis-smooth");

    const onAnchor = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      // Match "#id" or "/#id" only when we're already on the home path.
      let hashId: string | null = null;
      if (href.startsWith("#")) {
        hashId = href.slice(1);
      } else if (href.startsWith("/#") && window.location.pathname === "/") {
        hashId = href.slice(2);
      }
      if (!hashId) return;
      const el = document.getElementById(hashId);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -10, duration: 1.6 });
    };
    document.addEventListener("click", onAnchor);

    // Programmatic smooth scroll for the on-page agent (Orbit). It can't
    // reach the Lenis instance directly, so it asks via a DOM event and
    // gets the same easing the rest of the site uses.
    const onAgentScroll = (e: Event) => {
      const { selector, offset } = (e as CustomEvent<{ selector: string; offset?: number }>).detail ?? {};
      if (!selector) return;
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return;
      lenis.scrollTo(el, { offset: offset ?? -120, duration: 1.4 });
    };
    window.addEventListener("orbit:scroll", onAgentScroll);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", onAnchor);
      window.removeEventListener("orbit:scroll", onAgentScroll);
      lenis.destroy();
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    };
  }, [reduced]);

  return <>{children}</>;
}
