"use client";

export default function InfoSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-20">
      <div className="glass-card p-8 md:p-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-scent-gold to-scent-rose bg-clip-text text-transparent">
          What is ScentProtocol?
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-scent-gold">The Concept</h3>
            <p className="text-white/70 leading-relaxed">
              ScentProtocol is the world&apos;s first digital perfume house on the blockchain. 
              Every fragrance is a unique NFT — a digital certificate of ownership for an 
              AI-generated formula. No two scents are ever the same.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4 text-scent-gold">How It Works</h3>
            <ol className="space-y-3 text-white/70">
              <li className="flex gap-3">
                <span className="text-arc-500 font-bold">1.</span>
                <span>Choose gender and perfume type (Parfum, EDP, EDT, EDC)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-arc-500 font-bold">2.</span>
                <span>Pay 10 USDC — the smart contract generates a unique formula on-chain</span>
              </li>
              <li className="flex gap-3">
                <span className="text-arc-500 font-bold">3.</span>
                <span>AI writes a poetic description — your NFT is ready</span>
              </li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-scent-gold mb-1">100%</div>
            <div className="text-xs text-white/50">Unique Formulas</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-scent-gold mb-1">&lt;1s</div>
            <div className="text-xs text-white/50">Finality on Arc</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-scent-gold mb-1">9</div>
            <div className="text-xs text-white/50">Notes Per Scent</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-scent-gold mb-1">4</div>
            <div className="text-xs text-white/50">Rarity Tiers</div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <h3 className="text-xl font-semibold mb-4 text-scent-gold">Fragrance Types</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name: "Parfum", range: "20-30%", desc: "The most concentrated. 8-12 hours of longevity. Evening & special occasions." },
              { name: "EDP", range: "15-20%", desc: "Eau de Parfum. 6-8 hours. Perfect for daily wear and office." },
              { name: "EDT", range: "10-15%", desc: "Eau de Toilette. 4-6 hours. Light & fresh. Best for summer." },
              { name: "EDC", range: "5-10%", desc: "Eau de Cologne. 2-4 hours. Refreshing. After-shave & hot days." },
            ].map((t) => (
              <div key={t.name} className="bg-white/5 rounded-xl p-4">
                <div className="font-bold text-white mb-1">{t.name}</div>
                <div className="text-xs text-scent-gold mb-2">{t.range} concentration</div>
                <div className="text-xs text-white/50">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 mt-8">
          <h3 className="text-xl font-semibold mb-4 text-scent-gold">Why Arc?</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-white/60">
            <div className="flex items-start gap-3">
              <span className="text-green-400 text-lg">✓</span>
              <span><strong className="text-white">USDC = gas</strong> — no ETH needed, predictable fees in dollars</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 text-lg">✓</span>
              <span><strong className="text-white">Sub-second finality</strong> — your NFT is confirmed instantly</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 text-lg">✓</span>
              <span><strong className="text-white">EVM-native</strong> — deploy from Remix, use MetaMask</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
