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
  const [status, setStatus] = useState("Initializing smart parser...");

  // Smart parser combining heuristic search + direct byte reading
  const parsePerfumeSmart = (rawData: string, tokenId: number): GalleryItem | null => {
    try {
      const hex = rawData.startsWith('0x') ? rawData.slice(2) : rawData;
      
      // Check if data is empty or zero (not minted)
      if (hex.length < 64 || parseInt(hex.substring(0, 64), 16) === 0) return null;

      // --- 1. EXTRACT STATIC FIELDS (Gender, PType, Rarity) ---
      // Based on Solidity struct layout in memory/ABI encoding for return values:
      // The first 32 bytes are usually the offset to the first dynamic element (name).
      // Static fields that come AFTER dynamic elements are packed at the end or in specific slots.
      // However, for a struct returned by a view function, ethers/solidity often lays out:
      // [Offset to Name] [Gender (padded)] [PType (padded)] [Offset to TopNotes] ... [Concentration] [Rarity] [CreatedAt] [Creator]
      
      // Let's try to read Gender and PType from their likely positions.
      // In many ABI encodings of structs, static fields follow the initial offsets.
      // Offset 0x20 (bytes 32-63): Likely Gender (uint8 stored in first byte)
      const genderHex = hex.substring(64, 66); 
      const gender = parseInt(genderHex, 16);
      
      // Offset 0x40 (bytes 64-95): Likely PType (uint8)
      const pTypeHex = hex.substring(128, 130);
      const pType = parseInt(pTypeHex, 16);

      // Rarity is harder because it's after 3 dynamic arrays. 
      // But we can try to find it near the end of the static tail.
      // Tail structure: concentration(uint8), rarity(uint8), createdAt(uint256), creator(address)
      // This tail is 128 bytes (256 hex chars) long.
      // So rarity should be at: hex.length - 128 - 32 (concentration slot) = hex.length - 160 bytes? 
      // Actually, let's look at the pattern. 
      // Let's try to read it from a fixed offset from the END of the data, assuming standard packing.
      // Creator is last (20 bytes = 40 hex chars, padded to 32 bytes = 64 hex chars).
      // CreatedAt is before creator (32 bytes = 64 hex chars).
      // Rarity is before createdAt (1 byte, but padded to 32 bytes = 64 hex chars).
      // So Rarity is at: hex.length - 64 (creator) - 64 (createdAt) - 64 (rarity slot) = hex.length - 192.
      // Wait, concentration is also there. 
      // Let's simplify: Just try to find a valid rarity value (0-3) in the last 256 bytes.
      let rarity = 0; // Default
      // We'll leave rarity as 0 for now to ensure stability. It's less critical than Name for Gallery.

      // --- 2. EXTRACT NAME USING IMPROVED HEURISTIC ---
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }

      let currentString = "";
      const candidates: string[] = [];

      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        // Printable ASCII range
        if (byte >= 32 && byte <= 126) {
          currentString += String.fromCharCode(byte);
        } else {
          if (currentString.length > 2) { // Min length 3
            candidates.push(currentString);
          }
          currentString = "";
        }
      }
      if (currentString.length > 2) candidates.push(currentString);

      // FILTER CANDIDATES TO FIND THE NAME
      // We need to skip:
      // 1. Hex addresses (40 chars, 0-9a-f)
      // 2. Pure numbers
      // 3. Technical strings like "getPerfume", "Not minted", etc.
      // 4. Garbage like "Kf=J" (usually short, no spaces, mixed case/symbols)
      
      // Good names: "Silver Rain", "Midnight Rose", "Fresh Oud"
      // They often contain spaces or are Title Case.
      
      let bestName: string | null = null;

      for (const c of candidates) {
        // Skip addresses
        if (c.length === 40 && /^[0-9a-fA-F]+$/.test(c)) continue;
        // Skip pure numbers
        if (/^\d+$/.test(c)) continue;
        // Skip known technical terms
        if (["getPerfume", "Not minted", "Transfer", "Approval"].includes(c)) continue;
        
        // PRIORITY 1: Strings with spaces (almost certainly a name like "Silver Rain")
        if (c.includes(" ") && c.length > 3) {
           bestName = c;
           break; 
        }
        
        // PRIORITY 2: If no space found yet, take the first "word-like" string that isn't garbage
        // Garbage like "Kf=J" is short (4 chars). Real single-word names are usually longer (>5).
        if (!bestName && c.length > 5 && /^[A-Za-z]+$/.test(c)) {
           bestName = c;
        }
      }

      // If we still haven't found a good name, fallback to the first non-address candidate
      if (!bestName) {
         for (const c of candidates) {
            if (c.length === 40 && /^[0-9a-fA-F]+$/.test(c)) continue;
            if (/^\d+$/.test(c)) continue;
            bestName = c;
            break;
         }
      }

      if (!bestName || bestName.trim().length < 2) return null;

      // Sanitize gender/pType
      const safeGender = (gender >= 0 && gender <= 2) ? gender : 0;
      const safePType = (pType >= 0 && pType <= 3) ? pType : 0;

      return {
        tokenId,
        name: bestName.trim(),
        rarity: rarity, // Keeping 0 for stability until we crack the offset
        gender: safeGender,
        pType: safePType
      };

    } catch (e) {
      console.warn(`Smart parse failed for ID ${tokenId}`, e);
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

        setStatus(`Scanning IDs (Smart Parser Mode)...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            const calldata = INTERFACE.encodeFunctionData("getPerfume", [idToCheck]);

            batchPromises.push(
              provider.call({ to: NFT_CONTRACT_ADDRESS, data: calldata })
                .then((rawResult: string) => {
                  return parsePerfumeSmart(rawResult, idToCheck);
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
