"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ShareCard from "@/components/ShareCard";

interface StoredScent {
  tokenId: number;
  name?: string;
  rarity?: number;
  timestamp: number;
  perfume?: {
    name: string;
    gender: number;
    pType: number;
    topNotes: string[];
    heartNotes: string[];
    baseNotes: string[];
    concentration: number;
    rarity: number;
    createdAt: number;
    creator: string;
  };
  description?: string;
}

const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];
const RARITY = ["Common", "Rare", "Epic", "Legendary"];

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; text: string; accent: string }> = {
  0: {
    bg: "bg-gradient-to-br from-slate-700/70 via-slate-600/50 to-slate-800/70",
    border: "border-slate-400/30",
    badge: "bg-slate-500/30 text-slate-200 border-slate-400/40",
    text: "text-slate-200",
    accent: "#94a3b8",
  },
  1: {
    bg: "bg-gradient-to-br from-blue-700/70 via-indigo-600/50 to-blue-900/70",
    border: "border-blue-400/40",
    badge: "bg-blue-500/30 text-blue-200 border-blue-400/40",
    text: "text-blue-200",
    accent: "#60a5fa",
  },
  2: {
    bg: "bg-gradient-to-br from-purple-700/70 via-fuchsia-600/50 to-purple-900/70",
    border: "border-purple-400/40",
    badge: "bg-purple-500/30 text-purple-200 border-purple-400/40",
    text: "text-purple-200",
    accent: "#c084fc",
  },
  3: {
    bg: "bg-gradient-to-br from-amber-600/80 via-orange-500/60 to-amber-800/80",
    border: "border-amber-400/50",
    badge: "bg-amber-500/30 text-amber-100 border-amber-400/50",
    text: "text-amber-100",
    accent: "#fbbf24",
  },
};

export default function CollectionPage() {
  const [scents, setScents] = useState<StoredScent[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("scent_collection");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setScents(Array.isArray(parsed) ? parsed : []);
      } catch {
        setScents([]);
      }
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-4xl md:text-5xl font-bold text-white text-center leading-normal pb-1">
        My Collection
      </h1>
      <p className="text-center text-white/50">
        {scents.length} scent{scents.length !== 1 ? "s" : ""} collected
      </p>

      {scents.length === 0 ? (
        <div className="text-center text-white/40 py-20">
          <p className="text-lg mb-4">No scents in your collection yet.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Mint Your First Scent →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {scents.map((s) => {
            const hasFullData = !!s.perfume && s.perfume.topNotes;
            const perfume = hasFullData ? s.perfume! : null;
            const rarity = perfume?.rarity ?? s.rarity ?? 0;
            const style = RARITY_STYLE[rarity] || RARITY_STYLE[0];

            return (
              <div
                key={s.tokenId}
                className={`relative rounded-2xl p-6 space-y-4 backdrop-blur-xl ${style.bg} border ${style.border} overflow-hidden`}
              >
                {/* Glass shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

                {/* Inner glow line top */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">
                      Scent #{s.tokenId}
                    </p>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {perfume?.name || s.name || `Scent #${s.tokenId}`}
                    </h3>
                  </div>
                  <span
                    className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}
                  >
                    {RARITY[rarity]}
                  </span>
                </div>

                {hasFullData ? (
                  <>
                    <div className="relative flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-black/20 text-white/70 border border-white/10">
                        {GENDER[perfume!.gender]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/20 text-white/70 border border-white/10">
                        {TYPE[perfume!.pType]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/20 text-white/70 border border-white/10">
                        {perfume!.concentration}%
                      </span>
                    </div>

                    <div className="relative space-y-2 text-sm">
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">
                          Top Notes
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {perfume!.topNotes.map((n) => (
                            <span
                              key={n}
                              className="px-2 py-0.5 rounded-md bg-black/20 text-amber-200 text-xs border border-amber-500/20"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">
                          Heart Notes
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {perfume!.heartNotes.map((n) => (
                            <span
                              key={n}
                              className="px-2 py-0.5 rounded-md bg-black/20 text-rose-200 text-xs border border-rose-500/20"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">
                          Base Notes
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {perfume!.baseNotes.map((n) => (
                            <span
                              key={n}
                              className="px-2 py-0.5 rounded-md bg-black/20 text-emerald-200 text-xs border border-emerald-500/20"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {s.description && (
                      <div className="relative bg-black/20 rounded-lg p-3 text-sm text-white/70 italic border-l-2 border-white/10">
                        {s.description}
                      </div>
                    )}

                    <div className="relative text-xs text-white/30 space-y-0.5">
                      <p>Creator: {perfume!.creator}</p>
                      <p>
                        Minted:{" "}
                        {new Date(perfume!.createdAt * 1000).toLocaleString()}
                      </p>
                    </div>

                    <div className="relative flex items-center justify-between pt-2">
                      <Link
                        href={`/nft/${s.tokenId}`}
                        className="text-sm text-white/50 hover:text-white transition-colors"
                      >
                        View Details →
                      </Link>
                      <ShareCard tokenId={s.tokenId} perfume={perfume!} />
                    </div>
                  </>
                ) : (
                  <div className="relative text-sm text-white/40">
                    <p>Legacy entry — full details not available.</p>
                    <p className="text-xs mt-1">
                      Minted:{" "}
                      {new Date(s.timestamp).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between pt-4">
                      <Link
                        href={`/nft/${s.tokenId}`}
                        className="text-sm text-white/50 hover:text-white transition-colors"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
