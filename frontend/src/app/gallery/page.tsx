"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// Interface for the function signature to generate correct calldata
const INTERFACE = new ethers.Interface([
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
]);

interface GalleryItem {
  tokenId: number;
  name: string;
  rarity: number; // We'll try to extract this too if possible, or default to 0
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
  const [status, setStatus] = useState("Starting low-level scan...");
  const [debugHex, setDebugHex] = useState<string | null>(null);

  // Helper to decode a single string from raw ABI-encoded data at a specific offset
  // This is a simplified decoder specifically for the first string (name) in your struct
  const extractNameFromRawData = (rawData: string): string | null => {
    try {
      // The structure starts with offsets. 
      // Based on your hex dump, the 'name' string data usually starts after the initial offsets block.
      // However, a safer way without full decoding is to look for the pattern of the name we know exists.
      // But let's try a standard Interface decode but catch the error and fallback? 
      // No, let's use the Interface to decode JUST the name if possible, or parse manually.
      
      // Actually, looking at your hex: 
      // 0x...0020 (offset to name) -> points to 0x140 (320 decimal)
      // At 0x140 we have length 0x0b (11 bytes) -> "Silver Rain"
      
      // Let's implement a tiny manual parser for the first string based on standard ABI encoding
      const data = rawData.startsWith('0x') ? rawData.slice(2) : rawData;
      
      // First 32 bytes (64 chars) is the offset to the first dynamic element (name)
      const nameOffsetHex = data.substring(0, 64);
      const nameOffset = parseInt(nameOffsetHex, 16) * 2; // convert to char index
      
      // Next 32 bytes at that offset is the length of the string
      const lenHex = data.substring(nameOffset, nameOffset + 64);
      const len = parseInt(lenHex, 16);
      
      // Next 'len' bytes are the string content
      const nameHex = data.substring(nameOffset + 64, nameOffset + 64 + (len * 2));
      
      // Convert hex to utf8 string
      const name = ethers.toUtf8String('0x' + nameHex);
      return name.trim();
    } catch (e) {
      console.warn("Manual name extraction failed", e);
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

        setStatus(`Scanning IDs (Low-level mode)...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            
            // Create calldata manually
            const calldata = INTERFACE.encodeFunctionData("getPerfume", [idToCheck]);

            batchPromises.push(
              provider.call({ to: NFT_CONTRACT_ADDRESS, data: calldata })
                .then((rawResult: string) => {
                  // DEBUG: Save first raw result
                  if (idToCheck === 1 && !debugHex) {
                    setDebugHex(rawResult);
                  }

                  // Check if result is just zeros (not minted) or valid data
                  if (rawResult === "0x" || parseInt(rawResult, 16) === 0) {
                    return null;
                  }

                  // Try to extract name manually
                  const name = extractNameFromRawData(rawResult);
                  
                  if (name && name.length > 0) {
                    // We couldn't easily extract rarity without full decoding, so defaulting to 0 or trying to guess
                    // For now, let's assume Common (0) or try to find it later. 
                    // Actually, let's just show the name. Rarity can be fetched on detail page.
                    return { 
                      tokenId: idToCheck, 
                      name: name, 
                      rarity: 0 // Default to Common for gallery view to avoid crash
                    };
                  }
                  return null;
                })
                .catch((err) => {
                  // Ignore "Not minted" reverts
                  if (err.message?.includes("Not minted") || err.message?.includes("revert")) {
                    return null;
                  }
                  console.warn(`Error fetching ID ${idToCheck}:`, err.shortMessage);
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
        <p className="text-amber-400 font-bold mb-2">DIAGNOSTIC MODE: MANUAL DECODING</p>
        <p className="text-white mb-2">Status: {status}</p>
        
        {debugHex && (
           <div className="mt-2 p-3 bg-gray-900 rounded border border-gray-700">
             <p className="text-green-400 mb-1">✅ Raw Data Received for ID #1</p>
             <p className="text-gray-400 break-all opacity-70">{debugHex.slice(0, 100)}...</p>
             <p className="text-yellow-400 mt-1">Attempting manual string extraction...</p>
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
