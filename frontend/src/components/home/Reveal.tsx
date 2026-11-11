"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Fades a section in the first time it scrolls into view.
 * Without JavaScript or with reduced motion the content is simply visible.
 */
export default function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false); // true once we know we can animate
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    
    // Already on screen when we mount: show it without hiding it first.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return;
    
    setArmed(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        armed
          ? {
              opacity: visible ? 1 : 0,
              transform: visible ? "none" : "translateY(24px)",
              transition: `opacity 700ms ease-out ${delay}ms, transform 700ms ease-out ${delay}ms`,
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
