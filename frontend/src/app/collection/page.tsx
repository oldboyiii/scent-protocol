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

            return (
              <div
                key={s.tokenId}
                className="glass-card rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">
                      Scent #{s.tokenId}
                    </p>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {perfume?.name || s.name || `Scent #${s.tokenId}`}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      (perfume?.rarity ?? s.rarity ?? 0) === 3
                        ? "bg-amber-500/20 text-amber-300"
                        : (perfume?.rarity ?? s.rarity ?? 0) === 2
                        ? "bg-purple-500/20 text-purple-300"
                        : (perfume?.rarity ?? s.rarity ?? 0) === 1
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {RARITY[perfume?.rarity ?? s.rarity ?? 0]}
                  </span>
                </div>

                {hasFullData ? (
                  <>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        {GENDER[perfume!.gender]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        {TYPE[perfume!.pType]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        {perfume!.concentration}%
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">
                          Top Notes
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {perfume!.topNotes.map((n) => (
                            <span
                              key={n}
                              className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-200 text-xs"
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
                              className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-200 text-xs"
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
                              className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-200 text-xs"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {s.description && (
                      <div className="bg-white/5 rounded-lg p-3 text-sm text-white/70 italic border-l-2 border-white/10">
                        {s.description}
                      </div>
                    )}

                    <div className="text-xs text-white/30 space-y-0.5">
                      <p>Creator: {perfume!.creator}</p>
                      <p>
                        Minted:{" "}
                        {new Date(perfume!.createdAt * 1000).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
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
                  <div className="text-sm text-white/40">
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
