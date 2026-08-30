"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// Interface только для генерации calldata
const INTERFACE = new ethers.Interface([
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
]);

interface GalleryItem {
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  firstTopNote?: string; // Для краткого описания
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
    bg: "from-slate-900/60 to-slate-900/40"
  },
  1: { 
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", 
    border: "border-blue-500/40",
    glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    bg: "from-blue-900/40 to-slate-900/60"
  },
  2: { 
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", 
    border: "border-purple-500/40",
    glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    bg: "from-purple-900/40 to-slate-900/60"
  },
  3: { 
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", 
    border: "border-amber-500/40",
    glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]",
    bg: "from-amber-900/40 to-slate-900/60"
  },
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Scanning blockchain...");
  const [progress, setProgress] = useState(0);

  // Улучшенный ручной парсер
  const parsePerfumeFromRawData = (rawData: string, tokenId: number): GalleryItem | null => {
    try {
      const hex = rawData.startsWith('0x') ? rawData.slice(2) : rawData;
      
      if (hex.length < 64 || parseInt(hex.substring(0, 64), 16) === 0) return null;

      // --- 1. ИЗВЛЕЧЕНИЕ ИМЕНИ ---
      let name = "";
      let firstTopNote = "";
      
      try {
        const nameOffsetHex = hex.substring(0, 64);
        const nameOffset = parseInt(nameOffsetHex, 16) * 2;
        
        const lenHex = hex.substring(nameOffset, nameOffset + 64);
        const len = parseInt(lenHex, 16);
        
        if (len > 0 && len < 100) {
          const nameHex = hex.substring(nameOffset + 64, nameOffset + 64 + (len * 2));
          const nameBytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            nameBytes[i] = parseInt(nameHex.substr(i * 2, 2), 16);
          }
          
          let decodedName = "";
          let isValid = true;
          for (let i = 0; i < nameBytes.length; i++) {
            const byte = nameBytes[i];
            if (byte >= 32 && byte <= 126) decodedName += String.fromCharCode(byte);
            else { isValid = false; break; }
          }
          if (isValid && decodedName.trim().length > 0) name = decodedName.trim();
        }
      } catch (e) {}

      // Fallback эвристика для имени
      if (!name) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);

        let currentString = "";
        const candidates: string[] = [];
        for (let i = 0; i < bytes.length; i++) {
          const byte = bytes[i];
          if (byte >= 32 && byte <= 126) currentString += String.fromCharCode(byte);
          else {
            if (currentString.length > 2) candidates.push(currentString);
            currentString = "";
          }
        }
        if (currentString.length > 2) candidates.push(currentString);

        for (const c of candidates) {
          if (c.length === 40 && /^[0-9a-fA-F]+$/.test(c)) continue;
          if (/^\d+$/.test(c)) continue;
          if (["getPerfume", "Not minted"].includes(c)) continue;
          if (c.includes(" ") && c.length > 3) { name = c; break; }
          if (!name && c.length > 5 && /^[A-Za-z]+$/.test(c)) name = c;
        }
      }

      if (!name || name.length < 2) return null;

      // --- 2. ИЗВЛЕЧЕНИЕ METADATA ---
      let gender = 0;
      let pType = 0;
      let rarity = 0;

      // Gender (байты 32-63)
      const genderHex = hex.substring(64, 66); 
      const genderRaw = parseInt(genderHex, 16);
      if (genderRaw >= 0 && genderRaw <= 2) gender = genderRaw;

      // PType (байты 64-95)
      const pTypeHex = hex.substring(128, 130);
      const pTypeRaw = parseInt(pTypeHex, 16);
      if (pTypeRaw >= 0 && pTypeRaw <= 3) pType = pTypeRaw;

      // Rarity: Ищем в хвосте. 
      // Структура хвоста: ... [rarity_slot(32b)] [createdAt(32b)] [creator(32b)]
      // Creator - последние 32 байта (64 hex). CreatedAt - перед ним. Rarity - еще перед ним.
      // Значит rarity начинается за 192 символа (96 байт) от конца.
      const totalLen = hex.length;
      const raritySlotStart = totalLen - 192; 
      
      if (raritySlotStart > 0 && raritySlotStart + 64 <= totalLen) {
         const raritySlotHex = hex.substring(raritySlotStart, raritySlotStart + 64);
         // Значение uint8 лежит в последних 2 hex chars слота (big-endian padding)
         const rarityVal = parseInt(raritySlotHex.substring(62, 64), 16);
         if (rarityVal >= 0 && rarityVal <= 3) rarity = rarityVal;
      }

      // Попытка найти первую верхнюю ноту (для описания)
      // Это сложно, но попробуем найти вторую строку после имени.
      // Обычно topNotes идут сразу после offset_name.
      // Но из-за сложности пропускаем это для стабильности, либо используем заглушку.
      // Для красоты добавим просто тип парфюма как "описание" если нет нот.
      
      return {
        tokenId,
        name,
        rarity,
        gender,
        pType,
        firstTopNote: TYPE_LABELS[pType] // Пока используем тип как краткое описание
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
        const BATCH_SIZE = 3; // Уменьшаем пакет чтобы не получать RPC errors

        setStatus(`Scanning IDs (Safe Mode)...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            const calldata = INTERFACE.encodeFunctionData("getPerfume", [idToCheck]);

            batchPromises.push(
              provider.call({ to: NFT_CONTRACT_ADDRESS, data: calldata })
                .then((rawResult: string) => parsePerfumeFromRawData(rawResult, idToCheck))
                .catch((err) => {
                  if (err.message?.includes("Not minted") || err.message?.includes("revert")) return null;
                  // Не логируем каждую ошибку RPC чтобы не спамить консоль
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
          
          // ДОБАВЛЕНА ЗАДЕРЖКА ДЛЯ СТАБИЛЬНОСТИ RPC
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
        <div className="text-right hidden md:block">
           <p className="text-xs text-white/30 font-mono">{status}</p>
           {loading && <div className="w-32 h-1 bg-white/10 rounded-full mt-2 overflow-hidden"><div className="h-full bg-amber-500 transition-all duration-300" style={{width: `${Math.min((progress / 500) * 100, 100)}%`}} /></div>}
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
          <p>No fragrances found in scanned range.</p>
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
                <p className="text-xs text-white/40 mb-6 italic">
                  {item.firstTopNote} fragrance
                </p>
                
                {/* Footer: Gender & Type Icons */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <span title="Gender" className="flex items-center gap-1">
                      {GENDER_ICONS[item.gender] || "⚲"}
                    </span>
                    <span title="Type" className="flex items-center gap-1">
                       {TYPE_LABELS[item.pType] || "Unknown"}
                    </span>
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
