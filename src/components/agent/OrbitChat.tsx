"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENT } from "@/lib/data";
import type { AgentStatus, ChatMessage } from "./useOrbitAgent";

type Props = {
  open: boolean;
  mobile: boolean;
  messages: ChatMessage[];
  status: AgentStatus;
  suggestions: string[];
  offlineMode: boolean;
  trace: string[];
  onSend: (text: string) => void;
  onClose: () => void;
  onReset: () => void;
  onHide: () => void;
  /** Pixel offset from the bottom so the panel sits above the orb (desktop). */
  bottomOffset: number;
};

/** The conversation panel. Anchored above the orb on desktop; a bottom sheet on mobile. */
export function OrbitChat({
  open,
  mobile,
  messages,
  status,
  suggestions,
  offlineMode,
  trace,
  onSend,
  onClose,
  onReset,
  onHide,
  bottomOffset,
}: Props) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = status !== "idle";

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, suggestions, trace]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setDraft("");
    onSend(t);
  };

  const chips = messages.length === 0 ? AGENT.starters : suggestions;

  return (
    <AnimatePresence>
      {open ? (
        <motion.section
          key="orbit-chat"
          role="dialog"
          aria-label={`${AGENT.name} chat`}
          data-lenis-prevent
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={
            mobile
              ? "fixed inset-x-0 bottom-0 z-[95] flex max-h-[72vh] flex-col rounded-t-3xl border-t border-(--color-line) bg-(--color-bg-elev)/97 shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
              : "fixed right-7 z-[95] flex w-[360px] max-w-[calc(100vw-56px)] flex-col overflow-hidden rounded-3xl border border-(--color-line) bg-(--color-bg-elev)/97 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          }
          style={mobile ? undefined : { bottom: bottomOffset, maxHeight: "min(66vh, 620px)", transformOrigin: "bottom right" }}
        >
          <header className="flex items-center justify-between gap-3 border-b border-(--color-line) px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full bg-(--color-accent) ${busy ? "animate-ping" : ""}`}
                  style={{ opacity: 0.5 }}
                />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--color-accent)" />
              </span>
              <div className="leading-tight">
                <p className="text-sm text-(--color-fg)">{AGENT.name}</p>
                <p className="text-eyebrow mt-0.5">
                  {offlineMode ? "offline brain · limited answers" : AGENT.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 ? (
                <button
                  type="button"
                  onClick={onReset}
                  className="cursor-pointer rounded-full px-2 py-1 text-eyebrow transition-colors hover:text-(--color-fg)"
                  title="Start over"
                >
                  Reset
                </button>
              ) : null}
              <button
                type="button"
                onClick={onHide}
                className="cursor-pointer rounded-full px-2 py-1 text-eyebrow transition-colors hover:text-(--color-fg)"
                title="Hide the agent for this browser"
              >
                Hide
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close chat"
                className="ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-(--color-line) text-(--color-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent)"
              >
                ×
              </button>
            </div>
          </header>

          <div ref={listRef} className="no-scrollbar flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
            {messages.length === 0 ? (
              <p className="text-sm leading-relaxed text-(--color-muted)">{AGENT.greeting}</p>
            ) : null}
            <ul className="space-y-3">
              {messages.map((m, i) => {
                const last = i === messages.length - 1;
                return (
                  <li key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    {m.role === "user" ? (
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-(--color-fg) px-3.5 py-2 text-[13.5px] leading-relaxed text-bg">
                        {m.content}
                      </p>
                    ) : (
                      <div className="max-w-[92%]" aria-live={last ? "polite" : undefined}>
                        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-(--color-fg)">
                          {m.content}
                          {m.streaming && !m.content ? (
                            <span className="inline-flex gap-1 align-middle">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-accent)" style={{ animationDelay: "0ms" }} />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-accent)" style={{ animationDelay: "120ms" }} />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-accent)" style={{ animationDelay: "240ms" }} />
                            </span>
                          ) : null}
                          {m.streaming && m.content ? (
                            <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-(--color-accent)" />
                          ) : null}
                        </p>
                        {m.offline ? (
                          <p className="text-eyebrow mt-1 opacity-70">offline brain</p>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Trace line: what the agent is doing right now. */}
            <AnimatePresence>
              {busy && trace.length ? (
                <motion.p
                  key="trace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-eyebrow mt-3 flex flex-wrap items-center gap-x-2 gap-y-1"
                >
                  {trace.map((t, i) => (
                    <span key={`${t}-${i}`} className={i === trace.length - 1 ? "text-(--color-accent)" : "opacity-60"}>
                      {i > 0 ? <span className="mr-2 opacity-40">·</span> : null}
                      {t}
                    </span>
                  ))}
                </motion.p>
              ) : null}
            </AnimatePresence>

            {!busy && chips.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => submit(c)}
                    className="cursor-pointer rounded-full border border-(--color-line) px-3 py-1.5 text-[12px] text-(--color-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent)"
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
            className="flex items-center gap-2 border-t border-(--color-line) px-3 py-3"
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={AGENT.placeholder}
              maxLength={600}
              aria-label="Message"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[13.5px] text-(--color-fg) outline-none placeholder:text-(--color-muted)/70"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="cursor-pointer rounded-full bg-(--color-accent) px-4 py-2 text-[12px] font-medium text-bg transition-opacity disabled:cursor-default disabled:opacity-40"
            >
              {busy ? "…" : "Send"}
            </button>
          </form>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
