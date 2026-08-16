export const metadata = {
  title: "FAQ | ScentProtocol",
  description: "Frequently asked questions about ScentProtocol",
};

const faqs = [
  {
    q: "What do I get when I mint?",
    a: "An ERC-721 NFT containing a unique 9-note fragrance formula (3 top, 3 heart, 3 base notes), concentration level, rarity tier, and an AI-generated poetic description.",
  },
  {
    q: "Why 10 USDC?",
    a: "This covers the on-chain formula generation, NFT minting, and gas fees on the Arc network. No hidden costs.",
  },
  {
    q: "Is every scent truly unique?",
    a: "Yes. The smart contract uses blockhash-based randomness to generate formulas. The probability of duplicates is astronomically low.",
  },
  {
    q: "Can I trade my Scent NFT?",
    a: "Absolutely. Like any ERC-721, you can list it on marketplaces, transfer it, or keep it in your collection forever.",
  },
  {
    q: "What blockchain is this on?",
    a: "ScentProtocol is built on Arc — an EVM-compatible L2 with sub-second finality and USDC-native gas.",
  },
  {
    q: "Do I need ETH for gas?",
    a: "No. On Arc, gas is paid in USDC. You only need USDC in your wallet to mint.",
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-10 bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent">
        FAQ
      </h1>
      <div className="space-y-6">
        {faqs.map((f, i) => (
          <div key={i} className="glass-card p-6">
            <h3 className="font-semibold text-lg text-amber-400 mb-2">{f.q}</h3>
            <p className="text-white/70 text-sm leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
