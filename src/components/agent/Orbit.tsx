"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, type MotionValue } from "framer-motion";
import { AGENT, SITE } from "@/lib/data";
import { usePrefersReducedMotion, useIsMobile } from "@/lib/hooks";
import { findTarget, LINKS, type Target } from "@/lib/agent/siteIndex";
import type { ToolInput } from "@/lib/agent/protocol";
import { OrbitCharacter, type Mood } from "./OrbitCharacter";
import { OrbitBubble, type Bubble } from "./OrbitBubble";
import { OrbitChat } from "./OrbitChat";
import { Spotlight, type SpotlightTarget } from "./Spotlight";
import { useOrbitAgent } from "./useOrbitAgent";
import { useSiteObserver } from "./useSiteObserver";
import { aimPoint, homePoint, measure, requestScroll, resolveElement, CLIPBOARD_EVENT } from "./dom";
import {
  SECTION_REMARKS,
  PATH_REMARKS,
  hoverRemark,
  SESSION_REMARK_CAP,
  REMARK_COOLDOWN_MS,
  DWELL_MS,
} from "./remarks";

const HIDDEN_KEY = "orbit:hidden";
const GREETED_KEY = "orbit:greeted";
const REMARKS_KEY = "orbit:remarks";
const WAKE_DELAY_MS = 1900;
const IDLE_SLEEP_MS = 90_000;

function readSession(key: string): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * Orbit — the on-page agent. This component is the conductor: it owns the
 * character's position and mood, the proactive behaviours (section
 * remarks, hover hints, sleeping), and it executes the UI tools the model
 * calls (fly + scroll + spotlight, open link, copy email). The chat and
 * the streaming live in useOrbitAgent.
 */
export function Orbit() {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const router = useRouter();
  const { pathname, visible, dominant, hovered } = useSiteObserver();
  const SIZE = mobile ? 48 : 60;

  // ── Position ────────────────────────────────────────────────────────
  // `goal` is where the orb wants to be; OrbitCharacter integrates a spring
  // toward it every frame and writes the result into x / y.
  const goal = useRef({ x: -200, y: -200 });
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);

  const [awake, setAwake] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mood, setMoodState] = useState<Mood>("sleeping");
  const [chatOpen, setChatOpen] = useState(false);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [bubbleSide, setBubbleSide] = useState<"left" | "right">("left");
  const [spot, setSpot] = useState<SpotlightTarget | null>(null);
  const [lookAt, setLookAt] = useState<{ x: number; y: number } | null>(null);
  const [trace, setTrace] = useState<string[]>([]);

  const chatOpenRef = useRef(false);
  chatOpenRef.current = chatOpen;
  const busyRef = useRef(false); // true while flying / pointing on a tool
  const moodRef = useRef<Mood>("sleeping");
  const setMood = useCallback((m: Mood) => {
    moodRef.current = m;
    setMoodState(m);
  }, []);
  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);
  const trackRaf = useRef(0);
  const returnTimer = useRef(0);
  const bubbleTimer = useRef(0);
  const pendingNav = useRef<{ target: Target; spotlight: boolean } | null>(null);
  const lastRemarkAt = useRef(0);
  const lastActivity = useRef(Date.now());

  const home = useCallback(() => {
    const p = homePoint(SIZE, mobile);
    if (mobile && chatOpenRef.current) {
      // Perch at the top-left of the bottom sheet so it stays visible.
      goal.current = { x: 12, y: Math.max(80, window.innerHeight * 0.28 - SIZE - 8) };
    } else {
      goal.current = { x: p.x, y: p.y };
    }
    setBubbleSide("left");
    setLookAt(null);
  }, [SIZE, mobile]);

  const say = useCallback(
    (text: string, ms: number, chip?: Bubble["chip"]) => {
      window.clearTimeout(bubbleTimer.current);
      setBubble({ id: Date.now(), text, chip });
      bubbleTimer.current = window.setTimeout(() => setBubble(null), ms);
    },
    [],
  );

  /** Fly to an element, keep tracking it for `trackMs`, then spotlight and hold. */
  const flyToElement = useCallback(
    (el: HTMLElement, opts: { trackMs?: number; holdMs?: number; spotlight?: boolean } = {}) => {
      const { trackMs = 1500, holdMs = 5000, spotlight = true } = opts;
      cancelAnimationFrame(trackRaf.current);
      window.clearTimeout(returnTimer.current);
      busyRef.current = true;
      if (!reduced) setMood("moving");
      const start = performance.now();
      const step = () => {
        const r = measure(el);
        const a = aimPoint(r, SIZE);
        goal.current = { x: a.x, y: a.y };
        setBubbleSide(a.x < window.innerWidth / 2 ? "right" : "left");
        setLookAt({ x: r.left + Math.min(r.width / 2, 120), y: r.top + r.height / 2 });
        if (performance.now() - start < trackMs) trackRaf.current = requestAnimationFrame(step);
        else {
          if (spotlight) setSpot({ el, key: Date.now() });
          setMood("pointing");
          returnTimer.current = window.setTimeout(() => {
            busyRef.current = false;
            if (!chatOpenRef.current) setMood("idle");
            home();
          }, holdMs);
        }
      };
      step();
    },
    [SIZE, reduced, setMood, home],
  );

  /** Scroll a target into view (same page) and fly to it. */
  const goToTarget = useCallback(
    (t: Target, spotlight = true) => {
      const el = resolveElement(t);
      if (!el) return;
      // Rows get extra headroom under the nav so the orb can hover above
      // the title instead of being pushed below the row.
      requestScroll(t.selector, t.kind === "section" ? -120 : -200, reduced);
      // Lenis' tween is 1.4s; track the element the whole way so the orb
      // "catches" it as it slides into place.
      flyToElement(el, { trackMs: reduced ? 100 : 1650, holdMs: 5500, spotlight });
    },
    [flyToElement, reduced],
  );

  // ── Tools (what the model can make the character do) ────────────────
  const onTool = useCallback(
    (tool: ToolInput) => {
      switch (tool.name) {
        case "go_to": {
          const t = findTarget(tool.target);
          if (!t) return;
          setTrace((s) => [...s, `→ ${t.label.split(" — ")[0]}`]);
          if (t.path !== pathname) {
            pendingNav.current = { target: t, spotlight: t.selector !== "main" };
            router.push(t.path);
          } else {
            goToTarget(t);
          }
          break;
        }
        case "spotlight": {
          const t = findTarget(tool.target);
          const el = t ? resolveElement(t) : null;
          if (!t || !el) return;
          setTrace((s) => [...s, `◎ ${t.label.split(" — ")[0]}`]);
          flyToElement(el, { trackMs: 300, holdMs: 4500 });
          break;
        }
        case "open_link": {
          const l = LINKS[tool.link];
          setTrace((s) => [...s, `↗ ${l.label}`]);
          window.open(l.href, "_blank", "noopener,noreferrer");
          break;
        }
        case "copy_email": {
          setTrace((s) => [...s, "⎘ email copied"]);
          navigator.clipboard?.writeText(SITE.email).then(
            () => setMood("happy"),
            () => undefined,
          );
          later(() => {
            if (moodRef.current === "happy") setMood(chatOpenRef.current ? "speaking" : "idle");
          }, 900);
          break;
        }
        case "suggest_questions":
          break;
      }
    },
    [pathname, router, goToTarget, flyToElement, setMood, later],
  );

  const onTrace = useCallback((step: string) => {
    if (!step) {
      setTrace([]);
      return;
    }
    setTrace((s) => (s[s.length - 1] === step ? s : [...s, step]));
  }, []);

  const getPage = useCallback(() => ({ path: pathname, visible: visible.slice(0, 8) }), [pathname, visible]);

  const agent = useOrbitAgent({ onTool, onTrace, getPage });

  // Mood follows the chat status unless a flight is in progress.
  useEffect(() => {
    if (busyRef.current) return;
    if (agent.status === "thinking") setMood("thinking");
    else if (agent.status === "answering") setMood("speaking");
    else if (agent.status === "acting") setMood("moving");
    else if (moodRef.current !== "sleeping" && moodRef.current !== "happy") setMood(chatOpen ? "curious" : "idle");
  }, [agent.status, chatOpen, setMood]);

  // ── Lifecycle: wake, sleep, hide ────────────────────────────────────
  useEffect(() => {
    try {
      if (localStorage.getItem(HIDDEN_KEY) === "1") setHidden(true);
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => {
      home();
      setAwake(true);
      setMood("idle");
      const greeted = sessionStorage.getItem(GREETED_KEY);
      if (!greeted) {
        sessionStorage.setItem(GREETED_KEY, "1");
        later(() => say(AGENT.greeting, 9000, { label: "Ask something", onClick: () => openChat() }), 700);
      }
    }, WAKE_DELAY_MS);
    return () => {
      window.clearTimeout(t);
      timers.current.forEach(window.clearTimeout);
      cancelAnimationFrame(trackRaf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!awake) return;
    home();
  }, [awake, mobile, chatOpen, home]);

  useEffect(() => {
    if (!awake) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") setMood("sleeping");
      else if (moodRef.current === "sleeping") setMood("idle");
    };
    const onActivity = () => {
      lastActivity.current = Date.now();
      if (moodRef.current === "sleeping" && document.visibilityState === "visible") setMood("idle");
    };
    const sleepCheck = window.setInterval(() => {
      if (Date.now() - lastActivity.current > IDLE_SLEEP_MS && !chatOpenRef.current && !busyRef.current) {
        setMood("sleeping");
      }
    }, 10_000);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("resize", home);
    const onCopied = () => {
      setMood("happy");
      say("Copied. He does reply.", 3500);
      later(() => setMood(chatOpenRef.current ? "curious" : "idle"), 900);
    };
    window.addEventListener(CLIPBOARD_EVENT, onCopied);
    return () => {
      window.clearInterval(sleepCheck);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("resize", home);
      window.removeEventListener(CLIPBOARD_EVENT, onCopied);
    };
  }, [awake, home, say, setMood, later]);

  // Finish a cross-page go_to once the new route has rendered.
  useEffect(() => {
    const nav = pendingNav.current;
    if (!nav || nav.target.path !== pathname) return;
    pendingNav.current = null;
    // Page transition curtain is ~1.1s; land after it.
    later(() => {
      const el = resolveElement(nav.target);
      if (el) flyToElement(el, { trackMs: 400, holdMs: 5000, spotlight: nav.spotlight });
    }, 1200);
  }, [pathname, flyToElement, later]);

  // ── Proactive remarks ───────────────────────────────────────────────
  const canRemark = useCallback(
    (key: string, cooldown = REMARK_COOLDOWN_MS) => {
      if (!awake || chatOpenRef.current || busyRef.current || moodRef.current === "sleeping") return false;
      if (Date.now() - lastRemarkAt.current < cooldown) return false;
      const said = readSession(REMARKS_KEY);
      if (said.includes(key) || said.length >= SESSION_REMARK_CAP) return false;
      return true;
    },
    [awake],
  );
  const markRemark = useCallback((key: string) => {
    lastRemarkAt.current = Date.now();
    try {
      sessionStorage.setItem(REMARKS_KEY, JSON.stringify([...readSession(REMARKS_KEY), key]));
    } catch {
      /* ignore */
    }
  }, []);

  // Section dwell → fly to the section label and comment.
  useEffect(() => {
    if (!dominant || !awake) return;
    const key = dominant;
    const t = later(() => {
      const text = SECTION_REMARKS[key];
      if (!text || !canRemark(key)) return;
      const el = resolveElement(findTarget(key)!);
      markRemark(key);
      if (el && !reduced) {
        const label = el.querySelector<HTMLElement>(".text-eyebrow") ?? el;
        flyToElement(label, { trackMs: 200, holdMs: 7000, spotlight: false });
      }
      setMood("speaking");
      say(text, 7000);
      later(() => {
        if (!busyRef.current && !chatOpenRef.current) setMood("idle");
      }, 7000);
    }, DWELL_MS);
    return () => window.clearTimeout(t);
  }, [dominant, awake, canRemark, markRemark, flyToElement, say, reduced, setMood, later]);

  // Page remarks (lab, case studies).
  useEffect(() => {
    if (!awake || pathname === "/") return;
    const key = `path:${pathname}`;
    const t = later(() => {
      const r = PATH_REMARKS.find((p) => p.test(pathname));
      if (!r || !canRemark(key)) return;
      markRemark(key);
      setMood("speaking");
      say(r.text, 7000);
      later(() => {
        if (!busyRef.current && !chatOpenRef.current) setMood("idle");
      }, 7000);
    }, 2200);
    return () => window.clearTimeout(t);
  }, [pathname, awake, canRemark, markRemark, say, setMood, later]);

  // Hover hint on project rows (desktop).
  useEffect(() => {
    if (!hovered || !awake || mobile) return;
    const t = later(() => {
      const key = `hover:${hovered.id}`;
      if (!canRemark(key, 14_000)) return;
      markRemark(key);
      setMood("curious");
      const label = hovered.label.split(" — ")[0];
      say(hoverRemark(label), 6000, {
        label: "Tell me",
        onClick: () => {
          openChat();
          later(() => agent.send(`Tell me about ${label}`), 300);
        },
      });
    }, 1200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered, awake, mobile]);

  // ── Chat open/close ─────────────────────────────────────────────────
  const openChat = useCallback(() => {
    setBubble(null);
    setChatOpen(true);
    lastActivity.current = Date.now();
    if (moodRef.current === "sleeping" || moodRef.current === "idle") setMood("curious");
  }, [setMood]);
  const closeChat = useCallback(() => {
    setChatOpen(false);
    if (!busyRef.current) setMood("idle");
  }, [setMood]);
  const hide = useCallback(() => {
    try {
      localStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setChatOpen(false);
    setHidden(true);
  }, []);
  const unhide = useCallback(() => {
    try {
      localStorage.removeItem(HIDDEN_KEY);
    } catch {
      /* ignore */
    }
    setHidden(false);
    home();
  }, [home]);

  if (hidden) {
    return (
      <button
        type="button"
        onClick={unhide}
        aria-label={`Show ${AGENT.name}, the site agent`}
        title={`Show ${AGENT.name}`}
        className="fixed bottom-6 right-6 z-[90] h-3 w-3 cursor-pointer rounded-full bg-(--color-accent) opacity-50 transition-opacity hover:opacity-100"
      />
    );
  }

  return (
    <>
      <Spotlight target={spot} />
      <OrbitChat
        open={chatOpen}
        mobile={mobile}
        messages={agent.messages}
        status={agent.status}
        suggestions={agent.suggestions}
        offlineMode={agent.offlineMode}
        trace={trace}
        onSend={agent.send}
        onClose={closeChat}
        onReset={agent.reset}
        onHide={hide}
        bottomOffset={SIZE + 44}
      />
      {awake ? (
        <>
          {/* Bubble rides with the orb: same position, offset above it. */}
          <div className="pointer-events-none fixed left-0 top-0 z-[91]" style={{ transform: "translate3d(0,0,0)" }}>
            <BubbleAnchor x={x} y={y} size={SIZE}>
              <OrbitBubble bubble={bubble} side={bubbleSide} size={SIZE} onDismiss={() => setBubble(null)} />
            </BubbleAnchor>
          </div>
          <OrbitCharacter
            size={SIZE}
            mood={mood}
            goal={goal}
            x={x}
            y={y}
            lookAt={lookAt}
            reduced={reduced}
            onClick={() => (chatOpen ? closeChat() : openChat())}
            label={`${AGENT.name}, the site agent${chatOpen ? ". Close chat" : ". Open chat"}`}
            expanded={chatOpen}
          />
        </>
      ) : null}
    </>
  );
}


function BubbleAnchor({
  x,
  y,
  size,
  children,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  size: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div className="absolute left-0 top-0" style={{ x, y, width: size, height: size }}>
      {children}
    </motion.div>
  );
}
