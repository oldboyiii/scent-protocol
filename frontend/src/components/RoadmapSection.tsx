"use client";

import Link from "next/link";
import SectionHeader from "@/components/home/SectionHeader";
import Reveal from "@/components/home/Reveal";

// ✅ REPLACE WITH YOUR ACTUAL SUPPORT ADDRESS, IF IT IS DIFFERENT
const SUPPORT_EMAIL = "scentprotocol.support@gmail.com";

type Status = "completed" | "in-progress" | "upcoming";
type Item = string | { text: string; done: boolean };

const phases: Array<{ phase: string; title: string; status: Status; items: Item[] }> = [
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
      "Fixed price listings & escrowed offers", // 
      "Royalty enforcement on secondary sales",
      "Rarity-based filtering & search",
    ],
  },
  {
    phase: "Phase 2",
    title: "AI Agent & Mainnet",
    status: "completed",
    items: [
      { text: "Personal AI advisor for scent recommendations", done: true },
      { text: "Successful Mainnet deployment", done: true },
      { text: "Limited Event Editions (Special Occasion Drops)", done: true },
      { text: "Auto-minting based on mood & context (Viral Wallet Scent)", done: true },
    ],
  },
  {
    phase: "Phase 3",
    title: "Advanced On-Chain Mechanics & Multisensory Features",
    status: "in-progress",
    items: [
      { text: "Scent Blending: Burn 2 NFTs to forge a unique hybrid fragrance", done: true },
      { text: "Sonic Integration: Procedural audio soundtracks for every NFT & AI Advisor preview", done: true },
      { text: "Natural language → fragrance pipeline", done: false },
      { text: "Evolving Scents: Dynamic metadata upgrades based on holding duration", done: false },
      { text: "Subscription 'Scent of the Month' & micro-governance", done: false },
    ],
  },
  {
    phase: "Phase 4",
    title: "Cross-Chain Expansion & Virtual Worlds",
    status: "upcoming",
    items: [
      "CCTP (Cross-Chain Transfer Protocol) integration for seamless multi-chain onboarding",
      "Web2.5 creator onboarding from Ethereum, Base, and Arbitrum",
      "Unified liquidity across chains — zero fragmentation",
      "Dynamic Environment Scents: NFTs adapt to seasons via Oracles",
      "Avatar scent status & wearable fragrance in virtual worlds",
    ],
  },
  {
    phase: "Phase 5",
    title: "Phygital Reality & Global Partnerships",
    status: "upcoming",
    items: [
      "Partnerships with luxury perfume houses & fashion brands",
      "Physical Redemption: Top rarity holders claim real perfume samples",
      "Cross-platform NFT interoperability for real-world utility",
      "Global logistics & compliant distribution for physical claims",
    ],
  },
];

const STATUS: Record<Status, { label: string; color: string }> = {
  completed: { label: "Live", color: "#34d399" },
  "in-progress": { label: "In progress", color: "#fbbf24" },
  upcoming: { label: "Planned", color: "rgba(255,255,255,0.45)" },
};

function readItem(item: Item, status: Status): { text: string; done: boolean } {
  return typeof item === "string" ? { text: item, done: status === "completed" } : item;
}

/** How far a phase is: finished phases 100%, planned ones 0%, the running one by its ticked items. */
function phaseProgress(p: { status: Status; items: Item[] }): number {
  if (p.status === "completed") return 1;
  if (p.status === "upcoming") return 0;
  const done = p.items.filter((i) => readItem(i, p.status).done).length;
  return p.items.length ? done / p.items.length : 0;
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const ALL_ITEMS = phases.flatMap((p) => p.items.map((i) => readItem(i, p.status)));
const DONE_COUNT = ALL_ITEMS.filter((i) => i.done).length;
const DONE_PCT = Math.round((DONE_COUNT / ALL_ITEMS.length) * 100);

export default function RoadmapSection() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-16">
      <SectionHeader 
        eyebrow="Roadmap" 
        title="The future of digital perfumery on Arc" 
        subtitle="What is live today, what we are building now, and what comes next." 
      />

      {/* Overall progress */}
      <div className="mx-auto mb-14 max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between gap-4 text-sm">
          <span className="text-white/60">
            {DONE_COUNT} of {ALL_ITEMS.length} milestones delivered
          </span>
          <span className="font-display text-2xl font-semibold text-amber-300">{DONE_PCT}%</span>
        </div>
        <div className="flex h-2 gap-1" role="img" aria-label={`${DONE_PCT} percent of milestones delivered`}>
          {phases.map((p) => (
            <span key={p.phase} className="relative flex-1 overflow-hidden rounded-full bg-white/10">
              <span 
                className="absolute inset-y-0 left-0 rounded-full" 
                style={{ width: `${Math.round(phaseProgress(p) * 100)}%`, background: STATUS[p.status].color }} 
              />
            </span>
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] uppercase tracking-wider text-white/45">
          {(Object.keys(STATUS) as Status[]).map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: STATUS[s].color }} />
              {STATUS[s].label}
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline */}
      <ol className="relative">
        <span aria-hidden className="absolute bottom-2 left-4 top-2 w-px bg-gradient-to-b from-emerald-400/60 via-amber-400/40 to-white/10" />
        {phases.map((p, i) => {
          const st = STATUS[p.status];
          const pct = Math.round(phaseProgress(p) * 100);
          const doneN = p.items.filter((it) => readItem(it, p.status).done).length;
          return (
            <li key={p.phase} className="relative pb-8 pl-14 last:pb-0">
              <span
                className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-[#0d0a1f] text-xs font-bold"
                style={{ 
                  borderColor: st.color, 
                  color: st.color, 
                  boxShadow: p.status === "upcoming" ? "none" : `0 0 18px ${st.color}55` 
                }}
              >
                {p.status === "completed" ? (
                  <CheckIcon />
                ) : p.status === "in-progress" ? (
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: st.color }} />
                ) : (
                  i + 1
                )}
              </span>
              <Reveal>
                <article 
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/20 sm:p-6" 
                  style={{ borderTop: `2px solid ${st.color}` }}
                >
                  <header className="mb-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">{p.phase}</span>
                      <span 
                        className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" 
                        style={{ 
                          color: st.color, 
                          borderColor: `${st.color}55`, 
                          background: p.status === "upcoming" ? "transparent" : `${st.color}1a` 
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <h3 className="font-display text-balance text-2xl font-semibold leading-snug text-white">{p.title}</h3>
                    {p.status === "in-progress" && (
                      <div className="mt-3 flex items-center gap-3 text-xs text-white/50">
                        <span className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                          <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: st.color }} />
                        </span>
                        {doneN} of {p.items.length} done
                      </div>
                    )}
                  </header>
                  <ul className="space-y-2.5">
                    {p.items.map((item, j) => {
                      const it = readItem(item, p.status);
                      return (
                        <li key={j} className="flex items-start gap-3 text-sm leading-relaxed">
                          <span 
                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border" 
                            style={it.done 
                              ? { background: "#34d3991f", borderColor: "#34d39966", color: "#34d399" } 
                              : { borderColor: "rgba(255,255,255,0.2)", color: "transparent" }
                            }
                          >
                            {it.done && <CheckIcon className="h-3 w-3" />}
                          </span>
                          <span className={it.done ? "text-white/85" : "text-white/55"}>{it.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ol>

      {/* Contact & Support Section */}
      <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/40">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <p>© 2026 ScentProtocol. All rights reserved.</p>
          
          {/* Vision Link in Footer */}
          <Link 
            href="/vision" 
            className="text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 group font-medium"
          >
            <span>Explore our vision</span>
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          {/* X (Twitter) Link */}
          <a
            href="https://x.com/Scent_Protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:border-amber-400/40 hover:bg-white/10 hover:text-white"
            aria-label="Follow us on X"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* YouTube Channel Link */}
          <a
            href="https://youtube.com/@scentprotocol?si=5YIo8oehR1d_kuNk"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:border-amber-400/40 hover:bg-white/10 hover:text-white"
            aria-label="Subscribe to our YouTube channel"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>

          {/* Support Email Link */}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-white/60 transition-colors hover:border-amber-400/40 hover:bg-white/10 hover:text-white"
            aria-label="Contact Support"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Support</span>
          </a>
        </div>
      </div>
    </section>
  );
}
