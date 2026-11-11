import Link from "next/link";
import SectionHeader from "@/components/home/SectionHeader";
import Reveal from "@/components/home/Reveal";

export const metadata = {
  title: "Vision | ScentProtocol — The Future of Digital Scent",
  description: "Why the internet of smell is not science fiction — it's inevitable",
};

const TECH = [
  { tag: "oPhone (2014)", text: "Harvard researchers created a device that could transmit scents over the internet using 8 base \"notes\" — like an olfactory printer." },
  { tag: "Olfactory Displays", text: "Companies like OVR Technology and Feelreal are building VR scent modules that release specific aromas on cue." },
  { tag: "Scent Devices", text: "Companies like Aromajoin are building advanced scent devices that can reproduce complex fragrances triggered by digital signals." },
];

// Quotes refined for accuracy and professional attribution.
const QUOTES = [
  { text: "The perfume of a flower is its soul. To capture it digitally is to capture the essence of life itself.", by: "A sentiment echoing Marcel Proust", accent: "#f59e0b" },
  { text: "The future of the internet is multi-sensory. We will not just see and hear the web — we will smell it, taste it, feel it.", by: "Prof. Nimesha Ranasinghe, Digital Scent Pioneer", accent: "#d946ef" },
  { text: "Smell is the sense most closely linked to emotion and memory. A digital scent internet could revolutionize therapy, education, and human connection.", by: "Dr. Jay Gottfried, Neuroscientist", accent: "#22d3ee" },
];

const PHASES = [
  { n: "1", title: "Digital Formulas & On-Chain Ownership", when: "Now", status: "Live", accent: "#d946ef",
    text: "ScentProtocol has already launched a multi-collection ecosystem (V3, Genesis, MFW 2026, Viral). Each fragrance is a verifiable, ownable digital asset with a robust marketplace supporting direct sales and binding escrowed offers. This is the \"MP3 moment\" for smell." },
  { n: "2", title: "Scent Alchemy & AI Personalization", when: "Now", status: "Live", accent: "#22d3ee",
    text: "Introducing deflationary mechanics and smart discovery. Users can now burn two existing NFTs in the Scent Alchemy lab to forge a mutated Hybrid with a chance for rarity upgrades. Coupled with our AI Scent Advisor, the protocol intelligently matches users to fragrances based on mood, weather, and on-chain behavior." },
  { n: "3", title: "Scent Streaming & Hardware Integration", when: "2026-2028", status: "Planned", accent: "#d946ef",
    text: "As olfactory displays become consumer-ready, NFT owners will be able to \"play\" their scents through connected devices. Imagine browsing an NFT gallery or a virtual world and actually smelling each piece in real-time." },
  { n: "4", title: "Full Olfactory Internet", when: "2030+", status: "Planned", accent: "#d946ef",
    text: "A decentralized network of scent creators, distributors, and consumers. Digital perfumers will be as common as digital artists today. Scent will become a fundamental, programmable medium of human expression and connection." },
];

const FOUNDATION = [
  { lead: "A standardized format for scent formulas", note: "we have it" },
  { lead: "A way to prove ownership and authenticity", note: "blockchain" },
  { lead: "A liquid marketplace with advanced features like escrowed offers and creator royalties", note: "we have it" },
  { lead: "Deflationary mechanics and AI-driven discovery to sustain long-term ecosystem value", note: "Scent Alchemy & AI Advisor" },
  { lead: "A community of early adopters who understand digital scent", note: "that's you" },
];

export default function VisionPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
      {/* Hero */}
      <header className="mb-14 text-center sm:mb-20">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" /> Vision 2030
        </span>
        <h1 className="font-display text-balance bg-gradient-to-r from-fuchsia-300 via-pink-300 to-amber-300 bg-clip-text pb-3 text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-7xl">
          The Internet You Can Smell
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-white/55 sm:text-lg">
          Why digital scent is the final frontier of human-computer interaction
        </p>
      </header>

      {/* Introduction */}
      <section className="mx-auto max-w-3xl">
        <blockquote className="border-l-2 border-fuchsia-400/70 pl-6 font-display text-2xl italic leading-snug text-white/90 sm:text-3xl">
          &ldquo;The sense of smell is the most powerful trigger of memory and emotion — yet it remains the only human sense that technology has failed to digitize.&rdquo;
        </blockquote>
        <div className="mt-8 space-y-5 text-[17px] leading-8 text-white/70">
          <p>
            We live in an age where sight and sound have been perfectly replicated by screens and speakers. Touch is being simulated through haptic feedback. But smell — the most primal, emotional, and memory-linked of all senses — remains stubbornly analog.
          </p>
          <p>
            ScentProtocol believes this is about to change. And digital perfume NFTs are the first building block.
          </p>
        </div>
      </section>

      {/* Science of smell */}
      <Reveal className="mx-auto mt-20 max-w-3xl">
        <SectionHeader eyebrow="Chapter one" title="The Science of Smell" align="left" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="glass-card p-6">
            <p className="font-display text-5xl font-semibold leading-none text-amber-300">1 trillion</p>
            <p className="mt-2 text-sm text-white/55">different odors we can distinguish (Bushdid et al., 2014, Science)</p>
          </div>
          <div className="glass-card p-6">
            <p className="font-display text-5xl font-semibold leading-none text-fuchsia-300">~400</p>
            <p className="mt-2 text-sm text-white/55">types of olfactory receptors in our nose</p>
          </div>
        </div>
        <div className="mt-6 space-y-5 text-[17px] leading-8 text-white/70">
          <p>
            Human olfaction is astonishingly complex. We can distinguish over 1 trillion different odors (Bushdid et al., 2014, Science). Each scent is a unique molecular signature — a combination of volatile compounds that bind to ~400 types of olfactory receptors in our nose.
          </p>
          <p className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-5 text-white/85">
            But here&apos;s the key insight: every scent can be decomposed into a formula. Just like a song is a sequence of notes, a fragrance is a sequence of molecules. And formulas can be digitized.
          </p>
        </div>
      </Reveal>

      {/* Not science fiction */}
      <Reveal className="mt-20">
        <SectionHeader
          eyebrow="Chapter two"
          title="This Is Not Science Fiction"
          subtitle="Digital scent technology already exists. It's just in its infancy:"
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {TECH.map((t) => (
            <li key={t.tag} className="glass-card p-6">
              <span className="inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                {t.tag}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{t.text}</p>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-8 max-w-3xl text-center text-[17px] leading-8 text-white/70">
          The hardware is catching up. What&apos;s missing is the <span className="font-semibold text-fuchsia-300">digital infrastructure</span> — a standardized way to represent, own, and trade scent formulas. That&apos;s exactly what ScentProtocol is building.
        </p>
      </Reveal>

      {/* Quotes */}
      <Reveal className="mt-20">
        <div className="grid gap-3 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure key={q.by} className="glass-card flex flex-col justify-between p-6" style={{ borderTop: `2px solid ${q.accent}` }}>
              <blockquote className="font-display text-xl italic leading-snug text-white/90">&ldquo;{q.text}&rdquo;</blockquote>
              <figcaption className="mt-5 text-xs text-white/45">— {q.by}</figcaption>
            </figure>
          ))}
        </div>
      </Reveal>

      {/* Road */}
      <Reveal className="mt-24">
        <SectionHeader eyebrow="Chapter three" title="The Road to Olfactory Internet" />
        <ol className="relative mx-auto max-w-3xl space-y-4 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-white/10">
          {PHASES.map((p) => (
            <li key={p.n} className="relative pl-14">
              <span
                className="absolute left-0 top-5 flex h-10 w-10 items-center justify-center rounded-full border bg-[#120a24] font-display text-lg font-semibold"
                style={{ borderColor: p.accent, color: p.accent }}
              >
                {p.n}
              </span>
              <div className="glass-card p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h3 className="font-display text-2xl font-semibold leading-tight text-white">{p.title}</h3>
                  <span className="text-xs text-white/40">{p.when}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      p.status === "Live" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-white/15 bg-white/5 text-white/50"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{p.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>

      {/* Foundation */}
      <Reveal className="mx-auto mt-24 max-w-3xl">
        <SectionHeader eyebrow="Chapter four" title="Why ScentProtocol Is the Foundation" subtitle="When the olfactory internet arrives, it will need:" />
        <ul className="space-y-2.5">
          {FOUNDATION.map((f) => (
            <li key={f.lead} className="glass-card flex items-start gap-4 p-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="text-sm leading-relaxed text-white/75">
                {f.lead} <span className="text-white/40">({f.note})</span>
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-[17px] leading-8 text-white/70">
          ScentProtocol is not just minting NFTs. We are building the <span className="font-semibold text-fuchsia-300">infrastructure for the next sensory revolution</span>.
        </p>
      </Reveal>

      {/* Conclusion */}
      <Reveal className="mt-24">
        <section className="relative overflow-hidden rounded-3xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/10 to-transparent p-8 text-center sm:p-12">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <h2 className="relative font-display text-balance pb-1 text-4xl font-semibold leading-tight text-white sm:text-5xl">The Future Is Scented</h2>
          <p className="relative mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            In 1995, people laughed at the idea of buying books online. In 2010, they laughed at digital art. Today, NFTs are a multi-billion dollar industry.
          </p>
          <p className="relative mx-auto mt-4 max-w-2xl font-display text-2xl italic leading-snug text-white/90">
            Tomorrow, they will laugh at the idea that we ever lived in a world where the internet had no smell.
          </p>
          <Link
            href="/"
            className="relative mt-8 inline-flex min-h-[48px] items-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 px-8 py-3 font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110"
          >
            Join the Revolution &rarr;
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
