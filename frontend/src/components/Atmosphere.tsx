"use client";

export default function Atmosphere() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Fog layers */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-purple-950/30 via-transparent to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-amber-950/20 via-transparent to-transparent" />

      {/* Left side — Top Notes (bright, floating up) */}
      <div className="absolute left-0 top-0 bottom-0 w-24 hidden lg:block">
        {/* Floating citrus drop */}
        <div className="absolute top-[15%] left-4 w-3 h-3 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 opacity-40 blur-[1px] animate-[float_10s_ease-in-out_infinite]" />
        {/* Floating bergamot molecule */}
        <div className="absolute top-[30%] left-8 w-4 h-4 opacity-30 animate-[float_12s_ease-in-out_infinite_1s]">
          <svg viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,14 36,30 20,40 4,30 4,14" stroke="#fbbf24" strokeWidth="1.5" fill="rgba(251,191,36,0.1)"/></svg>
        </div>
        {/* Floating lemon drop */}
        <div className="absolute top-[50%] left-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 opacity-35 blur-[1px] animate-[float_8s_ease-in-out_infinite_2s]" />
        {/* Floating apple molecule */}
        <div className="absolute top-[70%] left-10 w-5 h-5 opacity-25 animate-[float_14s_ease-in-out_infinite_3s]">
          <svg viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,14 36,30 20,40 4,30 4,14" stroke="#f87171" strokeWidth="1.5" fill="rgba(248,113,113,0.1)"/></svg>
        </div>
        {/* Floating mint leaf shape */}
        <div className="absolute top-[85%] left-6 w-3 h-5 rounded-full bg-gradient-to-t from-emerald-400/30 to-transparent rotate-12 opacity-40 animate-[float_11s_ease-in-out_infinite_0.5s]" />

        {/* Vertical label */}
        <div className="absolute top-1/2 left-2 -translate-y-1/2 -rotate-90 origin-center">
          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-400/30 font-medium">Top Notes</span>
        </div>
      </div>

      {/* Right side — Base Notes (deep, grounding) */}
      <div className="absolute right-0 top-0 bottom-0 w-24 hidden lg:block">
        {/* Floating oud drop */}
        <div className="absolute top-[20%] right-4 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 opacity-40 blur-[1px] animate-[float_9s_ease-in-out_infinite_1.5s]" />
        {/* Floating sandalwood molecule */}
        <div className="absolute top-[40%] right-8 w-5 h-5 opacity-30 animate-[float_13s_ease-in-out_infinite_2.5s]">
          <svg viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,14 36,30 20,40 4,30 4,14" stroke="#a78bfa" strokeWidth="1.5" fill="rgba(167,139,250,0.1)"/></svg>
        </div>
        {/* Floating vanilla drop */}
        <div className="absolute top-[60%] right-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 opacity-35 blur-[1px] animate-[float_7s_ease-in-out_infinite_0.8s]" />
        {/* Floating musk molecule */}
        <div className="absolute top-[80%] right-10 w-4 h-4 opacity-25 animate-[float_15s_ease-in-out_infinite_3.5s]">
          <svg viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,14 36,30 20,40 4,30 4,14" stroke="#fbbf24" strokeWidth="1.5" fill="rgba(251,191,36,0.08)"/></svg>
        </div>

        {/* Vertical label */}
        <div className="absolute top-1/2 right-2 -translate-y-1/2 rotate-90 origin-center">
          <span className="text-[10px] uppercase tracking-[0.3em] text-purple-400/30 font-medium">Base Notes</span>
        </div>
      </div>

      {/* Subtle scent waves — horizontal floating orbs */}
      <div className="absolute left-[10%] top-[25%] w-20 h-20 rounded-full bg-amber-500/5 blur-2xl animate-[float_20s_ease-in-out_infinite]" />
      <div className="absolute right-[15%] top-[60%] w-24 h-24 rounded-full bg-purple-500/5 blur-2xl animate-[float_18s_ease-in-out_infinite_5s]" />
      <div className="absolute left-[20%] bottom-[20%] w-16 h-16 rounded-full bg-rose-500/5 blur-2xl animate-[float_16s_ease-in-out_infinite_3s]" />
      <div className="absolute right-[10%] top-[10%] w-12 h-12 rounded-full bg-emerald-500/5 blur-xl animate-[float_22s_ease-in-out_infinite_7s]" />

      {/* Thin decorative lines connecting sides to center */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <line x1="5%" y1="20%" x2="30%" y2="40%" stroke="#fbbf24" strokeWidth="0.5" />
        <line x1="5%" y1="50%" x2="25%" y2="55%" stroke="#c084fc" strokeWidth="0.5" />
        <line x1="5%" y1="80%" x2="28%" y2="70%" stroke="#f87171" strokeWidth="0.5" />
        <line x1="95%" y1="25%" x2="70%" y2="45%" stroke="#fbbf24" strokeWidth="0.5" />
        <line x1="95%" y1="55%" x2="75%" y2="60%" stroke="#c084fc" strokeWidth="0.5" />
        <line x1="95%" y1="85%" x2="72%" y2="75%" stroke="#f87171" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
