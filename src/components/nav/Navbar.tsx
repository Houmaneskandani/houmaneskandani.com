"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { NAV, SITE } from "@/lib/data";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Logo } from "@/components/brand/Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const updateTime = () => {
      const d = new Date();
      const fmt = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setTime(fmt);
    };
    updateTime();
    const i = window.setInterval(updateTime, 30_000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(i);
    };
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-40"
    >
      {/* Always-on subtle top mask so text stays legible over WebGL hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 [background:linear-gradient(to_bottom,rgba(7,7,10,0.55),rgba(7,7,10,0))]"
      />
      {/* Heavier blurred bar appears once you start scrolling. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-[opacity,backdrop-filter] duration-500 ${
          scrolled
            ? "opacity-100 backdrop-blur-md [background:linear-gradient(to_bottom,rgba(7,7,10,0.78),rgba(7,7,10,0.55))] [border-bottom:1px_solid_var(--color-line)]"
            : "opacity-0"
        }`}
      />
      <div className="relative mx-auto flex w-full items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="flex items-center gap-3 text-fg"
          data-cursor="HOME"
        >
          <Logo size={56} className="text-fg" animate={false} />
          <span className="hidden text-eyebrow md:inline">
            {SITE.shortRole}
          </span>
        </Link>

        <nav className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <MagneticButton
                  href={item.href}
                  strength={0.25}
                  cursorLabel="GO"
                  className="px-4 py-2 text-sm text-fg hover:text-(--color-accent) transition-colors"
                >
                  <span>{item.label}</span>
                </MagneticButton>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <span className="text-eyebrow flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-(--color-accent) blink" />
            <AnimatePresence mode="wait">
              <motion.span
                key={time}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="tabular-nums"
              >
                LOCAL · {time}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
      </div>
    </motion.header>
  );
}
