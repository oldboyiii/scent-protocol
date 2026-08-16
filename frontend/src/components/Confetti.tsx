"use client";

import { useEffect, useState } from "react";

const COLORS = ["#D4AF37", "#C0C0C0", "#CD7F32", "#FFD700", "#FF6B6B", "#4ECDC4"];

interface Piece {
  id: number;
  left: string;
  color: string;
  delay: string;
  duration: string;
}

export default function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }
    const p: Piece[] = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: `${Math.random() * 0.5}s`,
      duration: `${2 + Math.random() * 2}s`,
    }));
    setPieces(p);
    const t = setTimeout(() => setPieces([]), 5000);
    return () => clearTimeout(t);
  }, [active]);

  if (!active && pieces.length === 0) return null;

  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </>
  );
}
