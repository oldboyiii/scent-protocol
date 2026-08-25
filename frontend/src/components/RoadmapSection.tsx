"use client";

const phases = [
  {
    phase: "Phase 1",
    title: "Live Now",
    status: "completed",
    items: [
      "On-chain perfume generation with unique formulas",
      "ERC-721 NFT minting with USDC gas",
      "AI-generated poetic descriptions",
      "Collection & Gallery pages",
    ],
  },
  {
    phase: "Phase 2",
    title: "AI Agent Integration",
    status: "upcoming",
    items: [
      "Personal AI advisor for scent recommendations",
      "Auto-minting based on mood & context",
      "Session keys for gasless experience",
      "Natural language → fragrance pipeline",
    ],
  },
  {
    phase: "Phase 3",
    title: "Nanopayments & Samples",
    status: "upcoming",
    items: [
      "$0.01 scent previews (no NFT)",
      "$0.05 note merging & blending",
      "$0.001 governance voting",
      "Subscription 'Scent of the Month'",
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
        {/* Vertical line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/10 md:-translate-x-px" />

        <div className="space-y-8">
          {phases.map((p, i) => (
            <div key={i} className={`relative flex flex-col md:flex-row gap-4 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
              {/* Dot */}
              <div className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full bg-amber-500 border-2 border-[#0a0a1a] md:-translate-x-1.5 translate-y-2 z-10" />

              {/* Content */}
              <div className={`ml-10 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-10 md:text-right" : "md:pl-10 md:text-left"}`}>
                <div className={`glass-card p-5 ${p.status === "completed" ? "border-l-2 border-green-500" : "border-l-2 border-amber-500/50"}`}>
                  <div className="flex items-center gap-2 mb-2 justify-start md:justify-inherit">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{p.phase}</span>
                    {p.status === "completed" && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-[10px] text-green-400 font-bold uppercase">
                        Live
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{p.title}</h3>
                  <ul className="space-y-1.5">
                    {p.items.map((item, j) => (
                      <li key={j} className="text-sm text-white/60 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">{p.status === "completed" ? "✓" : "○"}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Spacer for other side */}
              <div className="hidden md:block md:w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

