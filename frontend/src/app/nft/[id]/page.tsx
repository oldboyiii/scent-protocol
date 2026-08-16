"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "@/utils/contract";
import Link from "next/link";

const MINI_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[] topNotes, string[] heartNotes, string[] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)",
];

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerfume() {
      try {
        const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
        const contract = new ethers.Contract(CONTRACT_ADDRESS, MINI_ABI, provider);
        const data = await contract.getPerfume(tokenId);
        setPerfume({
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
        });
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

      <div className={`glass-card p-8 bg-gradient-to-br ${rarityColor[perfume.rarity]} to-transparent`}>
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

        <div className="space-y-4 mb-6">
          <NoteRow label="Top Notes" notes={perfume.topNotes} color="text-yellow-300" />
          <NoteRow label="Heart Notes" notes={perfume.heartNotes} color="text-pink-300" />
          <NoteRow label="Base Notes" notes={perfume.baseNotes} color="text-amber-600" />
        </div>

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
