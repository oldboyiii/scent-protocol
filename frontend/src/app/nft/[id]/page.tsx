"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { getContract } from "@/utils/contract";
import Link from "next/link";

interface PerfumeData {
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
}

export default function NFTPage() {
  const params = useParams();
  const tokenId = Number(params.id);
  const [perfume, setPerfume] = useState<PerfumeData | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerfume() {
      try {
        let contract;
        const w = window as any;
        if (w.ethereum) {
          const browserProvider = new ethers.BrowserProvider(w.ethereum);
          contract = getContract(browserProvider);
        } else {
          const fallbackProvider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
          contract = getContract(fallbackProvider);
        }

        const data = await contract.getPerfume(tokenId);
        const perfumeData: PerfumeData = {
          name: data.name,
          gender: Number(data.gender),
          pType: Number(data.pType),
          topNotes: [...data.topNotes],
          heartNotes: [...data.heartNotes],
          baseNotes: [...data.baseNotes],
          concentration: Number(data.concentration),
          rarity: Number(data.rarity),
          createdAt: Number(data.createdAt),
          creator: data.creator,
        };
        setPerfume(perfumeData);
        setDescription(generateDescription(perfumeData));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (!isNaN(tokenId)) fetchPerfume();
  }, [tokenId]);

  const rarityLabel = ["Common", "Rare", "Epic", "Legendary"];
  const rarityColor = ["from-gray-600", "from-blue-600", "from-purple-600", "from-amber-600"];
  const rarityBorder = ["border-gray-500", "border-blue-500", "border-purple-500", "border-amber-500"];
  const genderText = ["Unisex", "Male", "Female"];
  const typeText = ["Parfum", "EDP", "EDT", "EDC"];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="glass-card p-8 h-96 skeleton-pulse rounded-xl" />
      </div>
    );
  }

  if (!perfume) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Scent not found</h1>
        <Link href="/gallery" className="text-amber-400 hover:underline">
          ← Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <Link href="/gallery" className="text-sm text-white/50 hover:text-white mb-6 inline-block">
        ← Back to Gallery
      </Link>

      <div className={`glass-card p-8 bg-gradient-to-br ${rarityColor[perfume.rarity]} to-transparent border ${rarityBorder[perfume.rarity]} border-opacity-30`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-white/50">Scent #{tokenId}</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-amber-300 uppercase">
            {rarityLabel[perfume.rarity]}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">{perfume.name}</h1>
        <p className="text-white/50 text-sm mb-6">
          {genderText[perfume.gender]} · {typeText[perfume.pType]} · {perfume.concentration}% concentration
        </p>

        {/* Notes Pyramid */}
        <div className="space-y-4 mb-6">
          <NoteRow label="Top Notes" notes={perfume.topNotes} color="text-yellow-300" />
          <NoteRow label="Heart Notes" notes={perfume.heartNotes} color="text-pink-300" />
          <NoteRow label="Base Notes" notes={perfume.baseNotes} color="text-amber-600" />
        </div>

        {/* AI Description */}
        {description && (
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Description</p>
            <p className="text-white/80 text-sm italic leading-relaxed">&ldquo;{description}&rdquo;</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-white/10 pt-4 text-xs text-white/40">
          <p>Created by {perfume.creator.slice(0, 6)}...{perfume.creator.slice(-4)}</p>
          <p>{new Date(perfume.createdAt * 1000).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function NoteRow({ label, notes, color }: { label: string; notes: string[]; color: string }) {
  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex flex-wrap gap-2">
        {notes.map((n, i) => (
          <span key={i} className={`px-3 py-1 rounded-full bg-white/10 text-sm ${color}`}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

function generateDescription(perfume: PerfumeData): string {
  const genderText = ["unisex", "masculine", "feminine"][perfume.gender] || "unisex";
  const typeText = ["Parfum", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne"][perfume.pType] || "fragrance";

  const top = perfume.topNotes.join(", ");
  const heart = perfume.heartNotes.join(", ");
  const base = perfume.baseNotes.join(", ");

  const openings = [
    `A ${genderText} ${typeText.toLowerCase()} that opens with a burst of ${top}.`,
    `This ${genderText} creation greets you with ${top}.`,
    `The journey begins with ${top}, unfolding into something extraordinary.`,
  ];

  const hearts = [
    `The heart reveals ${heart}, creating a warm and inviting aura.`,
    `At its core, ${heart} weave an unforgettable melody.`,
    `The soul of this scent lies in ${heart}.`,
  ];

  const bases = [
    `It settles into ${base}, leaving a lasting impression.`,
    `The dry-down of ${base} ensures hours of elegance.`,
    `Finally, ${base} anchor the composition with depth and sophistication.`,
  ];

  const rarityPhrases = [
    "A timeless everyday companion.",
    "A collector's piece for the discerning nose.",
    "A masterpiece of perfumery, rarely encountered.",
    "A once-in-a-lifetime fragrance, forged in digital gold.",
  ];

  const seed = perfume.name.length + perfume.concentration;
  const open = openings[seed % openings.length];
  const heartLine = hearts[(seed + 1) % hearts.length];
  const baseLine = bases[(seed + 2) % bases.length];
  const rarityLine = rarityPhrases[perfume.rarity];

  return `${open} ${heartLine} ${baseLine} ${rarityLine} Concentration: ${perfume.concentration}%.`;
}
