"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// FIX: Use a FLAT ABI that avoids struct decoding issues in ethers v6
// This matches the exact order of fields in the Perfume struct
const GALLERY_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
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
  const [status, setStatus] = useState("Starting scan...");
  const [debugData, setDebugData] = useState<any>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      sessionStorage.removeItem("scent_gallery_cache_v1");
      
      try {
        setStatus("Connecting to Arc Network...");
        const signer = await getArcSigner();
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, GALLERY_ABI, signer.provider);

        const results: GalleryItem[] = [];
        let consecutiveEmpty = 0;
        const MAX_CONSECUTIVE_EMPTY = 10; 
        let currentId = 1;
        const BATCH_SIZE = 5;

        setStatus(`Scanning IDs starting from ${currentId}...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            batchPromises.push(
              contract.getPerfume(idToCheck)
                .then((p: any) => {
                  // DEBUG: Capture raw data for first token
                  if (idToCheck === 1 && !debugData) {
                    console.log("RAW DATA ID #1:", p);
                    console.log("Type of p:", typeof p);
                    console.log("Is Array?", Array.isArray(p));
                    setDebugData(p);
                  }

                  // With flat ABI, p should be an array-like object or Result
                  // Access by index to be safe: [0]=name, [1]=gender, [2]=pType, ..., [7]=rarity
                  const name = p[0] || p.name;
                  const rarity = Number(p[7] || p.rarity);
                  const gender = Number(p[1] || p.gender);
                  const pType = Number(p[2] || p.pType);

                  if (name && typeof name === 'string' && name.trim().length > 0) {
                    return { 
                      tokenId: idToCheck, 
                      name: name, 
                      rarity: rarity, 
                      gender: gender, 
                      pType: pType 
                    };
                  }
                  return null;
                })
                .catch((err) => {
                  if (idToCheck === 1 && !decodeError) {
                    setDecodeError(err.shortMessage || err.message);
                    console.error("Decode error for ID #1:", err);
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
      <div className="mb-8 p-4 rounded-lg bg-black/60 border border-amber-500/30 font-mono text-xs overflow-x-auto">
        <p className="text-amber-400 font-bold mb-2">DIAGNOSTIC MODE: FLAT ABI TEST</p>
        <p className="text-white mb-2">Status: {status}</p>
        
        {decodeError && (
           <div className="mt-2 p-3 bg-red-900/30 rounded border border-red-700">
             <p className="text-red-400 font-bold">❌ Decoding Failed:</p>
             <pre className="text-gray-300 whitespace-pre-wrap break-all">{decodeError}</pre>
           </div>
        )}

        {debugData && !decodeError ? (
           <div className="mt-2 p-3 bg-green-900/30 rounded border border-green-700">
             <p className="text-green-400 font-bold">✅ Data received for ID #1:</p>
             <pre className="text-gray-300 whitespace-pre-wrap break-all">
               {JSON.stringify(debugData, (key, value) => {
                 // Handle BigInt serialization
                 if (typeof value === 'bigint') return value.toString();
                 return value;
               }, 2).slice(0, 500)}...
             </pre>
           </div>
        ) : debugData && decodeError ? (
           <div className="mt-2 p-3 bg-yellow-900/30 rounded border border-yellow-700">
             <p className="text-yellow-400">Raw data exists but decoding failed. Check error above.</p>
           </div>
        ) : (
          <p className="text-gray-500 italic">Waiting for data from ID #1...</p>
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
