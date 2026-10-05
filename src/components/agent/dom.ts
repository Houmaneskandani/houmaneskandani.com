/**
 * DOM helpers for the agent: finding targets, measuring them, and asking the
 * page to scroll. No React in here.
 */
import { findTarget, type Target } from "@/lib/agent/siteIndex";

export function resolveElement(target: Target): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (target.selector === "main") {
    // Page-level target: aim at the page title so the character has
    // somewhere meaningful to hover.
    return document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("main");
  }
  return document.querySelector<HTMLElement>(target.selector);
}

export function elementForTargetId(id: string): HTMLElement | null {
  const t = findTarget(id);
  return t ? resolveElement(t) : null;
}

/**
 * Ask the page to scroll an element into view. SmoothScroll (Lenis) handles
 * the event when it is active; otherwise fall back to native smooth scroll.
 */
export function requestScroll(selector: string, offset = -120, reduced = false) {
  if (typeof window === "undefined") return;
  const el = document.querySelector<HTMLElement>(selector === "main" ? "main h1, main" : selector);
  if (!el) return;
  const hasLenis = document.documentElement.classList.contains("lenis");
  if (hasLenis && !reduced) {
    window.dispatchEvent(new CustomEvent("orbit:scroll", { detail: { selector: selector === "main" ? "main h1, main" : selector, offset } }));
    return;
  }
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
}

export type Rect = { left: number; top: number; width: number; height: number };

export function measure(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/**
 * Where the character should hover to "point at" an element: just outside
 * its top-left corner, clamped so it stays on screen and clear of the nav.
 */
export function aimPoint(rect: Rect, size: number): { x: number; y: number } {
  const margin = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampY = (v: number) => Math.max(96, Math.min(vh - size - margin, v));

  // Narrow element with room on its left (a section label, a short row):
  // sit just left of it, vertically centred on its first line.
  const leftX = rect.left - size - margin;
  if (leftX >= margin) {
    return { x: leftX, y: clampY(rect.top + Math.min(rect.height / 2, 40) - size / 2) };
  }
  // Full-width element (a case-study row, the whole section): hover just
  // above its left edge, where the title starts — or just below it when
  // the row is pinned under the nav.
  const above = rect.top - size - 10;
  if (above >= 96) return { x: rect.left + 12, y: above };
  const below = rect.top + rect.height + 10;
  if (below <= vh - size - margin) return { x: rect.left + 12, y: below };
  // Last resort: on its right end.
  return { x: Math.min(rect.left + rect.width + margin, vw - size - margin), y: clampY(rect.top) };
}

export function homePoint(size: number, mobile: boolean): { x: number; y: number } {
  const inset = mobile ? 16 : 28;
  return { x: window.innerWidth - size - inset, y: window.innerHeight - size - inset };
}

export const CLIPBOARD_EVENT = "orbit:email-copied";
