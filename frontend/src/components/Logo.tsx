"use client";

interface LogoProps {
  size?: number;
  showText?: boolean;
  animate?: boolean;
}

export default function Logo({ size = 40, showText = false, animate = true }: LogoProps) {
  const s = size;

  return (
    <div className={`flex items-center gap-3 ${animate ? "group" : ""}`}>
      <svg
        width={s}
        height={showText ? s * 1.4 : s}
        viewBox="0 0 200 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={animate ? "drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]" : ""}
      >
        <defs>
          <linearGradient id="goldBottle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="goldCap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="hexGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Particles above bottle */}
        {animate && (
          <g>
            <circle cx="100" cy="15" r="4" fill="#fbbf24" opacity="0.9">
              <animate attributeName="cy" values="15;10;15" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="85" cy="25" r="3" fill="#fbbf24" opacity="0.7">
              <animate attributeName="cy" values="25;20;25" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="115" cy="22" r="3.5" fill="#fbbf24" opacity="0.8">
              <animate attributeName="cy" values="22;17;22" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="75" cy="35" r="2.5" fill="#fbbf24" opacity="0.6">
              <animate attributeName="cy" values="35;30;35" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="125" cy="30" r="2" fill="#fbbf24" opacity="0.5">
              <animate attributeName="cy" values="30;25;30" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="95" cy="32" r="2" fill="#fbbf24" opacity="0.6">
              <animate attributeName="cy" values="32;28;32" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="108" cy="38" r="1.5" fill="#fbbf24" opacity="0.4">
              <animate attributeName="cy" values="38;34;38" dur="3.2s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Bottle body */}
        <rect
          x="55"
          y="70"
          width="90"
          height="120"
          rx="12"
          fill="url(#goldBottle)"
          stroke="#fbbf24"
          strokeWidth="2"
          filter={animate ? "url(#glow)" : undefined}
        />

        {/* Inner shine */}
        <rect
          x="62"
          y="76"
          width="76"
          height="108"
          rx="8"
          fill="rgba(255,255,255,0.08)"
        />

        {/* Neck */}
        <rect x="82" y="52" width="36" height="22" rx="4" fill="#0f172a" stroke="#1e1b4b" strokeWidth="1" />

        {/* Cap */}
        <rect x="75" y="38" width="50" height="18" rx="6" fill="url(#goldCap)" stroke="#fbbf24" strokeWidth="1.5">
          {animate && <animate attributeName="opacity" values="1;0.85;1" dur="4s" repeatCount="indefinite" />}
        </rect>

        {/* Hexagon molecules */}
        {[
          { cx: 80, cy: 95, r: 10 },
          { cx: 120, cy: 95, r: 10 },
          { cx: 100, cy: 115, r: 10 },
          { cx: 80, cy: 135, r: 10 },
          { cx: 120, cy: 135, r: 10 },
          { cx: 100, cy: 155, r: 10 },
          { cx: 80, cy: 175, r: 10 },
          { cx: 120, cy: 175, r: 10 },
        ].map((h, i) => (
          <g key={i}>
            <polygon
              points={hexPoints(h.cx, h.cy, h.r)}
              fill="url(#hexGrad)"
              stroke="#6366f1"
              strokeWidth="1.5"
              opacity={animate ? undefined : "0.9"}
            >
              {animate && (
                <animate
                  attributeName="opacity"
                  values="0.7;1;0.7"
                  dur={`${3 + i * 0.5}s`}
                  repeatCount="indefinite"
                />
              )}
            </polygon>
            <circle cx={h.cx} cy={h.cy} r="2" fill="#818cf8" />
          </g>
        ))}

        {/* Connection lines */}
        <g stroke="#6366f1" strokeWidth="1" opacity="0.6">
          <line x1="80" y1="95" x2="100" y2="115" />
          <line x1="120" y1="95" x2="100" y2="115" />
          <line x1="100" y1="115" x2="80" y2="135" />
          <line x1="100" y1="115" x2="120" y2="135" />
          <line x1="80" y1="135" x2="100" y2="155" />
          <line x1="120" y1="135" x2="100" y2="155" />
          <line x1="100" y1="155" x2="80" y2="175" />
          <line x1="100" y1="155" x2="120" y2="175" />
        </g>

        {/* Connection dots */}
        <g fill="#818cf8">
          <circle cx="90" cy="105" r="1.5" />
          <circle cx="110" cy="105" r="1.5" />
          <circle cx="90" cy="125" r="1.5" />
          <circle cx="110" cy="125" r="1.5" />
          <circle cx="90" cy="145" r="1.5" />
          <circle cx="110" cy="145" r="1.5" />
          <circle cx="90" cy="165" r="1.5" />
          <circle cx="110" cy="165" r="1.5" />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            ScentProtocol
          </span>
          <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
            AI Perfume House
          </span>
          <span className="text-[10px] text-indigo-400 uppercase tracking-[0.15em]">
            Built on Arc
          </span>
        </div>
      )}
    </div>
  );
}

function hexPoints(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}
