"use client";

import { motion, AnimatePresence } from "framer-motion";

export type BubbleChip = { label: string; onClick: () => void };
export type Bubble = { id: number; text: string; chip?: BubbleChip };

type Props = {
  bubble: Bubble | null;
  /** Which side of the orb the bubble opens toward. */
  side: "left" | "right";
  size: number;
  onDismiss: () => void;
};

/** The speech bubble Orbit uses for proactive remarks (not the chat). */
export function OrbitBubble({ bubble, side, size, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {bubble ? (
        <motion.div
          key={bubble.id}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto absolute max-w-[260px] rounded-2xl border border-(--color-line) bg-(--color-bg-elev)/95 px-4 py-3 text-[13px] leading-relaxed text-(--color-fg) shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md"
          style={{
            bottom: size + 12,
            ...(side === "left" ? { right: 0, transformOrigin: "bottom right" } : { left: 0, transformOrigin: "bottom left" }),
            width: "max-content",
          }}
        >
          <span className="mr-2 text-(--color-accent)">✺</span>
          {bubble.text}
          {bubble.chip ? (
            <button
              type="button"
              onClick={bubble.chip.onClick}
              className="mt-2 block cursor-pointer rounded-full border border-(--color-accent)/50 px-3 py-1 text-[11px] uppercase tracking-widest text-(--color-accent) transition-colors hover:bg-(--color-accent) hover:text-bg"
            >
              {bubble.chip.label}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute -right-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-(--color-line) bg-(--color-bg) text-[10px] text-(--color-muted) hover:text-(--color-fg)"
          >
            ×
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
