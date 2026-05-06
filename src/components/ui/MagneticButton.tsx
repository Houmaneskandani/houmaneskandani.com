"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  strength?: number;
  cursorLabel?: string;
};

export function MagneticButton({
  children,
  href,
  onClick,
  className,
  strength = 0.3,
  cursorLabel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setPos({ x: x * strength, y: y * strength });
  };
  const onLeave = () => setPos({ x: 0, y: 0 });

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 220, damping: 20, mass: 0.6 }}
      className={cn(
        "inline-flex items-center justify-center will-change-transform",
        className,
      )}
      data-cursor={cursorLabel}
    >
      <motion.div
        animate={{ x: pos.x * 0.4, y: pos.y * 0.4 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="inline-flex items-center justify-center"
      >
        {children}
      </motion.div>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} className="inline-block">
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-block bg-transparent"
    >
      {inner}
    </button>
  );
}
