"use client";

// The archetype reveal: a bottle fills with the wallet's colours, then the notes appear
// tier by tier (top, heart, base), the way a real fragrance unfolds.

interface ScentBottleProps {
  name: string;
  description: string;
  /** Five hex colours, top of the bottle first. */
  colors: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
}

const BODY = "M52 70 Q52 60 62 58 L62 40 L98 40 L98 58 Q108 60 108 70 L112 190 Q112 208 94 208 L66 208 Q48 208 48 190 Z";

export default function ScentBottle({ name, description, colors, topNotes, heartNotes, baseNotes }: ScentBottleProps) {
  const c = (i: number) => colors[i % colors.length] ?? "#a855f7";
  const tiers: Array<[string, string[], string]> = [
    ["Top", topNotes, c(0)],
    ["Heart", heartNotes, c(2)],
    ["Base", baseNotes, c(4)],
  ];

  return (
    <div className="space-y-6 text-center">
      <div className="relative mx-auto h-60 w-44">
        <svg viewBox="0 0 160 220" className="h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <clipPath id="wsBottleClip">
              <path d={BODY} />
            </clipPath>
            <linearGradient id="wsLiquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c(0)} />
              <stop offset="35%" stopColor={c(1)} />
              <stop offset="60%" stopColor={c(2)} />
              <stop offset="100%" stopColor={c(4)} />
            </linearGradient>
          </defs>

          <g clipPath="url(#wsBottleClip)">
            <rect x="40" y="60" width="80" height="160" fill="rgba(255,255,255,0.05)" />
            <g className="ws-fill">
              <rect x="40" y="100" width="80" height="120" fill="url(#wsLiquid)" />
              <path className="ws-wave" d="M20 100 Q40 92 60 100 T100 100 T140 100 T180 100 V112 H20 Z" fill="url(#wsLiquid)" opacity="0.9" />
            </g>
            <path d="M60 80 Q56 130 62 190" stroke="rgba(255,255,255,0.35)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>

          <path d={BODY} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
          <rect x="64" y="20" width="32" height="22" rx="4" fill="#fbbf24" />
          <rect x="64" y="20" width="32" height="6" rx="3" fill="rgba(255,255,255,0.4)" />

          {[[28, 90], [132, 70], [30, 160], [136, 150], [80, 8]].map(([x, y], i) => (
            <circle key={i} className="ws-twinkle" cx={x} cy={y} r="2.2" fill={c(i)} style={{ animationDelay: `${1.2 + i * 0.35}s` }} />
          ))}
        </svg>
      </div>

      <div className="ws-rise" style={{ animationDelay: "1.4s" }}>
        <p className="text-xs font-medium uppercase tracking-widest text-purple-300">Your wallet smells like</p>
        <h3 className="mt-1 bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text pb-2 text-4xl font-bold leading-[1.25] text-transparent">{name}</h3>
      </div>

      <div className="ws-rise" style={{ animationDelay: "1.7s" }}>
        <div className="flex h-3 overflow-hidden rounded-full">
          {colors.map((color, i) => (
            <span key={i} className="h-full flex-1" style={{ background: color }} />
          ))}
        </div>
      </div>

      <p className="ws-rise mx-auto max-w-lg italic text-white/70" style={{ animationDelay: "2s" }}>
        &ldquo;{description}&rdquo;
      </p>

      <div className="mx-auto max-w-lg space-y-3 text-left">
        {tiers.map(([label, notes, color], i) => (
          <div key={label} className="ws-rise flex items-start gap-3" style={{ animationDelay: `${2.4 + i * 0.5}s` }}>
            <span className="w-12 flex-shrink-0 pt-1 text-xs font-semibold uppercase" style={{ color }}>{label}</span>
            <div className="flex flex-wrap gap-1.5">
              {notes.map((n) => (
                <span key={n} className="rounded-full border px-2.5 py-0.5 text-xs text-white/85" style={{ borderColor: `${color}77`, background: `${color}1f` }}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes wsFill { from { transform: translateY(110px); } to { transform: translateY(0); } }
        @keyframes wsWave { from { transform: translateX(0); } to { transform: translateX(-40px); } }
        @keyframes wsRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes wsTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4); } 50% { opacity: 1; transform: scale(1.4); } }
        .ws-fill { animation: wsFill 2.2s cubic-bezier(0.3, 0.7, 0.2, 1) both; }
        .ws-wave { animation: wsWave 2.4s linear infinite; }
        .ws-rise { opacity: 0; animation: wsRise 0.7s ease-out forwards; }
        .ws-twinkle { opacity: 0; transform-box: fill-box; transform-origin: center; animation: wsTwinkle 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ws-fill, .ws-wave, .ws-twinkle { animation: none; }
          .ws-rise { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
