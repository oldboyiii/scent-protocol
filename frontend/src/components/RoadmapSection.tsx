"use client";

const phases = [
  {
    phase: "Phase 1",
    title: "Foundation & Live Features",
    status: "completed",
    items: [
      "On-chain perfume generation with unique formulas",
      "ERC-721 NFT minting with USDC gas (Mainnet Ready)",
      "AI-generated poetic descriptions",
      "Collection, Gallery & Marketplace pages",
      { text: "✨ Limited Event Editions (Special Occasion Drops)", done: true, highlight: true },
    ],
  },
  {
    phase: "Phase 2",
    title: "AI Agent & Smart Automation",
    status: "in-progress",
    items: [
      { text: "Personal AI advisor for scent recommendations", done: true },
      { text: "Successful Mainnet deployment & Audit", done: true },
      { text: "Auto-minting based on mood & context", done: false },
      { text: "Natural language → fragrance pipeline", done: false },
      { text: "Preparation for Account Abstraction (Gasless)", done: false },
    ],
  },
  {
    phase: "Phase 3",
    title: "Nanopayments & Utility",
    status: "upcoming",
    items: [
      "$0.01 scent previews (ERC-1155 upgrade)",
      "$0.05 note merging & custom blending",
      "$0.001 community governance voting",
      "Subscription 'Scent of the Month' model",
    ],
  },
  {
    phase: "Phase 4",
    title: "Metaverse & Beyond",
    status: "upcoming",
    items: [
      "Avatar scent status in virtual worlds",
      "Wearable fragrance as social signal",
      "Cross-platform NFT interoperability",
      "Physical redemption partnerships",
    ],
  },
];

export default function RoadmapSection() {
  return (
    <section className="w-full max-w-4xl mx-auto py-16 px-4">
      <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent">
        Roadmap
      </h2>
      <p className="text-white/50 text-center mb-10">
        The future of digital perfumery on Arc
      </p>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/10 md:-translate-x-px" />

        <div className="space-y-8">
          {phases.map((p, i) => (
            <div 
              key={i} 
              className={`relative flex flex-col md:flex-row gap-4 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
            >
              {/* Timeline dot - color depends on phase status */}
              <div 
                className={`absolute left-4 md:left-1/2 w-3 h-3 rounded-full border-2 border-[#0a0a1a] md:-translate-x-1.5 translate-y-2 z-10 
                  ${p.status === "completed" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : 
                    p.status === "in-progress" ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-white/20"}`} 
              />

              {/* Phase content card */}
              <div className={`ml-10 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-10 md:text-right" : "md:pl-10 md:text-left"}`}>
                <div className={`glass-card p-5 ${
                  p.status === "completed" ? "border-l-2 border-green-500" : 
                  p.status === "in-progress" ? "border-l-2 border-amber-500" : "border-l-2 border-white/10"
                }`}>
                  <div className="flex items-center gap-2 mb-2 justify-start md:justify-inherit">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      p.status === "completed" ? "text-green-400" : 
                      p.status === "in-progress" ? "text-amber-400" : "text-white/40"
                    }`}>
                      {p.phase}
                    </span>
                    {p.status === "completed" && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-[10px] text-green-400 font-bold uppercase border border-green-500/30">
                        Live
                      </span>
                    )}
                    {p.status === "in-progress" && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] text-amber-400 font-bold uppercase border border-amber-500/30">
                        In Progress
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{p.title}</h3>
                  <ul className="space-y-1.5">
                    {p.items.map((item, j) => {
                      // Support both plain strings and objects with { text, done, highlight }
                      const isObj = typeof item === 'object';
                      const isDone = isObj ? item.done : (p.status === "completed");
                      const itemText = isObj ? item.text : item;
                      const isHighlight = isObj && item.highlight;
                      
                      return (
                        <li key={j} className={`text-sm flex items-start gap-2 ${isHighlight ? "text-amber-200 font-medium" : "text-white/60"}`}>
                          <span className={`mt-0.5 ${isDone ? "text-green-500" : "text-amber-500"}`}>
                            {isDone ? "✓" : "○"}
                          </span>
                          <span className={isDone && !isHighlight ? "text-white/80 line-through decoration-white/20" : ""}>
                            {itemText}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Spacer for alternating layout */}
              <div className="hidden md:block md:w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
