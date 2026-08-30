"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// Полное ABI для попытки нормального вызова
const FULL_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
];

// Interface только для генерации calldata
const INTERFACE = new ethers.Interface(FULL_ABI);

interface GalleryItem {
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
}

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_ICONS = ["⚲", "", "♀"];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

const RARITY_STYLES: Record<number, { 
  badge: string; 
  border: string;
  glow: string;
}> = {
  0: { 
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30", 
    border: "border-slate-500/30",
    glow: "hover:shadow-[0_0_15px_rgba(148,163,184,0.1)]"
  },
  1: { 
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", 
    border: "border-blue-500/40",
    glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
  },
  2: { 
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", 
    border: "border-purple-500/40",
    glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
  },
  3: { 
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", 
    border: "border-amber-500/40",
    glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]"
  },
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Scanning blockchain...");

  // Улучшенный ручной парсер, который пытается найти ВСЕ данные
  const parsePerfumeFromRawData = (rawData: string, tokenId: number): GalleryItem | null => {
    try {
      const hex = rawData.startsWith('0x') ? rawData.slice(2) : rawData;
      
      // Проверка на пустые данные
      if (hex.length < 64 || parseInt(hex.substring(0, 64), 16) === 0) return null;

      // --- 1. ИЗВЛЕЧЕНИЕ ИМЕНИ (через смещение) ---
      let name = "";
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
          
          // Декодируем UTF8 вручную
          let decodedName = "";
          let isValid = true;
          for (let i = 0; i < nameBytes.length; i++) {
            const byte = nameBytes[i];
            if (byte >= 32 && byte <= 126) {
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
        // Если не получилось через смещение, пробуем эвристику ниже
      }

      // --- 2. FALLBACK: ЭВРИСТИКА ДЛЯ ИМЕНИ ---
      if (!name) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }

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

        // Фильтруем кандидатов
        for (const c of candidates) {
          if (c.length === 40 && /^[0-9a-fA-F]+$/.test(c)) continue; // Адреса
          if (/^\d+$/.test(c)) continue; // Числа
          if (["getPerfume", "Not minted"].includes(c)) continue; // Тех. строки
          
          // Приоритет: строки с пробелами (названия типа "Silver Rain")
          if (c.includes(" ") && c.length > 3) {
            name = c;
            break;
          }
          // Вторичный приоритет: длинные слова
          if (!name && c.length > 5 && /^[A-Za-z]+$/.test(c)) {
            name = c;
          }
        }
        // Если всё еще нет имени, берем первый подходящий кандидат
        if (!name) {
          for (const c of candidates) {
            if (c.length === 40 && /^[0-9a-fA-F]+$/.test(c)) continue;
            if (/^\d+$/.test(c)) continue;
            name = c;
            break;
          }
        }
      }

      if (!name || name.length < 2) return null;

      // --- 3. ИЗВЛЕЧЕНИЕ STATIC FIELDS (Gender, PType, Rarity) ---
      // Пытаемся прочитать из фиксированных позиций.
      // Структура возврата: [offset_name][gender_slot][pType_slot][offset_topNotes]...[concentration_slot][rarity_slot][createdAt_slot][creator_slot]
      
      // Gender обычно во втором слоте (байты 32-63)
      const genderHex = hex.substring(64, 66);
      const genderRaw = parseInt(genderHex, 16);
      const gender = (genderRaw >= 0 && genderRaw <= 2) ? genderRaw : 0;

      // PType обычно в третьем слоте (байты 64-95)
      const pTypeHex = hex.substring(128, 130);
      const pTypeRaw = parseInt(pTypeHex, 16);
      const pType = (pTypeRaw >= 0 && pTypeRaw <= 3) ? pTypeRaw : 0;

      // Rarity сложнее, т.к. после динамических массивов.
      // Попробуем найти его в "хвосте" структуры.
      // Хвост: concentration(1b), rarity(1b), createdAt(32b), creator(32b) = ~96 байт от конца.
      // Но из-за выравнивания это может быть не точно.
      // Для надежности пока оставим 0, но можно попробовать поискать паттерн.
      let rarity = 0;
      
      // Попытка найти rarity: ищем байт со значением 0-3 в диапазоне последних 200 байтов,
      // который не является частью адреса или timestamp.
      // Это рискованно, поэтому пока оставим дефолт.
      // Если нужно, можно добавить отдельную функцию в контракт для получения только rarity.

      return {
        tokenId,
        name,
        rarity,
        gender,
        pType
      };

    } catch (e) {
      console.warn(`Parse failed for ID ${tokenId}`, e);
      return null;
    }
  };

  useEffect(() => {
    async function fetchGallery() {
      sessionStorage.removeItem("scent_gallery_cache_v1");
      
      try {
        setStatus("Connecting to Arc Network...");
        const signer = await getArcSigner();
        const provider = signer.provider;
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, FULL_ABI, provider);

        const results: GalleryItem[] = [];
        let consecutiveEmpty = 0;
        const MAX_CONSECUTIVE_EMPTY = 10; 
        let currentId = 1;
        const BATCH_SIZE = 5;

        setStatus(`Scanning IDs (Hybrid Mode)...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            
            // Стратегия: Сначала пробуем нормальный вызов. Если падает - ручной парсинг.
            const promise = contract.getPerfume(idToCheck)
              .then((p: any) => {
                // Если вызов успешен и есть имя
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
              .catch(async (err) => {
                // Если ошибка декодирования - переключаемся на ручной парсинг
                if (err.message?.includes("decode") || err.message?.includes("UNEXPECTED_CONTINUE") || err.code === "BAD_DATA") {
                   const calldata = INTERFACE.encodeFunctionData("getPerfume", [idToCheck]);
                   const rawResult = await provider.call({ to: NFT_CONTRACT_ADDRESS, data: calldata });
                   return parsePerfumeFromRawData(rawResult, idToCheck);
                }
                // Если "Not minted" или другая ошибка - null
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
        setStatus(`Error: ${e.shortMessage || e.message}`);
      } finally {
        setLoading(false);
      }
    }
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
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
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
                className={`block group relative rounded-2xl p-6 bg-slate-900/40 backdrop-blur-md border transition-all duration-300 hover:-translate-y-1 ${style.border} ${style.glow}`}
              >
                {/* Header: ID & Rarity */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-mono text-white/30">#{item.tokenId}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border backdrop-blur-sm ${style.badge}`}>
                    {RARITY_LABELS[item.rarity]}
                  </span>
                </div>
                
                {/* Name */}
                <h3 className="text-xl font-bold text-white mb-6 line-clamp-2 group-hover:text-amber-300 transition-colors">
                  {item.name}
                </h3>
                
                {/* Footer: Gender & Type */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2">
                    <span>{GENDER_ICONS[item.gender] || "⚲"}</span>
                    <span>{TYPE_LABELS[item.pType] || "Unknown"}</span>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
