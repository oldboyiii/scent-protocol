"use client";

import { useEffect, useState } from "react";

const COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#D4AF37", "#C0C0C0", "#CD7F32", "#FF8C42", "#9B59B6"];

interface Piece {
  id: number;
  left: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  shape: "square" | "circle" | "rect";
}

export default function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!active || !mounted) {
      if (!active) setPieces([]);
      return;
    }

    const p: Piece[] = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 8 + Math.random() * 12,
      delay: Math.random() * 0.8,
      duration: 2.5 + Math.random() * 2,
      rotation: Math.random() * 360,
      shape: ["square", "circle", "rect"][Math.floor(Math.random() * 3)] as Piece["shape"],
    }));

    setPieces(p);

    const t = setTimeout(() => setPieces([]), 5500);
    return () => clearTimeout(t);
  }, [active, mounted]);

  if (!mounted || pieces.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {pieces.map((p) => {
        const isCircle = p.shape === "circle";
        const isRect = p.shape === "rect";
        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: "-20px",
              width: isRect ? `${p.size * 0.6}px` : `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: isCircle ? "50%" : "2px",
              opacity: 0,
              animation: `confettiDrop ${p.duration}s ${p.delay}s linear forwards`,
              transform: `rotate(${p.rotation}deg)`,
              boxShadow: `0 0 6px ${p.color}80`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiDrop {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
