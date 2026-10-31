"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LIMITS,
  createEventParser,
  type AgentEvent,
  type ChatTurn,
  type PageContext,
  type ToolInput,
} from "@/lib/agent/protocol";
import { localReply } from "@/lib/agent/localBrain";

export type ChatMessage = ChatTurn & {
  id: string;
  /** Set on assistant replies produced by the offline brain. */
  offline?: boolean;
  /** Set while the reply is still streaming. */
  streaming?: boolean;
};

export type AgentStatus = "idle" | "thinking" | "acting" | "answering";

const STORAGE_KEY = "orbit:chat:v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed.slice(-LIMITS.maxTurns) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-LIMITS.maxTurns)));
  } catch {
    // private mode / quota — the in-memory copy still works
  }
}

type Options = {
  /** Executes a UI tool the model (or the offline brain) asked for. */
  onTool: (tool: ToolInput) => void;
  onTrace: (step: string) => void;
  getPage: () => PageContext;
};

/**
 * The chat half of Orbit: history, streaming a turn from /api/agent, and
 * falling back to the offline brain when the route can't serve.
 */
export function useOrbitAgent({ onTool, onTrace, getPage }: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    setMessages(loadHistory());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) saveHistory(messages);
  }, [messages]);

  const applyOffline = useCallback(
    (question: string, replyId: string, reason: string) => {
      const r = localReply(question);
      setOfflineMode(true);
      onTrace(reason);
      setMessages((m) =>
        m.map((x) => (x.id === replyId ? { ...x, content: r.text, offline: true, streaming: false } : x)),
      );
      // Actions a beat after the text lands, so the eye goes to the words first.
      window.setTimeout(() => r.tools.forEach(onTool), 350);
      setSuggestions(r.suggestions);
      setStatus("idle");
    },
    [onTool, onTrace],
  );

  const send = useCallback(
    async (text: string) => {
      const q = text.trim().slice(0, LIMITS.maxTurnChars);
      if (!q || status !== "idle") return;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const userMsg: ChatMessage = { id: uid(), role: "user", content: q };
      const replyId = uid();
      const history = [...messages, userMsg];
      setMessages([...history, { id: replyId, role: "assistant", content: "", streaming: true }]);
      setSuggestions([]);
      setStatus("thinking");
      onTrace("reading");

      const turns: ChatTurn[] = history
        .filter((m) => m.content.trim())
        .slice(-LIMITS.maxTurns)
        .map(({ role, content }) => ({ role, content }));

      let res: Response;
      try {
        res = await fetch("/api/agent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: turns, page: getPage() }),
          signal: ac.signal,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        applyOffline(q, replyId, "offline");
        return;
      }

      if (!res.ok || !res.body) {
        let code = "unavailable";
        try {
          code = ((await res.json()) as { code?: string }).code ?? code;
        } catch {
          /* non-JSON error body */
        }
        applyOffline(q, replyId, code === "no_key" ? "offline" : code === "rate_limited" ? "cooling down" : "offline");
        return;
      }

      setOfflineMode(false);
      const parse = createEventParser();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let gotText = false;
      let finished = false;

      const handle = (e: AgentEvent) => {
        switch (e.type) {
          case "trace":
            onTrace(e.step);
            setStatus(e.step === "answering" ? "answering" : e.step === "acting" ? "acting" : "thinking");
            break;
          case "text":
            gotText = true;
            setMessages((m) =>
              m.map((x) => (x.id === replyId ? { ...x, content: x.content + e.delta } : x)),
            );
            break;
          case "tool":
            onTool(e.tool);
            break;
          case "suggest":
            setSuggestions(e.questions.slice(0, 3));
            break;
          case "done":
            finished = true;
            if (!gotText) {
              // A tool-only turn (or a refusal) — give the visitor a line.
              const fallbackLine =
                e.reason === "refusal"
                  ? "I'd rather not go there — ask me about Houman's work instead."
                  : "Done.";
              setMessages((m) =>
                m.map((x) => (x.id === replyId ? { ...x, content: x.content || fallbackLine } : x)),
              );
            }
            break;
          case "error":
            if (!gotText) applyOffline(q, replyId, "offline");
            finished = true;
            break;
        }
      };

      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          for (const ev of parse(decoder.decode(value, { stream: true }))) handle(ev);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError" && !gotText) applyOffline(q, replyId, "offline");
      }
      if (!finished && !gotText) {
        applyOffline(q, replyId, "offline");
        return;
      }
      setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, streaming: false } : x)));
      setStatus("idle");
      onTrace("");
    },
    [messages, status, onTool, onTrace, getPage, applyOffline],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setSuggestions([]);
    setStatus("idle");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, status, suggestions, offlineMode, send, reset };
}
