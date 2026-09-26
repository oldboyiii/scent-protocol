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
    phase: "Phase 1.5",
    title: "Marketplace Launch",
    status: "completed",
    items: [
      "Peer-to-peer NFT trading platform",
      "Fixed price & auction listing types",
      "Royalty enforcement on secondary sales",
      "Rarity-based filtering & search",
    ],
  },
  {
    phase: "Phase 2",
    title: "AI Agent & Mainnet",
    status: "in-progress",
    items: [
      { text: "Personal AI advisor for scent recommendations", done: true },
      { text: "Successful Mainnet deployment", done: true },
      { text: "Limited Event Editions (Special Occasion Drops)", done: true },
      { text: "Auto-minting based on mood & context", done: false },
      { text: "Session keys for gasless experience", done: false },
      { text: "Natural language → fragrance pipeline", done: false },
    ],
  },
  {
    phase: "Phase 3",
    title: "Advanced On-Chain Mechanics",
    status: "upcoming",
    items: [
      "$0.01 scent previews (no NFT required)",
      "Scent Blending: Burn 2 NFTs to forge a unique hybrid fragrance",
      "Evolving Scents: Dynamic metadata upgrades based on holding duration",
      "Subscription 'Scent of the Month' & micro-governance",
    ],
  },
  {
    phase: "Phase 4",
    title: "Phygital & Living NFTs",
    status: "upcoming",
    items: [
      "Dynamic Environment Scents: NFTs adapt to real-world seasons via Oracles",
      "Physical Redemption: Top rarity holders claim real-world perfume samples",
      "Avatar scent status & wearable fragrance in virtual worlds",
      "Cross-platform NFT interoperability",
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
            <div 
              key={i} 
              className={`relative flex flex-col md:flex-row gap-4 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
            >
              {/* Dot - Color depends on status */}
              <div 
                className={`absolute left-4 md:left-1/2 w-3 h-3 rounded-full border-2 border-[#0a0a1a] md:-translate-x-1.5 translate-y-2 z-10 
                  ${p.status === "completed" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : 
                    p.status === "in-progress" ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-white/20"}`} 
              />

              {/* Content */}
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
                      const isDone = typeof item === 'object' ? item.done : (p.status === "completed");
                      const itemText = typeof item === 'object' ? item.text : item;
                      
                      return (
                        <li key={j} className="text-sm text-white/60 flex items-start gap-2">
                          <span className={`mt-0.5 ${isDone ? "text-green-500" : "text-amber-500"}`}>
                            {isDone ? "✓" : "○"}
                          </span>
                          <span className={isDone ? "text-white/80 line-through decoration-white/20" : ""}>
                            {itemText}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Spacer for other side */}
              <div className="hidden md:block md:w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Support Section */}
      <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/40">
        <p>© 2026 ScentProtocol. All rights reserved.</p>
        
        <div className="flex items-center gap-6">
          {/* Active X (Twitter) Link */}
          <a
            href="https://x.com/Scent_Protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors group"
            aria-label="Follow us on X"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* Active Support Email */}
          <a
            href="mailto:scentprotocol.support@gmail.com"
            className="hover:text-amber-400 transition-colors flex items-center gap-2 group"
            aria-label="Contact Support"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>Support</span>
          </a>
        </div>
      </div>
    </section>
  );
}
