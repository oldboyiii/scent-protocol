"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import { getContract } from "@/utils/contract";
import ShareCard from "@/components/ShareCard";

const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];
const RARITY = ["Common", "Rare", "Epic", "Legendary"];

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; text: string }> = {
  0: {
    bg: "from-slate-700/60 to-slate-800/60",
    border: "border-slate-500/40",
    badge: "bg-slate-500/30 text-slate-200 border-slate-400/30",
    text: "text-slate-300",
  },
  1: {
    bg: "from-blue-600/50 to-indigo-700/50",
    border: "border-blue-400/50",
    badge: "bg-blue-500/30 text-blue-200 border-blue-400/30",
    text: "text-blue-300",
  },
  2: {
    bg: "from-purple-600/50 to-fuchsia-700/50",
    border: "border-purple-400/50",
    badge: "bg-purple-500/30 text-purple-200 border-purple-400/30",
    text: "text-purple-300",
  },
  3: {
    bg: "from-amber-500/50 to-orange-600/50",
    border: "border-amber-400/60",
    badge: "bg-amber-500/30 text-amber-200 border-amber-400/40",
    text: "text-amber-300",
  },
};

function generateDescription(perfume: {
  name: string;
  gender: number;
  pType: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  concentration: number;
  rarity: number;
}): string {
  const genderLabel = GENDER[perfume.gender];
  const typeLabel = TYPE[perfume.pType];
  const rarityLabel = RARITY[perfume.rarity];

  const top = perfume.topNotes.join(", ");
  const heart = perfume.heartNotes.join(", ");
  const base = perfume.baseNotes.join(", ");

  const openings = [
    `A ${rarityLabel.toLowerCase()} ${genderLabel.toLowerCase()} ${typeLabel.toLowerCase()} that opens with the vibrant sparkle of ${top}.`,
    `This ${rarityLabel.toLowerCase()} composition for ${genderLabel.toLowerCase()}s begins with an invigorating burst of ${top}.`,
    `An exquisite ${typeLabel.toLowerCase()} where ${top} create an unforgettable first impression.`,
  ];

  const hearts = [
    `At its heart, ${heart} weave a sophisticated tapestry of emotion and depth.`,
    `The soul of this fragrance reveals itself through ${heart}, offering warmth and intrigue.`,
    `As it evolves, ${heart} emerge, lending an air of timeless elegance.`,
  ];

  const bases = [
    `Finally, the base settles into a rich embrace of ${base}, leaving a lasting signature.`,
    `The dry-down is anchored by ${base}, creating a memorable trail that lingers for hours.`,
    `A foundation of ${base} ensures this scent endures, evolving beautifully on the skin.`,
  ];

  const seed =
    perfume.name.length +
    perfume.topNotes.length +
    perfume.heartNotes.length;

  return `${openings[seed % openings.length]} ${hearts[seed % hearts.length]} ${bases[seed % bases.length]} Crafted at ${perfume.concentration}% concentration, ${perfume.name} is a true masterpiece of digital perfumery.`;
}

export default function NFTDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [perfume, setPerfume] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || isNaN(id)) return;

    async function fetch() {
      try {
        let provider;
        if (typeof window !== "undefined" && (window as any).ethereum) {
          provider = new ethers.BrowserProvider((window as any).ethereum);
        } else {
          provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
        }
        const contract = getContract(provider);
        const data = await contract.getPerfume(id);
        setPerfume(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 space-y-6 animate-pulse">
        <div className="h-10 bg-white/10 rounded-lg w-1/2" />
        <div className="h-64 bg-white/5 rounded-2xl" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
      </div>
    );
  }

  if (!perfume || !perfume.name) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Scent not found</h1>
        <p className="text-white/50 mb-8">
          Token #{id} does not exist or has not been minted yet.
        </p>
        <Link
          href="/gallery"
          className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          ← Back to Gallery
        </Link>
      </div>
    );
  }

  const description = generateDescription(perfume);
  const style = RARITY_STYLE[perfume.rarity] || RARITY_STYLE[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <Link
        href="/gallery"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        ← Back to Gallery
      </Link>

      <div
        className={`glass-card rounded-2xl p-8 bg-gradient-to-br ${style.bg} border ${style.border}`}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">
              Scent #{id}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-2 leading-normal pb-1">
              {perfume.name}
            </h1>
          </div>
          <span
            className={`text-sm font-bold px-3 py-1.5 rounded-full border ${style.badge}`}
          >
            {RARITY[perfume.rarity]}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 text-sm mb-6">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white/80">
            {GENDER[perfume.gender]}
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 text-white/80">
            {TYPE[perfume.pType]}
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 text-white/80">
            {perfume.concentration}%
          </span>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <span className="text-xs text-white/40 uppercase tracking-wider">
              Top Notes
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {perfume.topNotes.map((n: string) => (
                <span
                  key={n}
                  className="px-3 py-1 rounded-md bg-amber-500/10 text-amber-200 text-sm"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-white/40 uppercase tracking-wider">
              Heart Notes
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {perfume.heartNotes.map((n: string) => (
                <span
                  key={n}
                  className="px-3 py-1 rounded-md bg-rose-500/10 text-rose-200 text-sm"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-white/40 uppercase tracking-wider">
              Base Notes
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {perfume.baseNotes.map((n: string) => (
                <span
                  key={n}
                  className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-200 text-sm"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-black/20 rounded-lg p-4 text-white/70 italic border-l-2 border-white/10 mb-6">
          {description}
        </div>

        <div className="text-sm text-white/40 space-y-1">
          <p>Creator: {perfume.creator}</p>
          <p>
            Minted:{" "}
            {new Date(Number(perfume.createdAt) * 1000).toLocaleString()}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <Link
            href={`/nft/${id - 1}`}
            className={`text-sm text-white/50 hover:text-white transition-colors ${
              id <= 1 ? "invisible" : ""
            }`}
          >
            ← Previous
          </Link>
          <ShareCard tokenId={id} perfume={perfume} />
          <Link
            href={`/nft/${id + 1}`}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Next →
          </Link>
        </div>
      </div>
    </div>
  );
}
