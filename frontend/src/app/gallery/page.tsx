"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// FIX: Changed uint8 to uint256 for better compatibility with decoding
// If your contract uses uint8, ethers usually handles it, but sometimes strict tuple decoding fails if there's a mismatch.
// We also removed 'concentration' from ABI just in case it's missing or different, 
// BUT ideally you should check your Solidity code. 
// For now, let's try a generic structure that matches common patterns.
const GALLERY_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint256 gender, uint256 pType, uint256 concentration, uint256 rarity, string[] topNotes, string[] heartNotes, string[] baseNotes, address creator, uint256 createdAt)"
];

interface GalleryItem {
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
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
  const [status, setStatus] = useState("Starting diagnostic scan...");
  const [errorLog, setErrorLog] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      sessionStorage.removeItem("scent_gallery_cache_v1");
      
      try {
        setStatus("Connecting...");
        const signer = await getArcSigner();
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, GALLERY_ABI, signer.provider);

        const results: GalleryItem[] = [];
        let consecutiveEmpty = 0;
        const MAX_CONSECUTIVE_EMPTY = 10; 
        let currentId = 1;
        const BATCH_SIZE = 5;

        setStatus(`Scanning IDs...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            batchPromises.push(
              contract.getPerfume(idToCheck)
                .then((p: any) => {
                  // Check if we got valid data
                  // Note: With the new ABI, p is no longer a tuple object {name:..., gender:...}
                  // It might be an array [name, gender, ...] OR an object depending on ethers version.
                  // Ethers v6 usually returns an object with named properties IF ABI has names.
                  
                  if (p && p.name && typeof p.name === 'string' && p.name.length > 0) {
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
                  // Log the FIRST error to state so we can see it on screen
                  if (!errorLog && err.message?.includes("decode")) {
                     setErrorLog(err.shortMessage || err.message);
                  }
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
      <div className="mb-8 p-4 rounded-lg bg-black/60 border border-red-500/30 font-mono text-xs overflow-x-auto">
        <p className="text-amber-400 font-bold mb-2">DIAGNOSTIC MODE ACTIVE</p>
        <p className="text-white mb-1">Status: {status}</p>
        {errorLog && (
           <div className="mt-2 p-2 bg-red-900/30 rounded border border-red-700">
             <p className="text-red-400 font-bold">Decoding Error Detected:</p>
             <p className="text-gray-300 break-all">{errorLog}</p>
             <p className="text-gray-400 mt-1">This means the ABI in code does not match the contract.</p>
           </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass-card-luxury h-40 animate-pulse rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card-luxury rounded-2xl p-8">
          <p className="text-xl text-red-400 mb-2">Scan returned 0 items.</p>
          <p>Please check the Diagnostic Panel above.</p>
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
