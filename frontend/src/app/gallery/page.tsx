"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// EXACT ABI matching the Solidity struct order:
// name, gender, pType, topNotes[3], heartNotes[3], baseNotes[3], concentration, rarity, createdAt, creator
const GALLERY_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
];

const INTERFACE = new ethers.Interface(GALLERY_ABI);

interface GalleryItem {
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
}

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_ICONS = ["⚲", "♂", "♀"];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

const RARITY_STYLES: Record<number, { badge: string; text: string }> = {
  0: { badge: "bg-slate-500/20 text-slate-300 border-slate-500/30", text: "text-slate-300" },
  1: { badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", text: "text-blue-300" },
  2: { badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", text: "text-purple-300" },
  3: { badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", text: "text-amber-300" },
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Initializing...");
  const [mode, setMode] = useState<"abi" | "heuristic">("abi");

  // Heuristic fallback for when ABI decoding fails completely
  const extractNameHeuristic = (rawData: string): string | null => {
    try {
      const hex = rawData.startsWith('0x') ? rawData.slice(2) : rawData;
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);

      let currentString = "";
      const candidates: string[] = [];
      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        if (byte >= 32 && byte <= 126) currentString += String.fromCharCode(byte);
        else {
          if (currentString.length > 3) candidates.push(currentString);
          currentString = "";
        }
      }
      if (currentString.length > 3) candidates.push(currentString);

      // Filter out addresses (40 hex chars) and pure numbers
      for (const c of candidates) {
        if (c.length === 40 && /^[0-9a-fA-F]+$/.test(c)) continue;
        if (/^\d+$/.test(c)) continue;
        return c; // First valid looking string is likely the name
      }
      return candidates[0] || null;
    } catch { return null; }
  };

  useEffect(() => {
    async function fetchGallery() {
      sessionStorage.removeItem("scent_gallery_cache_v1");
      
      try {
        setStatus("Connecting to Arc Network...");
        const signer = await getArcSigner();
        const provider = signer.provider;
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, GALLERY_ABI, provider);

        const results: GalleryItem[] = [];
        let consecutiveEmpty = 0;
        const MAX_CONSECUTIVE_EMPTY = 10; 
        let currentId = 1;
        const BATCH_SIZE = 5;
        let abiFailedCount = 0;

        setStatus(`Scanning IDs (ABI Mode)...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            
            // Try ABI call first
            const promise = contract.getPerfume(idToCheck)
              .then((p: any) => {
                // If we got here, ABI worked!
                if (p && p.name && typeof p.name === 'string' && p.name.trim().length > 0) {
                  return { 
                    tokenId: idToCheck, 
                    name: p.name, 
                    rarity: Number(p.rarity), 
                    gender: Number(p.gender), 
                    pType: Number(p.pType) 
                  };
                }
                return null;
              })
              .catch((err) => {
                // If ABI fails, switch to heuristic for this ID
                if (err.message?.includes("decode") || err.message?.includes("UNEXPECTED_CONTINUE")) {
                   // Fallback to raw call
                   return provider.call({ to: NFT_CONTRACT_ADDRESS, data: INTERFACE.encodeFunctionData("getPerfume", [idToCheck]) })
                     .then((raw: string) => {
                       const name = extractNameHeuristic(raw);
                       if (name) return { tokenId: idToCheck, name, rarity: 0, gender: 0, pType: 0 };
                       return null;
                     })
                     .catch(() => null);
                }
                // If it's just "Not minted", return null
                return null;
              });

            batchPromises.push(promise);
          }

          const batchResults = await Promise.all(batchPromises);
          
          let foundInBatch = false;
          for (const result of batchResults) {
            if (result) {
              results.push(result);
              foundInBatch = true;
              consecutiveEmpty = 0;
            } else {
              consecutiveEmpty++;
            }
          }

          if (results.length > 0 || currentId % 20 === 0) {
             setStatus(`Scanned up to ID ${currentId}. Found: ${results.length}`);
          }

          currentId += BATCH_SIZE;
        }

        const sorted = results.sort((a, b) => b.tokenId - a.tokenId);
        setItems(sorted);
        setStatus(`Done. Total found: ${sorted.length}`);
        
      } catch (e: any) {
        console.error("CRITICAL ERROR:", e);
        setStatus(`FATAL: ${e.shortMessage || e.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-16 px-4 relative z-10">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent">Gallery</h1>
      <p className="text-white/50 mb-8">All fragrances minted on ScentProtocol.</p>
      
      {/* Status Bar */}
      <div className="mb-8 p-3 rounded-lg bg-black/40 border border-white/10 font-mono text-xs flex justify-between items-center">
        <span className="text-amber-400">Status: {status}</span>
        <span className="text-white/40">Contract: {NFT_CONTRACT_ADDRESS.slice(0,10)}...</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass-card-luxury h-48 animate-pulse rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card-luxury rounded-2xl p-8">
          <p>No fragrances found in scanned range.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const style = RARITY_STYLES[item.rarity] || RARITY_STYLES[0];
            return (
              <Link key={item.tokenId} href={`/nft/${item.tokenId}`} className="block group">
                <div className="glass-card-luxury p-5 hover:scale-[1.02] transition-all duration-300 border border-white/10 bg-slate-900/40 backdrop-blur-md h-full flex flex-col">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-white/40">#{item.tokenId}</span>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>
                      {RARITY_LABELS[item.rarity]}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white truncate mb-4 group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </h3>
                  
                  <div className="mt-auto flex items-center gap-3 text-xs text-white/50 pt-3 border-t border-white/5">
                    <span title="Gender">{GENDER_ICONS[item.gender] || "⚲"}</span>
                    <span title="Type">{TYPE_LABELS[item.pType] || "Unknown"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
