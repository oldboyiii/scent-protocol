"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect warns during server rendering; fall back to useEffect there.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface FitTitleProps {
  text: string;
  /** Extra classes: weight, colour, margin, hover. Do not set a text size here. */
  className?: string;
  /** Largest size in rem. 1.25 is the old text-xl. */
  maxRem?: number;
  /** Smallest size in rem. Below this the title is cut with an ellipsis as before. */
  minRem?: number;
}

export default function FitTitle({ 
  text, 
  className = "", 
  maxRem = 1.25, 
  minRem = 0.9 
}: FitTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [size, setSize] = useState(maxRem);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      let next = maxRem;
      el.style.fontSize = `${next}rem`;
      // scrollWidth is the full text width even when the text is clipped.
      while (el.scrollWidth > el.clientWidth && next > minRem) {
        next = Math.max(minRem, Math.round((next - 0.02) * 1000) / 1000);
        el.style.fontSize = `${next}rem`;
      }
      setSize(next);
    };

    fit();

    // Refit when the card width changes (window resize, grid columns) or fonts finish loading.
    const target = el.parentElement ?? el;
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(target);
    void document.fonts?.ready.then(fit);

    return () => observer?.disconnect();
  }, [text, maxRem, minRem]);

  return (
    <h3
      ref={ref}
      title={text}
      className={`truncate whitespace-nowrap ${className}`}
      style={{ fontSize: `${size}rem` }}
    >
      {text}
    </h3>
  );
}
