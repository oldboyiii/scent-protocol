"use client";

import { useMemo } from "react";

interface ScentCrestProps {
  seed: string; // Unique NFT seed (e.g., address + archetype)
  name: string; // Fragrance name (for initials)
  rarity: number; // 0: Common, 1: Rare, 2: Epic, 3: Legendary
  size?: number;
}

// Color palettes for each rarity level
const RARITY_PALETTES = [
  { primary: "#94a3b8", secondary: "#475569", bg: "#1e293b" }, // Common (Silver/Slate)
  { primary: "#60a5fa", secondary: "#1d4ed8", bg: "#172554" }, // Rare (Blue)
  { primary: "#c084fc", secondary: "#7e22ce", bg: "#3b0764" }, // Epic (Purple)
  { primary: "#fbbf24", secondary: "#d97706", bg: "#451a03" }, // Legendary (Gold)
];

export default function ScentCrest({ seed, name, rarity, size = 120 }: ScentCrestProps) {
  const palette = RARITY_PALETTES[rarity] || RARITY_PALETTES[0];

  // Generate unique SVG parameters based on the seed
  const svgParams = useMemo(() => {
    // Simple hash from the seed to generate pseudo-random numbers
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const rand = (min: number, max: number) => {
      hash = (hash * 9301 + 49297) % 233280;
      return min + (hash / 233280) * (max - min);
    };

    // Generate unique geometric elements
    const circles = Array.from({ length: 3 }, () => ({
      cx: rand(20, 80),
      cy: rand(20, 80),
      r: rand(10, 30),
      opacity: rand(0.1, 0.4),
    }));

    const lines = Array.from({ length: 4 }, () => ({
      x1: rand(0, 100),
      y1: rand(0, 100),
      x2: rand(0, 100),
      y2: rand(0, 100),
      width: rand(0.5, 2),
    }));

    // Extract initials from the name (e.g., "Golden Bloom" -> "GB")
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "SP";

    return { circles, lines, initials };
  }, [seed, name]);

  return (
    <div 
      className="relative flex items-center justify-center rounded-full overflow-hidden border-2 shadow-lg"
      style={{ 
        width: size, 
        height: size, 
        borderColor: palette.primary,
        background: `radial-gradient(circle at center, ${palette.bg} 0%, #000000 100%)`
      }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.primary} stopOpacity="0.8" />
            <stop offset="100%" stopColor={palette.secondary} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Unique background pattern of circles */}
        {svgParams.circles.map((circle, i) => (
          <circle
            key={`c-${i}`}
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill={`url(#grad-${seed})`}
            opacity={circle.opacity}
          />
        ))}

        {/* Unique geometric lines */}
        {svgParams.lines.map((line, i) => (
          <line
            key={`l-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={palette.primary}
            strokeWidth={line.width}
            opacity="0.3"
          />
        ))}

        {/* Central frame (wax seal style) */}
        <circle 
          cx="50" 
          cy="50" 
          r="35" 
          fill="none" 
          stroke={palette.primary} 
          strokeWidth="1" 
          strokeDasharray="4 2"
          opacity="0.6"
        />
        <circle 
          cx="50" 
          cy="50" 
          r="28" 
          fill="rgba(0,0,0,0.6)" 
          stroke={palette.primary} 
          strokeWidth="1.5"
        />
      </svg>

      {/* Initials in the center */}
      <div 
        className="relative z-10 font-serif font-bold tracking-widest"
        style={{ 
          color: palette.primary, 
          fontSize: size * 0.25,
          textShadow: `0 0 10px ${palette.primary}80`
        }}
      >
        {svgParams.initials}
      </div>
    </div>
  );
}
