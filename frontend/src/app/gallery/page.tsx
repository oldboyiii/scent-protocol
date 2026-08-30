"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// Interface just to generate calldata
const INTERFACE = new ethers.Interface([
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
]);

interface GalleryItem {
  tokenId: number;
  name: string;
  rarity: number;
}

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const RARITY_STYLES: Record<number, { badge: string }> = {
  0: { badge: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  1: { badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  2: { badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  3: { badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Starting heuristic scan...");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Heuristic extractor: finds readable strings in raw hex data
  const extractNameHeuristic = (rawData: string): string | null => {
    try {
      const hex = rawData.startsWith('0x') ? rawData.slice(2) : rawData;
      
      // Convert hex to bytes
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }

      // Look for sequences of printable ASCII characters (32-126)
      let currentString = "";
      const candidates: string[] = [];

      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        if (byte >= 32 && byte <= 126) {
          currentString += String.fromCharCode(byte);
        } else {
          if (currentString.length > 3) { // Ignore short fragments
            candidates.push(currentString);
          }
          currentString = "";
        }
      }
      if (currentString.length > 3) candidates.push(currentString);

      // The name is usually the first meaningful string that isn't an address or technical data
      // Addresses are 40 chars hex, technical data is often numbers.
      // Names like "Silver Rain" are distinct.
      // Let's filter out known technical patterns if possible, or just take the first "word-like" string.
      
      // In your specific contract, 'name' is the first dynamic field.
      // However, due to struct encoding, it might be buried.
      // But looking at your logs, "Silver Rain" appeared clearly.
      
      // Let's return the first candidate that contains a space or looks like a title
      // OR simply the first candidate if it's not a hex address.
      
      for (const c of candidates) {
        // Skip if it looks like a hex address (40 chars, 0-9a-f)
        if (c.length === 40 && /^[0-9a-fA-F]+$/.test(c)) continue;
        // Skip if it's just numbers
        if (/^\d+$/.test(c)) continue;
        
        return c;
      }
      
      return candidates[0] || null;
    } catch (e) {
      console.warn("Heuristic extraction failed", e);
      return null;
    }
  };

  useEffect(() => {
    async function fetchGallery() {
      sessionStorage.removeItem("scent_gallery_cache_v1");
      
      try {
        setStatus("Connecting via ArcSigner...");
        const signer = await getArcSigner();
        const provider = signer.provider;

        const results: GalleryItem[] = [];
        let consecutiveEmpty = 0;
        const MAX_CONSECUTIVE_EMPTY = 10; 
        let currentId = 1;
        const BATCH_SIZE = 5;

        setStatus(`Scanning IDs (Heuristic mode)...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            const calldata = INTERFACE.encodeFunctionData("getPerfume", [idToCheck]);

            batchPromises.push(
              provider.call({ to: NFT_CONTRACT_ADDRESS, data: calldata })
                .then((rawResult: string) => {
                  if (idToCheck === 1 && !debugInfo) {
                    setDebugInfo("Raw data received. Analyzing...");
                  }

                  if (rawResult === "0x" || parseInt(rawResult, 16) === 0) return null;

                  const name = extractNameHeuristic(rawResult);
                  
                  if (name && name.length > 2) {
                    return { 
                      tokenId: idToCheck, 
                      name: name, 
                      rarity: 0 // Defaulting to Common as we can't easily decode it without full struct
                    };
                  }
                  return null;
                })
                .catch((err) => {
                  if (err.message?.includes("Not minted") || err.message?.includes("revert")) return null;
                  return null;
                })
            );
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
      
      {/* Diagnostic Panel */}
      <div className="mb-8 p-4 rounded-lg bg-black/60 border border-amber-500/30 font-mono text-xs overflow-x-auto">
        <p className="text-amber-400 font-bold mb-2">DIAGNOSTIC MODE: HEURISTIC STRING SEARCH</p>
        <p className="text-white mb-2">Status: {status}</p>
        {debugInfo && <p className="text-green-400">{debugInfo}</p>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass-card-luxury h-40 animate-pulse rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card-luxury rounded-2xl p-8">
          <p className="text-xl text-red-400 mb-2">Scan returned 0 items.</p>
          <p>Check diagnostic panel above.</p>
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
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>{RARITY_LABELS[item.rarity]}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white truncate mb-2 group-hover:text-amber-300">{item.name}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
