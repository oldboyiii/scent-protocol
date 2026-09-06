"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";

interface EventData {
  id: string;
  name: string;
  description: string;
  contractAddress: string;
  maxSupply: number;
  minted: number;
  price: string;
  startTime: number;
  endTime: number;
  status: "upcoming" | "active" | "ended";
  image?: string;
  partner?: string;
}

// Mock data — потом заменим на реальные данные из контрактов
const EVENTS: EventData[] = [
  {
    id: "genesis",
    name: "Genesis Collection",
    description: "The first 1000 AI-generated fragrances on Arc Mainnet. Limited edition with enhanced Legendary drop rate (15%). Holders receive lifetime priority access to future drops.",
    contractAddress: "0x...", // заменим после деплоя
    maxSupply: 1000,
    minted: 0,
    price: "1",
    startTime: Math.floor(new Date("2025-09-16T00:00:00Z").getTime() / 1000),
    endTime: Math.floor(new Date("2025-09-18T00:00:00Z").getTime() / 1000),
    status: "upcoming",
    partner: "ScentProtocol × Arc Network",
  },
];

export default function EventsPage() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "past">("active");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const event = EVENTS[0];
      
      if (event.status === "active" && now < event.endTime) {
        const diff = event.endTime - now;
        setTimeLeft({
          days: Math.floor(diff / 86400),
          hours: Math.floor((diff % 86400) / 3600),
          minutes: Math.floor((diff % 3600) / 60),
          seconds: diff % 60,
        });
      } else if (event.status === "upcoming" && now < event.startTime) {
        const diff = event.startTime - now;
        setTimeLeft({
          days: Math.floor(diff / 86400),
          hours: Math.floor((diff % 86400) / 3600),
          minutes: Math.floor((diff % 3600) / 60),
          seconds: diff % 60,
        });
      } else {
        setTimeLeft(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredEvents = EVENTS.filter((e) => {
    if (activeTab === "active") return e.status === "active";
    if (activeTab === "upcoming") return e.status === "upcoming";
    return e.status === "ended";
  });

  return (
    <div className="max-w-6xl mx-auto py-16 px-4 relative z-10">
      {/* Hero Section */}
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
        {(["active", "upcoming", "past"] as const).map((tab) => (
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
            {tab === "active" && EVENTS.filter((e) => e.status === "active").length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {EVENTS.filter((e) => e.status === "active").length}
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
            <EventCard key={event.id} event={event} timeLeft={timeLeft} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, timeLeft }: { event: EventData; timeLeft: any }) {
  const progress = (event.minted / event.maxSupply) * 100;

  return (
    <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-purple-900/50 to-slate-900/90 backdrop-blur-xl">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      <div className="relative p-8 md:p-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
                {event.status === "active" ? "Live Now" : event.status === "upcoming" ? "Coming Soon" : "Ended"}
              </span>
              {event.partner && (
                <span className="text-xs text-white/40">{event.partner}</span>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {event.name}
            </h2>
            <p className="text-white/60 max-w-2xl">
              {event.description}
            </p>
          </div>
        </div>

        {/* Countdown */}
        {timeLeft && event.status !== "ended" && (
          <div className="mb-8">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
              {event.status === "active" ? "Ends in" : "Starts in"}
            </p>
            <div className="flex gap-4">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Minutes", value: timeLeft.minutes },
                { label: "Seconds", value: timeLeft.seconds },
              ].map((item) => (
                <div key={item.label} className="flex-1 bg-black/30 rounded-xl p-4 border border-white/10">
                  <div className="text-3xl md:text-4xl font-bold text-amber-400 text-center">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-white/40 text-center mt-1 uppercase">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">Minted</span>
            <span className="text-white/60">
              {event.minted} / {event.maxSupply}
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

        {/* Action Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-black/20 rounded-2xl border border-white/10">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Price</p>
            <p className="text-3xl font-bold text-white">
              {event.price} <span className="text-lg text-emerald-400">USDC</span>
            </p>
            <p className="text-xs text-white/40 mt-1">Max 3 per wallet</p>
          </div>

          {event.status === "active" && (
            <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all">
              Mint Now
            </button>
          )}

          {event.status === "upcoming" && (
            <button className="px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all">
              Notify Me
            </button>
          )}

          {event.status === "ended" && (
            <Link
              href={`/events/${event.id}`}
              className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-lg hover:bg-white/10 transition-all"
            >
              View Collection
            </Link>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
            <p className="text-amber-400 text-sm font-bold mb-1">Enhanced Rarity</p>
            <p className="text-xs text-white/60">15% Legendary drop rate (vs 5% standard)</p>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
            <p className="text-amber-400 text-sm font-bold mb-1">Genesis Badge</p>
            <p className="text-xs text-white/60">Exclusive badge on all NFTs from this collection</p>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
            <p className="text-amber-400 text-sm font-bold mb-1">Priority Access</p>
            <p className="text-xs text-white/60">Holders get early access to future drops</p>
          </div>
        </div>
      </div>
    </div>
  );
}
