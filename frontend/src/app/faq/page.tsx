export const metadata = {
  title: "FAQ | ScentProtocol",
  description: "Frequently asked questions about ScentProtocol collections, minting, and digital perfumery",
};

const faqs = [
  {
    q: "What collections exist in ScentProtocol?",
    a: "Our ecosystem features 5 distinct pillars:\n\n• ScentProtocol V3 (Mainnet): The core collection of AI-generated perfumes.\n• Genesis Collection: The first 100 exclusive, free-to-mint founding NFTs with a unique commit-reveal mechanic.\n• MFW 2026: A limited series of 500 NFTs dedicated to Milan Fashion Week 2026.\n• Viral Scent: A free-to-mint experiment (10k supply) that analyzes your wallet history to create a scent matching your crypto archetype.\n• Scent Alchemy (Hybrids): A deflationary mechanic where you burn 2 existing NFTs to forge 1 mutated Hybrid, with a 15% chance to upgrade its rarity tier.",
  },
  {
    q: "How much does minting cost?",
    a: "It depends on the collection:\n• ScentProtocol V3: 1 USDC per mint (no per-wallet limit).\n• Genesis Collection: Free (limited to 1 per wallet).\n• Viral Scent: Free (limited to 1 per wallet).\n• MFW 2026: 5 USDC (or 1 USDC if you hold a Genesis NFT), up to 3 per wallet.\n• Scent Alchemy: Requires burning 2 existing Scent NFTs + a 0.1 USDC blending fee.",
  },
  {
    q: "What exactly do I get when I mint?",
    a: "You receive a unique ERC-721 NFT. It contains a generated fragrance formula (3 top, 3 heart, and 3 base notes), concentration level, rarity tier, and a poetic AI-generated description. Each NFT is also visually accompanied by a unique, deterministic generative ScentCrest logo.",
  },
  {
    q: "What is the ScentCrest logo?",
    a: "It's our signature generative brand logo. It is created directly in the browser using mathematics based on a unique seed (perfume name + creator address). Each NFT has its own unique initials, geometric pattern, and color matching its rarity. No external APIs or uploaded images are used.",
  },
  {
    q: "Is every scent truly unique?",
    a: "Yes. The smart contract uses a combination of blockchain randomness (blockhash) and your unique seed to generate the formula. The probability of creating two absolutely identical scents is astronomically low.",
  },
  {
    q: "How is the formula generated? Is the process fair and tamper-proof?",
    a: "Yes. We use a commit-reveal mechanism combined with on-chain randomness (blockhash + timestamp + your unique seed). The formula is generated entirely inside the smart contract — nobody, not even the team, can predict or manipulate the outcome before minting. What you see is what the blockchain produced.",
  },
  {
    q: "Is it safe to connect my wallet for Viral Scent analysis?",
    a: "Absolutely. Our analyzer reads only public blockchain data (via Etherscan API): the date of the first transaction, total transaction count, and current balance. We do not request access to your funds, cannot sign transactions, and never store your private keys.",
  },
  {
    q: "Where is the NFT data stored? What about IPFS?",
    a: "ScentProtocol uses a hybrid storage model for maximum reliability:\n\n• On-chain: The core formula (notes, rarity, concentration, creator address) is stored directly inside the smart contract on Arc. This data is permanent and cannot be lost.\n• IPFS: The full metadata (including the AI-generated description and image) is pinned to IPFS for decentralized access. This ensures your NFT remains readable even if our servers go offline.",
  },
  {
    q: "What if I don't like the scent I minted? Can I re-mint?",
    a: "For Genesis and Viral Scent collections, each wallet can mint only one NFT — this is by design to ensure fairness and scarcity. The scent you receive is determined by your unique seed, so the result is deterministic. However, you can use Scent Alchemy to blend it with another NFT to forge a completely new Hybrid scent!",
  },
  {
    q: "Can I sell or trade my Scent NFT?",
    a: "Yes. As with any ERC-721 standard, you are the full owner. You can list it on our advanced built-in Marketplace (which supports escrowed offers, creator royalties, and multi-collection trading), transfer it to another wallet, or keep it in your collection forever.",
  },
  {
    q: "Will I ever be able to smell this scent in reality?",
    a: "Not yet, but it's part of our long-term vision. We plan partnerships with perfume houses and hardware manufacturers so that holders of high-rarity NFTs can eventually redeem their digital assets for real physical fragrance samples or experience them via olfactory displays.",
  },
  {
    q: "What blockchain is this on, and do I need ETH for gas?",
    a: "ScentProtocol is built on the Arc network (an EVM-compatible L2). Arc's main advantage: gas is paid in USDC. You don't need ETH. Just make sure you have some USDC on the Arc network to pay for minting and marketplace fees (except for the free Viral and Genesis mints).",
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center pb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-center text-white/50 mb-12 text-lg">
        Everything you need to know about ScentProtocol collections and digital perfumery
      </p>
      
      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="glass-card p-6 hover:border-amber-500/30 transition-colors duration-300">
            <h3 className="font-semibold text-lg text-amber-400 mb-3 flex items-start gap-3">
              <span className="text-amber-500/50 text-xl shrink-0">Q.</span>
              <span className="whitespace-pre-line">{f.q}</span>
            </h3>
            <p className="text-white/70 text-sm leading-relaxed pl-8 whitespace-pre-line">
              {f.a}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-white/50 mb-4">Still have questions?</p>
        <a 
          href="mailto:scentprotocol.support@gmail.com" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact Support
        </a>
      </div>
    </div>
  );
}
