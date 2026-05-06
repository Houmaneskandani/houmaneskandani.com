"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
};

export function Marquee({
  children,
  speed = 40,
  reverse,
  className,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    let x = 0;
    let last = performance.now();
    const dir = reverse ? 1 : -1;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      x += dir * speed * dt;
      const w = el.scrollWidth / 2;
      if (w > 0) {
        if (x <= -w) x += w;
        if (x >= 0 && dir === 1) x -= w;
      }
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed, reverse]);

  return (
    <div className={className} style={{ overflow: "hidden" }}>
      <div ref={trackRef} className="inline-flex whitespace-nowrap">
        <div className="inline-flex">{children}</div>
        <div aria-hidden className="inline-flex">
          {children}
        </div>
      </div>
    </div>
  );
}
