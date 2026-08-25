"use client";

const phases = [
  {
    phase: "Phase 1",
    title: "Live Now",
    items: [
      "✅ AI-generated perfume formulas",
      "✅ On-chain NFT minting",
      "✅ Collection & Gallery",
      "✅ Share cards",
    ],
    status: "live",
  },
  {
    phase: "Phase 2",
    title: "AI Agents",
    items: [
      "🤖 Personal AI perfume advisor",
      "🤖 Auto-mint based on mood/weather",
      "🤖 Subscription 'Scent of the Month'",
    ],
    status: "upcoming",
  },
  {
    phase: "Phase 3",
    title: "Nanopayments",
    items: [
      "💸 Samples for $0.01",
      "💸 Note merging for $0.05",
      "💸 Community voting on ingredients",
    ],
    status: "upcoming",
  },
  {
    phase: "Phase 4",
    title: "Metaverse",
    items: [
      "🌐 Perfume as avatar status",
      "🌐 Cross-world scent layers",
      "🌐 Digital-to-physical redemption",
    ],
    status: "upcoming",
  },
];

export default function RoadmapSection() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-16 space-y-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold text-white">Roadmap</h2>
        <p className="text-white/50">Where ScentProtocol is headed</p>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/10 md:-translate-x-px" />

        <div className="space-y-8">
          {phases.map((p, i) => (
            <div
              key={p.phase}
              className={`relative flex items-start gap-6 ${
                i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Dot */}
              <div className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-slate-950 md:-translate-x-1.5 mt-2 z-10" />

              {/* Card */}
              <div
                className={`ml-10 md:ml-0 md:w-[calc(50%-2rem)] glass-card rounded-xl p-5 space-y-3 ${
                  p.status === "live"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      p.status === "live"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {p.status === "live" ? "LIVE" : "UPCOMING"}
                  </span>
                  <span className="text-xs text-white/40">{p.phase}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{p.title}</h3>
                <ul className="space-y-1.5">
                  {p.items.map((item) => (
                    <li key={item} className="text-sm text-white/60">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
