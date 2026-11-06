"use client";

import { useMemo } from "react";

// ============================================================
// TYPES
// ============================================================
interface ScentCrestProps {
  seed: string;
  name: string;
  rarity: number;
  size?: number;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
}

// ============================================================
// DETERMINISTIC HASH & RANDOM (for consistent visuals per NFT)
// ============================================================
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index * 127.1 + index * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ============================================================
// COLOR PALETTES
// ============================================================
const NOTE_COLORS = {
  top: ["#fbbf24", "#f59e0b", "#fcd34d", "#fde68a", "#fbbf24"],
  heart: ["#f472b6", "#ec4899", "#f9a8d4", "#fb7185", "#f472b6"],
  base: ["#34d399", "#10b981", "#6ee7b7", "#a7f3d0", "#34d399"],
};

const RARITY_GLOW: Record<number, string> = {
  0: "#94a3b8",
  1: "#60a5fa",
  2: "#c084fc",
  3: "#fbbf24",
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ScentCrest({
  seed,
  name,
  rarity,
  size = 64,
  topNotes = [],
  heartNotes = [],
  baseNotes = [],
}: ScentCrestProps) {
  const initials = useMemo(() => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [name]);

  const seedHash = useMemo(() => hashString(seed), [seed]);
  const glowColor = RARITY_GLOW[rarity] ?? RARITY_GLOW[0];

  // ---- PARTICLES (molecules representing notes) ----
  const particles = useMemo(() => {
    const totalNotes = topNotes.length + heartNotes.length + baseNotes.length;
    const count = Math.max(10, Math.min(20, 8 + totalNotes));
    const result = [];

    for (let i = 0; i < count; i++) {
      const angle = seededRandom(seedHash, i * 2) * Math.PI * 2;
      const distance = 0.58 + seededRandom(seedHash, i * 2 + 1) * 0.38;
      
      // Assign note type based on index distribution
      let noteType: "top" | "heart" | "base" = "base";
      if (i < Math.ceil(count * 0.33)) noteType = "top";
      else if (i < Math.ceil(count * 0.66)) noteType = "heart";
      
      const colors = NOTE_COLORS[noteType];
      const color = colors[Math.floor(seededRandom(seedHash, i * 3) * colors.length)];
      const pSize = 2 + seededRandom(seedHash, i * 4) * 3;
      const delay = seededRandom(seedHash, i * 5) * 4;
      const duration = 3 + seededRandom(seedHash, i * 6) * 3;

      result.push({
        angle,
        distance,
        color,
        size: pSize,
        delay,
        duration,
        type: noteType,
      });
    }
    return result;
  }, [seedHash, topNotes.length, heartNotes.length, baseNotes.length]);

  // ---- SPARKLES (bright twinkling dots) ----
  const sparkles = useMemo(() => {
    const count = 8;
    const result = [];
    for (let i = 0; i < count; i++) {
      const angle = seededRandom(seedHash + 1000, i * 2) * Math.PI * 2;
      const distance = 0.52 + seededRandom(seedHash + 1000, i * 2 + 1) * 0.45;
      const sSize = 1 + seededRandom(seedHash + 1000, i * 3) * 2;
      const delay = seededRandom(seedHash + 1000, i * 4) * 3;
      const duration = 1.5 + seededRandom(seedHash + 1000, i * 5) * 2;
      result.push({ angle, distance, size: sSize, delay, duration });
    }
    return result;
  }, [seedHash]);

  // Scale factor for particles (bigger crest = slightly bigger particles)
  const particleScale = size / 64;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer ambient glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-30 pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />

      {/* Ripple waves (pulsing rings) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="absolute rounded-full border-2"
          style={{
            width: size * 1.25,
            height: size * 1.25,
            borderColor: glowColor,
            opacity: 0.25,
            animation: "crest-ripple 3s ease-out infinite",
          }}
        />
        <div
          className="absolute rounded-full border"
          style={{
            width: size * 1.55,
            height: size * 1.55,
            borderColor: glowColor,
            opacity: 0.15,
            animation: "crest-ripple 3s ease-out infinite",
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute rounded-full border"
          style={{
            width: size * 1.85,
            height: size * 1.85,
            borderColor: glowColor,
            opacity: 0.08,
            animation: "crest-ripple 3s ease-out infinite",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* Particles (aroma molecules) */}
      {particles.map((p, i) => (
        <div
          key={`p-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size * particleScale,
            height: p.size * particleScale,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2 * particleScale}px ${p.color}`,
            left: `${50 + Math.cos(p.angle) * p.distance * 50}%`,
            top: `${50 + Math.sin(p.angle) * p.distance * 50}%`,
            animation: `crest-float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            opacity: 0.75,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Sparkles (twinkling highlights) */}
      {sparkles.map((s, i) => (
        <div
          key={`s-${i}`}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: s.size * particleScale,
            height: s.size * particleScale,
            left: `${50 + Math.cos(s.angle) * s.distance * 50}%`,
            top: `${50 + Math.sin(s.angle) * s.distance * 50}%`,
            animation: `crest-sparkle ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
            boxShadow: `0 0 ${s.size * 3 * particleScale}px white`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Main crest circle */}
      <div
        className="relative rounded-full flex items-center justify-center border-2"
        style={{
          width: size * 0.72,
          height: size * 0.72,
          borderColor: glowColor,
          background: `radial-gradient(circle at 30% 30%, ${glowColor}25, #0a0f1e 75%)`,
          boxShadow: `0 0 25px ${glowColor}50, inset 0 0 20px ${glowColor}25`,
        }}
      >
        {/* Inner dashed ring */}
        <div
          className="absolute rounded-full border border-dashed opacity-50"
          style={{
            width: "82%",
            height: "82%",
            borderColor: glowColor,
            animation: "crest-spin 20s linear infinite",
          }}
        />

        {/* Initials */}
        <span
          className="font-bold relative z-10 select-none"
          style={{
            color: glowColor,
            fontSize: size * 0.28,
            textShadow: `0 0 12px ${glowColor}, 0 0 24px ${glowColor}80`,
            fontFamily: "Georgia, serif",
            letterSpacing: "0.05em",
          }}
        >
          {initials}
        </span>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes crest-ripple {
          0% { transform: scale(0.9); opacity: 0.3; }
          100% { transform: scale(1.1); opacity: 0; }
        }
        @keyframes crest-float {
          0%, 100% { 
            transform: translate(-50%, -50%) translateY(0) scale(1); 
            opacity: 0.6; 
          }
          50% { 
            transform: translate(-50%, -50%) translateY(-4px) scale(1.3); 
            opacity: 1; 
          }
        }
        @keyframes crest-sparkle {
          0%, 100% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0); 
          }
          50% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1.8); 
          }
        }
        @keyframes crest-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
