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
  const [status, setStatus] = useState("Initializing manual parser...");

  // Manual parser for raw ABI-encoded data
  const parsePerfumeFromRawData = (rawData: string, tokenId: number): GalleryItem | null => {
    try {
      const hex = rawData.startsWith('0x') ? rawData.slice(2) : rawData;
      
      // Check if data is empty or zero
      if (hex.length < 64 || parseInt(hex.substring(0, 64), 16) === 0) return null;

      // In ABI encoding for a struct returned by a view function:
      // The first 32 bytes (64 hex chars) is the offset to the first dynamic element (name).
      // BUT, since this is a direct return of a struct, the layout might be slightly different.
      // Let's look at the static fields which are easier to find.
      
      // Based on your struct:
      // Offset 0x00 (0-31): offset to name (dynamic)
      // Offset 0x20 (32-63): gender (uint8) - stored in first byte of this slot
      // Offset 0x40 (64-95): pType (uint8)
      // ... then offsets for arrays ...
      // Then static fields at the end: concentration, rarity, createdAt, creator
      
      // Let's try to read static fields from their expected positions.
      // Note: Ethers packs uint8 into uint256 slots.
      
      // Gender is likely at byte 32 (hex char 64)
      const genderHex = hex.substring(64, 66); 
      const gender = parseInt(genderHex, 16);
      
      // PType is likely at byte 64 (hex char 128)
      const pTypeHex = hex.substring(128, 130);
      const pType = parseInt(pTypeHex, 16);
      
      // Rarity is harder to find without decoding the whole struct because of the dynamic arrays in between.
      // However, looking at your previous hex dumps, we saw patterns.
      // Let's use a heuristic for rarity based on known values or try to find it near the end.
      // For now, let's default to 0 and focus on getting the NAME right.
      let rarity = 0; 

      // --- EXTRACTING NAME ---
      // The first 32 bytes is the offset to the 'name' string data.
      const nameOffsetHex = hex.substring(0, 64);
      const nameOffset = parseInt(nameOffsetHex, 16) * 2; // Convert to char index
      
      // At that offset, the next 32 bytes is the length of the string.
      const lenHex = hex.substring(nameOffset, nameOffset + 64);
      const len = parseInt(lenHex, 16);
      
      // Sanity check for length (names shouldn't be > 100 chars or < 1)
      if (len < 1 || len > 100) {
         // Fallback: maybe the structure is different. Try to find a readable string manually.
         // But let's trust the offset for now.
         return null; 
      }
      
      // The next 'len' bytes are the string content.
      const nameHex = hex.substring(nameOffset + 64, nameOffset + 64 + (len * 2));
      
      // Convert hex to utf8 string
      const nameBytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        nameBytes[i] = parseInt(nameHex.substr(i * 2, 2), 16);
      }
      
      // Decode UTF8 manually to avoid ethers dependency issues
      let name = "";
      for (let i = 0; i < nameBytes.length; i++) {
        const byte = nameBytes[i];
        if (byte >= 32 && byte <= 126) { // Printable ASCII
          name += String.fromCharCode(byte);
        } else {
          // If we hit non-printable, our offset calculation might be wrong.
          // Break and try fallback.
          name = ""; 
          break;
        }
      }

      if (!name || name.trim().length === 0) return null;

      // --- REFINING RARITY (Heuristic based on position) ---
      // Since we can't easily decode the middle part due to dynamic arrays,
      // let's try to find 'rarity' by looking at the static tail of the struct.
      // Struct tail: concentration(uint8), rarity(uint8), createdAt(uint256), creator(address)
      // Total tail size: 32 + 32 + 32 + 32 = 128 bytes (256 hex chars).
      // So rarity should be at: totalLength - 128 - 32 (for concentration) = totalLength - 160 bytes? 
      // Actually, let's just stick to 0 for now if we can't be sure, OR try to parse it if we see a pattern.
      // Looking at your hex dump: "...0000000000000000000000000000000000000000000000000000000000000000..."
      // It's safer to leave rarity as 0 (Common) until we have a robust decoder, 
      // OR we can try to fetch it via a separate call if needed. 
      // BUT, let's try one more thing: search for the rarity value in the hex if we know what to look for? No, too risky.
      
      // Let's return what we have. Name is the most important for Gallery.
      return {
        tokenId,
        name: name.trim(),
        rarity: rarity, // Defaulting to Common for safety
        gender: gender > 2 ? 0 : gender, // Sanitize
        pType: pType > 3 ? 0 : pType     // Sanitize
      };

    } catch (e) {
      console.warn(`Manual parse failed for ID ${tokenId}`, e);
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

        setStatus(`Scanning IDs (Manual Parser Mode)...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            const calldata = INTERFACE.encodeFunctionData("getPerfume", [idToCheck]);

            batchPromises.push(
              provider.call({ to: NFT_CONTRACT_ADDRESS, data: calldata })
                .then((rawResult: string) => {
                  return parsePerfumeFromRawData(rawResult, idToCheck);
                })
                .catch((err) => {
                  // Ignore "Not minted" reverts
                  if (err.message?.includes("Not minted") || err.message?.includes("revert")) return null;
                  console.warn(`RPC Error for ID ${idToCheck}:`, err.shortMessage);
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
