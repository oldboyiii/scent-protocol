"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// Interface used solely for generating calldata
const INTERFACE = new ethers.Interface([
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
]);

interface GalleryItem {
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  description?: string;
}

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_ICONS = ["⚲", "♂", "♀"];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

const RARITY_STYLES: Record<number, { 
  badge: string; 
  border: string;
  glow: string;
  bg: string;
}> = {
  0: { 
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30", 
    border: "border-slate-500/30",
    glow: "hover:shadow-[0_0_15px_rgba(148,163,184,0.1)]",
    bg: "from-slate-900/80 to-slate-900/40"
  },
  1: { 
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", 
    border: "border-blue-500/40",
    glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    bg: "from-blue-950/60 to-slate-900/60"
  },
  2: { 
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", 
    border: "border-purple-500/40",
    glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    bg: "from-purple-950/60 to-slate-900/60"
  },
  3: { 
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", 
    border: "border-amber-500/40",
    glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]",
    bg: "from-amber-950/60 to-slate-900/60"
  },
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Scanning...");
  const [progress, setProgress] = useState(0);

  // Manual parser for raw ABI-encoded data
  const parsePerfumeFromRawData = (rawData: string, tokenId: number): GalleryItem | null => {
    try {
      const hex = rawData.startsWith('0x') ? rawData.slice(2) : rawData;
      
      // Check if data is empty or zero (not minted)
      if (hex.length < 64 || parseInt(hex.substring(0, 64), 16) === 0) return null;

      // --- 1. EXTRACT NAME ---
      let name = "";
      try {
        // First 32 bytes (64 hex chars) is the offset to the 'name' string data
        const nameOffsetHex = hex.substring(0, 64);
        const nameOffset = parseInt(nameOffsetHex, 16) * 2; // Convert to char index
        
        // Next 32 bytes at that offset is the length of the string
        const lenHex = hex.substring(nameOffset, nameOffset + 64);
        const len = parseInt(lenHex, 16);
        
        // Sanity check for length
        if (len > 0 && len < 100) {
          // Next 'len' bytes are the string content
          const nameHex = hex.substring(nameOffset + 64, nameOffset + 64 + (len * 2));
          
          // Convert hex to utf8 string manually
          let decodedName = "";
          let isValid = true;
          for (let i = 0; i < len * 2; i += 2) {
            const byte = parseInt(nameHex.substr(i, 2), 16);
            if (byte >= 32 && byte <= 126) { // Printable ASCII
              decodedName += String.fromCharCode(byte);
            } else {
              isValid = false;
              break;
            }
          }
          if (isValid && decodedName.trim().length > 0) {
            name = decodedName.trim();
          }
        }
      } catch (e) {
        console.warn(`Name extraction failed for ID ${tokenId}`, e);
      }

      // Fallback heuristic for name if offset method fails
      if (!name) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) bytes[i/2] = parseInt(hex.substr(i, 2), 16);
        
        let currStr = "";
        const candidates: string[] = [];
        for (const b of bytes) {
          if (b >= 32 && b <= 126) currStr += String.fromCharCode(b);
          else {
            if (currStr.length > 3) candidates.push(currStr);
            currStr = "";
          }
        }
        if (currStr.length > 3) candidates.push(currStr);

        for (const c of candidates) {
          // Skip addresses and numbers
          if (c.length === 40 && /^[0-9a-fA-F]+$/.test(c)) continue;
          if (/^\d+$/.test(c)) continue;
          // Prefer strings with spaces (likely names like "Silver Rain")
          if (c.includes(" ") && c.length > 3) { name = c; break; }
          // Otherwise take first long word
          if (!name && c.length > 5) name = c;
        }
      }

      if (!name || name.length < 2) return null;

      // --- 2. EXTRACT STATIC FIELDS (Gender, PType) ---
      // These are packed into 32-byte slots right after the initial offsets.
      // Gender is typically in the second slot (bytes 32-63)
      let gender = 0;
      const genderHex = hex.substring(64, 66); 
      const genderRaw = parseInt(genderHex, 16);
      if (genderRaw >= 0 && genderRaw <= 2) gender = genderRaw;

      // PType is typically in the third slot (bytes 64-95)
      let pType = 0;
      const pTypeHex = hex.substring(128, 130);
      const pTypeRaw = parseInt(pTypeHex, 16);
      if (pTypeRaw >= 0 && pTypeRaw <= 3) pType = pTypeRaw;

      // --- 3. EXTRACT RARITY (Deterministic Offset) ---
      // The static tail of the struct is: concentration(1b), rarity(1b), createdAt(32b), creator(32b).
      // Creator is ALWAYS the last 32 bytes (64 hex chars).
      // CreatedAt is ALWAYS the 32 bytes before creator.
      // Rarity is ALWAYS the byte immediately before createdAt's slot starts? 
      // Actually, in Solidity ABI encoding for structs returned by view functions:
      // Static fields that come AFTER dynamic fields are packed at the END of the return data.
      // So the order at the very end is: ... [concentration_slot] [rarity_slot] [createdAt_slot] [creator_slot]
      // Each slot is 32 bytes (64 hex chars).
      // Therefore, rarity starts at: totalLength - 64 (creator) - 64 (createdAt) - 64 (rarity_slot) = totalLength - 192.
      
      let rarity = 0;
      const totalLen = hex.length;
      const raritySlotStart = totalLen - 192; 
      
      if (raritySlotStart > 0 && raritySlotStart + 64 <= totalLen) {
         const raritySlotHex = hex.substring(raritySlotStart, raritySlotStart + 64);
         // uint8 is stored in the LAST 2 hex chars of the 32-byte slot (big-endian padding)
         const rarityVal = parseInt(raritySlotHex.substring(62, 64), 16);
         
         // Validate that it's a valid rarity value (0-3)
         if (rarityVal >= 0 && rarityVal <= 3) {
            rarity = rarityVal;
         } else {
            // If validation fails, it means our offset assumption might be slightly off 
            // due to how Solidity packs multiple uint8s into one slot.
            // Let's try searching backwards from the end for a valid rarity byte.
            // We know creator is last 64 hex. createdAt is prev 64 hex.
            // Before that should be a slot containing concentration and rarity.
            // Concentration is usually 5-30, Rarity is 0-3.
            // They might be packed as: 0x00...00[concentration][rarity] or similar.
            // Let's scan the 64 hex chars before createdAt for values 0-3.
            const preCreatedAtSlotStart = totalLen - 64 - 64 - 64; // Before creator and createdAt
            if (preCreatedAtSlotStart > 0) {
               const mixedSlot = hex.substring(preCreatedAtSlotStart, preCreatedAtSlotStart + 64);
               // Try last byte
               let val = parseInt(mixedSlot.substring(62, 64), 16);
               if (val >= 0 && val <= 3) rarity = val;
               // Try second to last byte (if concentration is last)
               else {
                 val = parseInt(mixedSlot.substring(60, 62), 16);
                 if (val >= 0 && val <= 3) rarity = val;
               }
            }
         }
      }

      // --- 4. EXTRACT DESCRIPTION (First Top Note) ---
      // This is tricky without full decoding. We'll use a fallback.
      let description = TYPE_LABELS[pType]; 

      return {
        tokenId,
        name,
        rarity,
        gender,
        pType,
        description
      };

    } catch (e) {
      console.warn(`Parse failed for ID ${tokenId}`, e);
      return null;
    }
  };

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setStatus("Connecting to Arc Network...");
        const signer = await getArcSigner();
        const provider = signer.provider;

        const results: GalleryItem[] = [];
        let consecutiveEmpty = 0;
        const MAX_CONSECUTIVE_EMPTY = 10; 
        let currentId = 1;
        const BATCH_SIZE = 3; // Small batch to avoid RPC rate limits

        setStatus(`Scanning IDs (Deterministic Mode)...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            const calldata = INTERFACE.encodeFunctionData("getPerfume", [idToCheck]);

            batchPromises.push(
              provider.call({ to: NFT_CONTRACT_ADDRESS, data: calldata })
                .then((rawResult: string) => parsePerfumeFromRawData(rawResult, idToCheck))
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

          setProgress(currentId);
          if (results.length > 0 || currentId % 10 === 0) {
             setStatus(`Scanned up to ID ${currentId}. Found: ${results.length}`);
          }

          currentId += BATCH_SIZE;
          
          // Delay between batches to prevent RPC throttling
          await new Promise(r => setTimeout(r, 200)); 
        }

        const sorted = results.sort((a, b) => b.tokenId - a.tokenId);
        setItems(sorted);
        setStatus(`Done. Total found: ${sorted.length}`);
        
      } catch (e: any) {
        console.error("CRITICAL ERROR:", e);
        setStatus(`Error: ${e.shortMessage || e.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGallery();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 relative z-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent">Gallery</h1>
          <p className="text-white/50 mt-2">All fragrances minted on ScentProtocol.</p>
        </div>
        <div className="text-right hidden md:block min-w-[200px]">
           <p className="text-xs text-white/30 font-mono mb-1">{status}</p>
           {loading && (
             <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-amber-500 transition-all duration-300" 
                 style={{width: `${Math.min((progress / 500) * 100, 100)}%`}} 
               />
             </div>
           )}
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card-luxury rounded-2xl p-8 border border-white/10">
          No fragrances found in scanned range.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const style = RARITY_STYLES[item.rarity] || RARITY_STYLES[0];
            return (
              <Link 
                key={item.tokenId} 
                href={`/nft/${item.tokenId}`} 
                className={`block group relative rounded-2xl p-6 bg-gradient-to-br ${style.bg} backdrop-blur-md border transition-all duration-300 hover:-translate-y-1 ${style.border} ${style.glow}`}
              >
                {/* Header: ID & Rarity */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-mono text-white/30">#{item.tokenId}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border backdrop-blur-sm ${style.badge}`}>
                    {RARITY_LABELS[item.rarity]}
                  </span>
                </div>
                
                {/* Name */}
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-amber-300 transition-colors">
                  {item.name}
                </h3>

                {/* Description / Type */}
                <p className="text-xs text-white/40 mb-6 italic truncate">
                  {item.description} fragrance
                </p>
                
                {/* Footer: Gender & Type Icons */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <span title="Gender">{GENDER_ICONS[item.gender]}</span>
                    <span title="Type">{TYPE_LABELS[item.pType]}</span>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400 text-sm">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
