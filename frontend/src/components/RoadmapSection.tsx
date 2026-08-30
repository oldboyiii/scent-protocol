// src/components/Roadmap.tsx (или соответствующая секция в page.tsx)

export default function Roadmap() {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent mb-4">
            Roadmap
          </h2>
          <p className="text-white/50 text-lg">
            The future of digital perfumery on Arc
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          
          {/* Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-purple-500/30 to-transparent transform -translate-x-1/2" />

          {/* PHASE 1 - LIVE NOW (Left Side) */}
          <div className="relative flex items-center justify-between mb-16">
            <div className="w-5/12">
              <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-emerald-900/10 backdrop-blur-md relative group hover:border-emerald-400/50 transition-all duration-300">
                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Phase 1</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    LIVE
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">Live Now</h3>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    On-chain perfume generation with unique formulas
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    ERC-721 NFT minting with USDC gas
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    AI-generated poetic descriptions
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    Collection & Gallery pages
                  </li>
                </ul>
              </div>
            </div>

            {/* Center Dot */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-400 border-4 border-[#0a0a1a] shadow-[0_0_15px_rgba(52,211,153,0.5)] z-10" />

            <div className="w-5/12" /> {/* Empty space for alignment */}
          </div>

          {/* PHASE 2 - AI AGENT INTEGRATION (Right Side) */}
          <div className="relative flex items-center justify-between mb-16">
            <div className="w-5/12" /> {/* Empty space for alignment */}

            {/* Center Dot */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 border-4 border-[#0a0a1a] shadow-[0_0_15px_rgba(251,191,36,0.5)] z-10" />

            <div className="w-5/12">
              <div className="glass-card p-6 rounded-2xl border border-amber-500/30 bg-amber-900/10 backdrop-blur-md relative group hover:border-amber-400/50 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Phase 2</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">AI Agent Integration</h3>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-amber-500/50 flex-shrink-0 mt-0.5" />
                    Personal AI advisor for scent recommendations
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-amber-500/50 flex-shrink-0 mt-0.5" />
                    Auto-minting based on mood & context
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-amber-500/50 flex-shrink-0 mt-0.5" />
                    Session keys for gasless experience
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-amber-500/50 flex-shrink-0 mt-0.5" />
                    Natural language → fragrance pipeline
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* NEW: PHASE 2.5 - MARKETPLACE LAUNCH (Left Side) */}
          <div className="relative flex items-center justify-between mb-16">
            <div className="w-5/12">
              <div className="glass-card p-6 rounded-2xl border border-purple-500/30 bg-purple-900/10 backdrop-blur-md relative group hover:border-purple-400/50 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Phase 2.5</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                    UPCOMING
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">Marketplace Launch</h3>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-purple-500/50 flex-shrink-0 mt-0.5" />
                    Peer-to-peer NFT trading platform
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-purple-500/50 flex-shrink-0 mt-0.5" />
                    Fixed price & auction listing types
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-purple-500/50 flex-shrink-0 mt-0.5" />
                    Royalty enforcement on secondary sales
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-purple-500/50 flex-shrink-0 mt-0.5" />
                    Rarity-based filtering & search
                  </li>
                </ul>
              </div>
            </div>

            {/* Center Dot */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-purple-400 border-4 border-[#0a0a1a] shadow-[0_0_15px_rgba(168,85,247,0.5)] z-10" />

            <div className="w-5/12" /> {/* Empty space for alignment */}
          </div>

          {/* PHASE 3 - NANOPAYMENTS & SAMPLES (Right Side) */}
          <div className="relative flex items-center justify-between">
            <div className="w-5/12" /> {/* Empty space for alignment */}

            {/* Center Dot */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-rose-400 border-4 border-[#0a0a1a] shadow-[0_0_15px_rgba(251,113,133,0.5)] z-10" />

            <div className="w-5/12">
              <div className="glass-card p-6 rounded-2xl border border-rose-500/30 bg-rose-900/10 backdrop-blur-md relative group hover:border-rose-400/50 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Phase 3</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">Nanopayments & Samples</h3>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-rose-500/50 flex-shrink-0 mt-0.5" />
                    $0.01 scent previews (no NFT)
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-rose-500/50 flex-shrink-0 mt-0.5" />
                    Micro-transactions for formula access
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full border border-rose-500/50 flex-shrink-0 mt-0.5" />
                    Physical sample redemption bridge
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
