"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

interface EventItem {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  totalSupply: number;
  minted: number;
  price: string;
  startDate: string;
  endDate?: string;
  status: "live" | "upcoming" | "ended";
  partner?: string;
  isLaunch?: boolean;
  isMFW?: boolean; // New flag for MFW section
  keyFacts?: { label: string; value: string }[];
}

const GENESIS_CONTRACT_ADDRESS = "0x807dF79Ec16CF51C07e7B522175EB408D6dE247E";
const GENESIS_ABI = [
  "function getRemainingSupply() external view returns (uint256)"
];

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "genesis",
    name: "Genesis Collection",
    description: "The first 100 AI-generated fragrances on Arc Mainnet.",
    longDescription:
      "A historic moment — the very first collection minted on Arc Mainnet. Genesis marks the official launch of ScentProtocol as a fully on-chain digital perfume house. Every holder becomes a founding member of the ecosystem with lifetime benefits.",
    totalSupply: 100,
    minted: 0,
    price: "0",
    startDate: "2025-09-16",
    status: "live",
    partner: "ScentProtocol × Arc Network",
    isLaunch: true,
    isMFW: false,
    keyFacts: [
      { label: "Supply", value: "100 NFTs" },
      { label: "Price", value: "Free Mint" },
      { label: "Legendary Rate", value: "15% (vs 5%)" },
      { label: "Per Wallet", value: "Max 1" },
    ],
  },
  {
    id: "milan-fashion-week",
    name: "Milan Fashion Week Exclusive",
    description: "Limited edition digital fragrance drop during MFW 2026.",
    longDescription:
      "An exclusive collaboration bridging high fashion and digital perfumery. Mint a unique NFT fragrance inspired by the runway trends of Milan Fashion Week. Holders receive an exclusive digital badge and priority access to future platform features.",
    totalSupply: 500,
    minted: 0,
    price: "5",
    startDate: "2026-09-22",
    endDate: "2026-09-28",
    status: "live", // Changed to live
    partner: "ScentProtocol × MFW 2026",
    isLaunch: false,
    isMFW: true, // Mark as MFW event
    keyFacts: [
      { label: "Dates", value: "Sep 22-28, 2026" },
      { label: "Supply", value: "500 NFTs" },
      { label: "Price", value: "5 USDC" },
      { label: "Bonus", value: "Exclusive Digital Badge" },
    ],
  },
];

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "ended">("live");

  useEffect(() => {
    async function fetchMintedCount() {
      try {
        const w = window as any;
        const provider = w.ethereum 
          ? new ethers.BrowserProvider(w.ethereum) 
          : new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
          
        const contract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider);
        const remaining = await contract.getRemainingSupply();
        const maxSupply = 100;
        const actualMinted = maxSupply - Number(remaining);

        setEvents(prev => prev.map(event => 
          event.id === "genesis" ? { ...event, minted: actualMinted } : event
        ));
      } catch (error) {
        console.error("Failed to fetch minted count:", error);
      }
    }

    fetchMintedCount();
  }, []);

  const filteredEvents = events.filter((e) => e.status === activeTab && !e.isMFW);
  const mfwEvents = events.filter((e) => e.isMFW && e.status === "live");

  return (
    <div className="max-w-6xl mx-auto py-16 px-4 relative z-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent leading-[1.2] pb-4">
          Events
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Limited-time collections, exclusive drops, and special collaborations.
          Each event is a unique moment in digital perfumery history.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-12">
        {(["live", "upcoming", "ended"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "live" && events.filter((e) => e.status === "live" && !e.isMFW).length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {events.filter((e) => e.status === "live" && !e.isMFW).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Live Events (Genesis) */}
      {activeTab === "live" && filteredEvents.length > 0 && (
        <div className="space-y-8 mb-16">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* MFW 2026 Section - Separate section after Live */}
      {activeTab === "live" && mfwEvents.length > 0 && (
        <div className="mb-16">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent flex-1" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                Milan Fashion Week 2026
              </h2>
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent flex-1" />
            </div>
            <p className="text-center text-white/60 text-sm">
              Exclusive collaboration • Limited edition drop
            </p>
          </div>

          {/* MFW Event Cards */}
          <div className="space-y-8">
            {mfwEvents.map((event) => (
              <MFWEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming/Ended Events */}
      {activeTab !== "live" && (
        filteredEvents.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <p className="text-xl">No events in this category yet.</p>
            <p className="text-sm mt-2">Check back soon for upcoming drops!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// Regular Event Card (for Genesis and other events)
function EventCard({ event }: { event: EventItem }) {
  const progress = (event.minted / event.totalSupply) * 100;
  const isLaunch = event.isLaunch;
  const isUpcoming = event.status === "upcoming";

  if (isLaunch) {
    return (
      <Link href={`/events/${event.id}`}>
        <div className="group relative rounded-3xl overflow-hidden border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-orange-950/40 hover:border-amber-400/80 hover:shadow-[0_0_60px_rgba(245,158,11,0.15)] transition-all duration-300 cursor-pointer">
          
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-amber-400/40 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              />
            ))}
          </div>

          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          <div className="relative p-8 md:p-10">
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Live Now
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 16" className="w-4 h-2.5">
                    <path d="M2 14 Q12 2 22 14" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  Mainnet Launch
                </span>
                {event.partner && (
                  <span className="text-xs text-white/40">{event.partner}</span>
                )}
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 group-hover:from-amber-100 group-hover:via-amber-300 group-hover:to-orange-400 mb-4 transition-colors">
                {event.name}
              </h2>

              <p className="text-white/60 text-base max-w-3xl mb-4">
                {event.description}
              </p>

              {event.longDescription && (
                <p className="text-white/50 text-sm max-w-3xl leading-relaxed border-l-2 border-amber-500/30 pl-4">
                  {event.longDescription}
                </p>
              )}
            </div>

            {event.keyFacts && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {event.keyFacts.map((fact, i) => (
                  <div key={i} className="p-3 rounded-xl bg-black/30 border border-amber-500/20">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      {fact.label}
                    </p>
                    <p className="text-base font-bold text-amber-400">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Minted</span>
                <span className="text-white/60">
                  {event.minted} / {event.totalSupply}
                </span>
              </div>
              <div className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-2">
                {progress.toFixed(1)}% minted
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div>
                <p className="text-xs text-white/40 uppercase mb-1">Price</p>
                <p className="text-2xl font-bold text-white">
                  {event.price === "0" ? (
                    <span className="text-emerald-400">Free Mint</span>
                  ) : (
                    <>
                      {event.price}{" "}
                      <span className="text-lg text-emerald-400">USDC</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Mint Now</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.id}`}>
      <div className="group relative rounded-3xl overflow-hidden border border-purple-500/30 bg-gradient-to-br from-slate-900/90 via-indigo-950/50 to-slate-900/90 hover:border-purple-400/60 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)] transition-all duration-300 cursor-pointer">
        
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

        <div className="relative p-8 md:p-10 flex flex-col md:flex-row gap-10 items-center">
          
          <div className="flex-1 w-full order-2 md:order-1">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-purple-500/20 text-purple-300 border-purple-500/30">
                Coming Soon
              </span>
              {event.partner && (
                <span className="text-xs text-white/40">{event.partner}</span>
              )}
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white group-hover:text-purple-300 mb-4 transition-colors">
              {event.name}
            </h2>

            <p className="text-white/60 text-base max-w-2xl mb-6">
              {event.description}
            </p>

            {event.keyFacts && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {event.keyFacts.map((fact, i) => (
                  <div key={i} className="p-3 rounded-xl bg-black/30 border border-purple-500/20">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      {fact.label}
                    </p>
                    <p className="text-base font-bold text-purple-400">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div>
                <p className="text-xs text-white/40 uppercase mb-1">Price</p>
                <p className="text-2xl font-bold text-white">
                  {event.price}{" "}
                  <span className="text-lg text-emerald-400">USDC</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View Details</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="w-full md:w-72 flex-shrink-0 order-1 md:order-2">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-b from-purple-900/20 to-black/80 group-hover:border-purple-400/60 transition-all duration-500 shadow-2xl shadow-purple-900/20">
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                
                <div className="w-16 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-t-lg shadow-[0_0_20px_rgba(245,158,11,0.6)] mb-1 relative z-10"></div>
                
                <div className="w-8 h-6 bg-purple-400/20 border-x border-t border-purple-300/40 backdrop-blur-sm -mt-1 relative z-10"></div>
                
                <div className="w-32 h-40 bg-gradient-to-t from-purple-600/30 via-purple-500/10 to-transparent rounded-t-[3rem] border border-purple-400/30 backdrop-blur-md -mt-1 relative z-10 flex items-center justify-center">
                   <div className="w-20 h-20 bg-purple-500/20 rounded-full blur-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                </div>

                <div className="absolute top-1/3 -right-4 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-70"></div>
                <div className="absolute bottom-1/4 -left-6 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse delay-700 opacity-70"></div>
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300"></div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                 <p className="text-xs text-purple-300 font-mono text-center tracking-widest uppercase mb-1">Coming Soon</p>
                 <p className="text-[10px] text-white/40 text-center">MFW 2026 Edition</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}

// Special MFW Event Card with premium design
function MFWEventCard({ event }: { event: EventItem }) {
  return (
    <Link href={`/events/${event.id}`}>
      <div className="group relative rounded-3xl overflow-hidden border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-pink-950/40 hover:border-purple-400/70 hover:shadow-[0_0_60px_rgba(168,85,247,0.2)] transition-all duration-300 cursor-pointer">
        
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/40 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

        <div className="relative p-8 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/40 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Exclusive Drop
              </span>
              {event.partner && (
                <span className="text-xs text-white/40">{event.partner}</span>
              )}
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-amber-400 group-hover:from-purple-200 group-hover:via-pink-300 group-hover:to-amber-300 mb-4 transition-colors">
              {event.name}
            </h2>

            <p className="text-white/60 text-base max-w-3xl mb-4">
              {event.description}
            </p>

            {event.longDescription && (
              <p className="text-white/50 text-sm max-w-3xl leading-relaxed border-l-2 border-purple-500/30 pl-4">
                {event.longDescription}
              </p>
            )}
          </div>

          {/* Key Facts Grid */}
          {event.keyFacts && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {event.keyFacts.map((fact, i) => (
                <div key={i} className="p-3 rounded-xl bg-black/30 border border-purple-500/20">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                    {fact.label}
                  </p>
                  <p className="text-base font-bold text-purple-400">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Footer Price & CTA */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <div>
              <p className="text-xs text-white/40 uppercase mb-1">Price</p>
              <p className="text-2xl font-bold text-white">
                {event.price}{" "}
                <span className="text-lg text-emerald-400">USDC</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <span>View Details</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
