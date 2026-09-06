"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface EventItem {
  id: string;
  name: string;
  description: string;
  totalSupply: number;
  minted: number;
  price: string;
  startDate: string;
  endDate?: string;
  status: "live" | "upcoming" | "ended";
  partner?: string;
}

const EVENTS: EventItem[] = [
  {
    id: "genesis",
    name: "Genesis Collection",
    description: "The first 1000 AI-generated fragrances on Arc Mainnet. Free mint to celebrate the launch. Enhanced Legendary drop rate (15%).",
    totalSupply: 1000,
    minted: 0, // заменим на данные из контракта
    price: "0",
    startDate: "2025-09-16",
    status: "live",
    partner: "ScentProtocol × Arc Network",
  },
  // Будущие события:
  // {
  //   id: "paris-fashion-week",
  //   name: "Paris Fashion Week",
  //   description: "Exclusive collection inspired by French perfumery",
  //   totalSupply: 200,
  //   minted: 0,
  //   price: "15",
  //   startDate: "2025-09-25",
  //   status: "upcoming",
  //   partner: "ScentProtocol × Paris Designer",
  // },
];

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "ended">("live");

  const filteredEvents = EVENTS.filter((e) => e.status === activeTab);

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
            {tab === "live" && EVENTS.filter((e) => e.status === "live").length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {EVENTS.filter((e) => e.status === "live").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
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
      )}
    </div>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const progress = (event.minted / event.totalSupply) * 100;

  return (
    <Link href={`/events/${event.id}`}>
      <div className="group relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-purple-900/50 to-slate-900/90 backdrop-blur-xl hover:border-amber-500/60 transition-all duration-300 cursor-pointer">
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        <div className="relative p-8 md:p-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  event.status === "live" 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                    : event.status === "upcoming"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : "bg-white/10 text-white/40 border-white/20"
                }`}>
                  {event.status === "live" ? "Live Now" : event.status === "upcoming" ? "Coming Soon" : "Ended"}
                </span>
                {event.partner && (
                  <span className="text-xs text-white/40">{event.partner}</span>
                )}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">
                {event.name}
              </h2>
              <p className="text-white/60 max-w-3xl">
                {event.description}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Minted</span>
              <span className="text-white/60">
                {event.minted} / {event.totalSupply}
              </span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-white/40 mt-2">
              {progress.toFixed(1)}% minted
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-white/40 uppercase mb-1">Price</p>
              <p className="text-2xl font-bold text-white">
                {event.price === "0" ? (
                  <span className="text-emerald-400">Free Mint</span>
                ) : (
                  <>{event.price} <span className="text-lg text-emerald-400">USDC</span></>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 text-amber-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <span>{event.status === "live" ? "Mint Now" : event.status === "upcoming" ? "View Details" : "View Collection"}</span>
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
