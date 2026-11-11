import Link from "next/link";
import SectionHeader from "@/components/home/SectionHeader";
import Reveal from "@/components/home/Reveal";
import LiveStats from "@/components/home/LiveStats";

export const metadata = {
  title: "About | ScentProtocol",
  description: "The world's first digital perfume house on the blockchain",
};

// Each collection keeps the colour it has everywhere else in the app.
const PILLARS = [
  { name: "ScentProtocol V3", tag: "Mainnet", accent: "#d4af37", href: "/", cta: "Create a scent", text: "The core collection of AI-generated perfumes." },
  { name: "Genesis Collection", tag: "100 supply", accent: "#f59e0b", href: "/events/genesis", cta: "Open the event", text: "100 exclusive, free-to-mint founding NFTs with commit-reveal mechanics." },
  { name: "MFW 2026", tag: "500 supply", accent: "#a855f7", href: "/events/mfw-2026", cta: "Open the event", text: "Milan Fashion Week exclusive drop (500 supply)." },
  { name: "Viral Scent", tag: "10k supply", accent: "#d946ef", href: "/wallet-scent", cta: "Analyze my wallet", text: "A free-to-mint campaign (10k supply) that analyzes your wallet history to generate a unique \u201cWallet Scent\u201d archetype." },
  { name: "Scent Alchemy (Hybrids)", tag: "Blend", accent: "#22d3ee", href: "/alchemy", cta: "Try Alchemy", text: "A deflationary blending mechanic. Burn 2 existing NFTs to forge 1 mutated Hybrid, featuring a 15% chance to upgrade its rarity tier." },
];

const EXPERIENCE = [
  {
    title: "AI Scent Advisor",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 7.071l.707.707M12 9a3 3 0 100 6 3 3 0 000-6z",
    text: "Navigating digital perfumery is highly personal. The AI Scent Advisor helps you find your perfect match by analyzing ready-made scenarios (like a CEO meeting, beach sunset, or gala night), your current mood, or even real-time weather and location data. It instantly generates a tailored fragrance profile with specific top, heart, and base notes, acting as your personal digital sommelier.",
  },
  {
    title: "Sonic Notes",
    icon: "M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z",
    text: "ScentProtocol has evolved beyond the visual. Every fragrance NFT now features a unique, procedurally generated soundtrack derived directly from its on-chain top, heart, and base notes, allowing you to literally listen to your scent. Through the AI Scent Advisor, you can even preview the exact sonic landscape of your current mood or real-time local weather before you mint, creating a truly immersive, multisensory digital perfumery experience.",
  },
  {
    title: "ScentCrest",
    icon: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z",
    text: "Every NFT features a ScentCrest \u2014 a unique, generative brand logo with custom initials and geometric patterns, rendered client-side using the NFT\u2019s unique seed. No external APIs. 100% deterministic. It looks like a luxury perfume label, ready to be printed on a physical bottle.",
  },
];

const PHYGITAL = [
  { title: "Redeemable Digital Twins", text: "Future roadmap includes the ability to lock or burn your NFT to claim a physically crafted, lab-blended bottle of your exact digital formula, delivered in luxury packaging." },
  { title: "Unforgeable Provenance", text: "Every physical bottle will feature an NFC chip linked directly to its on-chain NFT. This guarantees absolute authenticity, eliminating counterfeits and proving the scent\u2019s lineage from the digital lab to your vanity." },
  { title: "Fractional & Collaborative Perfumery", text: "RWA mechanics will allow communities to co-own rare \u201cMaster Formulas\u201d and vote on their physical production runs, democratizing high-end perfumery." },
];

const FACTS = [
  { value: "9", label: "Notes per scent" },
  { value: "4", label: "Rarity tiers" },
  { value: "15%", label: "Alchemy upgrade chance" },
  { value: "<1s", label: "Finality on Arc" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-4 pb-24 pt-10">
      {/* Intro */}
      <header className="animate-fade-up mx-auto max-w-3xl text-center">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">About</p>
        <h1 className="font-display text-balance bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text pb-3 text-5xl font-semibold leading-[1.1] tracking-tight text-transparent md:text-6xl">
          About ScentProtocol
        </h1>
        <p className="mt-2 text-white/50">The world&apos;s first digital perfume house on the blockchain</p>
        <p className="mt-8 font-display text-balance text-2xl leading-snug text-white/85 md:text-[1.7rem]">
          ScentProtocol is the world&apos;s first digital perfume house built entirely on-chain. Every fragrance is a unique ERC-721 NFT &mdash; a digital certificate of ownership for an AI-generated formula that can never be replicated, serving as the foundational{" "}
          <span className="text-amber-300">digital twin</span> for tangible luxury.
        </p>
      </header>

      <LiveStats />

      {/* Vision */}
      <Reveal>
        <section className="grid gap-6 md:grid-cols-[1fr_1.6fr] md:gap-12">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">Why we build</p>
            <h2 className="font-display text-4xl font-semibold leading-[1.1] text-white">The Vision</h2>
          </div>
          <p className="text-lg leading-relaxed text-white/75">
            We believe luxury should be borderless, verifiable, and eternal. By minting a Scent NFT, you own a one-of-a-kind formula generated by on-chain randomness &mdash; no two scents are ever the same.
          </p>
        </section>
      </Reveal>

      {/* Ecosystem */}
      <Reveal>
        <section>
          <SectionHeader eyebrow="The Ecosystem" title="Five pillars, one house" subtitle="ScentProtocol has evolved into a multi-layered ecosystem with five distinct pillars:" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Link
                key={p.name}
                href={p.href}
                className={`group glass-card relative flex flex-col overflow-hidden p-5 transition-colors hover:border-white/25 hover:bg-white/[0.07] ${i === 0 ? "lg:col-span-1" : ""}`}
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${p.accent}, transparent)` }} />
                <span className="mb-3 inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: p.accent, borderColor: `${p.accent}55`, background: `${p.accent}14` }}>
                  {p.tag}
                </span>
                <h3 className="font-display text-2xl font-semibold leading-tight text-white">{p.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">{p.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: p.accent }}>
                  {p.cta}
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Experience */}
      <Reveal>
        <section>
          <SectionHeader eyebrow="The experience" title="More than a picture" subtitle="Advice, sound and a brand mark for every fragrance." />
          <div className="grid gap-3 lg:grid-cols-3">
            {EXPERIENCE.map((e) => (
              <article key={e.title} className="glass-card p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={e.icon} />
                  </svg>
                </span>
                <h3 className="font-display text-2xl font-semibold text-white">{e.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{e.text}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Phygital / RWA */}
      <Reveal>
        <section>
          <SectionHeader
            eyebrow="Roadmap"
            title="From Blockchain to Vanity"
            subtitle={"ScentProtocol is actively pioneering the Real-World Asset (RWA) utility for digital fragrances. We are moving beyond \u201cjust JPEGs\u201d to create a true Phygital ecosystem:"}
          />
          <ol className="relative mx-auto max-w-3xl space-y-3 border-l border-white/10 pl-6">
            {PHYGITAL.map((p, i) => (
              <li key={p.title} className="relative glass-card p-5">
                <span aria-hidden className="absolute -left-[31px] top-6 flex h-3 w-3 items-center justify-center rounded-full border border-fuchsia-400/60 bg-[#120a24]">
                  <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-xl text-white/25">0{i + 1}</span>
                  <h3 className="font-display text-xl font-semibold text-white">{p.title}</h3>
                  <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">Planned</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{p.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      {/* Built on Arc + facts */}
      <Reveal>
        <section className="glass-card p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">The network</p>
              <h2 className="font-display text-4xl font-semibold leading-[1.1] text-white">Built on Arc</h2>
              <p className="mt-4 leading-relaxed text-white/65">
                Arc&apos;s sub-second finality and USDC-native environment make minting and trading seamless. No ETH needed, no long waits &mdash; just pure, accessible digital perfumery.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {FACTS.map((f) => (
                <div key={f.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
                  <dt className="sr-only">{f.label}</dt>
                  <dd className="font-display text-4xl font-semibold tabular-nums text-amber-300">{f.value}</dd>
                  <p className="mt-1 text-xs text-white/50" aria-hidden>{f.label}</p>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </Reveal>

      {/* Closing */}
      <Reveal>
        <section className="relative overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/10 to-transparent p-8 text-center md:p-12">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <h2 className="relative font-display text-balance text-3xl font-semibold leading-tight text-white md:text-4xl">
            The Future: An Internet You Can Smell
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl leading-relaxed text-white/70">
            ScentProtocol is more than NFTs &mdash; it&apos;s the foundational layer for a digital olfactory internet. Read our vision for the future of digital scent technology and how we plan to bridge the gap between Web3 and physical perfumery.
          </p>
          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/vision" className="inline-flex min-h-[48px] items-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110">
              Read the Vision
            </Link>
            <Link href="/#mint-form" className="inline-flex min-h-[48px] items-center rounded-xl border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10">
              Create your scent
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
