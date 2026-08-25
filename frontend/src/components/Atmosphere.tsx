"use client";

export default function Atmosphere() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Fog layers */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-amber-950/30 via-transparent to-transparent" />

      {/* Left side — Top Notes */}
      <div className="absolute left-0 top-0 bottom-0 w-24 hidden lg:block">
        {/* Floating citrus drop */}
        <div 
          className="absolute top-[15%] left-4 w-3 h-3 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 blur-[1px]"
          style={{ opacity: 0.7, animation: "float 10s ease-in-out infinite" }}
        />
        {/* Floating bergamot molecule */}
        <div 
          className="absolute top-[30%] left-8 w-5 h-5"
          style={{ opacity: 0.6, animation: "float 12s ease-in-out infinite 1s" }}
        >
          <svg viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,14 36,30 20,40 4,30 4,14" stroke="#fbbf24" strokeWidth="2" fill="rgba(251,191,36,0.2)"/></svg>
        </div>
        {/* Floating lemon drop */}
        <div 
          className="absolute top-[50%] left-2 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 blur-[1px]"
          style={{ opacity: 0.65, animation: "float 8s ease-in-out infinite 2s" }}
        />
        {/* Floating apple molecule */}
        <div 
          className="absolute top-[70%] left-10 w-5 h-5"
          style={{ opacity: 0.55, animation: "float 14s ease-in-out infinite 3s" }}
        >
          <svg viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,14 36,30 20,40 4,30 4,14" stroke="#f87171" strokeWidth="2" fill="rgba(248,113,113,0.2)"/></svg>
        </div>
        {/* Floating mint leaf */}
        <div 
          className="absolute top-[85%] left-6 w-3 h-5 rounded-full bg-gradient-to-t from-emerald-400/50 to-transparent rotate-12"
          style={{ opacity: 0.7, animation: "float 11s ease-in-out infinite 0.5s" }}
        />

        {/* Vertical label */}
        <div className="absolute top-1/2 left-2 -translate-y-1/2 -rotate-90 origin-center">
          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-400/50 font-medium">Top Notes</span>
        </div>
      </div>

      {/* Right side — Base Notes */}
      <div className="absolute right-0 top-0 bottom-0 w-24 hidden lg:block">
        {/* Floating oud drop */}
        <div 
          className="absolute top-[20%] right-4 w-4 h-4 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 blur-[1px]"
          style={{ opacity: 0.7, animation: "float 9s ease-in-out infinite 1.5s" }}
        />
        {/* Floating sandalwood molecule */}
        <div 
          className="absolute top-[40%] right-8 w-5 h-5"
          style={{ opacity: 0.6, animation: "float 13s ease-in-out infinite 2.5s" }}
        >
          <svg viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,14 36,30 20,40 4,30 4,14" stroke="#a78bfa" strokeWidth="2" fill="rgba(167,139,250,0.2)"/></svg>
        </div>
        {/* Floating vanilla drop */}
        <div 
          className="absolute top-[60%] right-2 w-3 h-3 rounded-full bg-gradient-to-br from-amber-100 to-amber-400 blur-[1px]"
          style={{ opacity: 0.65, animation: "float 7s ease-in-out infinite 0.8s" }}
        />
        {/* Floating musk molecule */}
        <div 
          className="absolute top-[80%] right-10 w-5 h-5"
          style={{ opacity: 0.55, animation: "float 15s ease-in-out infinite 3.5s" }}
        >
          <svg viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,14 36,30 20,40 4,30 4,14" stroke="#fbbf24" strokeWidth="2" fill="rgba(251,191,36,0.15)"/></svg>
        </div>

        {/* Vertical label */}
        <div className="absolute top-1/2 right-2 -translate-y-1/2 rotate-90 origin-center">
          <span className="text-[10px] uppercase tracking-[0.3em] text-purple-400/50 font-medium">Base Notes</span>
        </div>
      </div>

      {/* Scent waves — large floating orbs */}
      <div 
        className="absolute left-[10%] top-[25%] w-24 h-24 rounded-full bg-amber-500/10 blur-3xl"
        style={{ animation: "drift 20s ease-in-out infinite" }}
      />
      <div 
        className="absolute right-[15%] top-[60%] w-28 h-28 rounded-full bg-purple-500/10 blur-3xl"
        style={{ animation: "drift 18s ease-in-out infinite 5s" }}
      />
      <div 
        className="absolute left-[20%] bottom-[20%] w-20 h-20 rounded-full bg-rose-500/10 blur-3xl"
        style={{ animation: "drift 16s ease-in-out infinite 3s" }}
      />
      <div 
        className="absolute right-[10%] top-[10%] w-16 h-16 rounded-full bg-emerald-500/10 blur-2xl"
        style={{ animation: "drift 22s ease-in-out infinite 7s" }}
      />

      {/* Thin decorative lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <line x1="5%" y1="20%" x2="30%" y2="40%" stroke="#fbbf24" strokeWidth="0.5" />
        <line x1="5%" y1="50%" x2="25%" y2="55%" stroke="#c084fc" strokeWidth="0.5" />
        <line x1="5%" y1="80%" x2="28%" y2="70%" stroke="#f87171" strokeWidth="0.5" />
        <line x1="95%" y1="25%" x2="70%" y2="45%" stroke="#fbbf24" strokeWidth="0.5" />
        <line x1="95%" y1="55%" x2="75%" y2="60%" stroke="#c084fc" strokeWidth="0.5" />
        <line x1="95%" y1="85%" x2="72%" y2="75%" stroke="#f87171" strokeWidth="0.5" />
      </svg>

      {/* Inline keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-18px) rotate(3deg); }
          66% { transform: translateY(10px) rotate(-2deg); }
        }
        @keyframes drift {
          0% { transform: translate(0, 0); opacity: 0.2; }
          25% { transform: translate(15px, -25px); opacity: 0.5; }
          50% { transform: translate(-10px, -40px); opacity: 0.3; }
          75% { transform: translate(20px, -20px); opacity: 0.4; }
          100% { transform: translate(0, 0); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
