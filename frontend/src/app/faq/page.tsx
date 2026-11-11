"use client";

import { useState } from "react";
import Reveal from "@/components/home/Reveal";

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
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      {/* Hero Header */}
      <header className="mb-12 text-center">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">
          Support
        </p>
        <h1 className="font-display text-balance bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text pb-3 text-5xl font-semibold leading-[1.1] tracking-tight text-transparent sm:text-6xl">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/55">
          Everything you need to know about ScentProtocol collections and digital perfumery
        </p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-10">
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder-white/40 transition focus:border-amber-400/60 focus:outline-none focus:ring-4 focus:ring-amber-400/10"
        />
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="py-12 text-center text-white/50">
            <p className="text-lg font-medium">No questions found</p>
            <p className="text-sm">Try adjusting your search term.</p>
          </div>
        ) : (
          filteredFaqs.map((f, i) => {
            // Find original index to keep animations stable
            const originalIndex = faqs.findIndex((item) => item.q === f.q);
            const isOpen = openIndex === originalIndex;

            return (
              <Reveal key={f.q} delay={i * 50}>
                <div className="glass-card overflow-hidden transition-colors hover:border-amber-500/30">
                  <button
                    onClick={() => toggle(originalIndex)}
                    className="flex w-full items-start gap-4 p-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="mt-0.5 font-display text-2xl font-semibold text-amber-500/40">
                      {String(originalIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-semibold leading-snug text-white">
                        {f.q}
                      </h3>
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen
                            ? "mt-4 grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="whitespace-pre-line text-sm leading-relaxed text-white/70">
                            {f.a}
                          </p>
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`mt-1 h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </Reveal>
            );
          })
        )}
      </div>

      {/* Contact Block */}
      <Reveal className="mt-14">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl"
          />
          <h2 className="relative font-display text-3xl font-semibold text-white">
            Still have questions?
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-white/55">
            Write to us and we will get back to you.
          </p>
          <a
            href="mailto:scentprotocol.support@gmail.com"
            className="relative mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-6 py-3 font-medium text-white transition hover:bg-white/15"
          >
            <svg
              aria-hidden
              className="h-4 w-4"
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
            Contact Support
          </a>
        </div>
      </Reveal>
    </div>
  );
}
