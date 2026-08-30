"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

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
const GENDER_ICONS = ["⚲", "", "♀"];
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

  const parsePerfumeFromRawData = (rawData: string, tokenId: number): GalleryItem | null => {
    try {
      const hex = rawData.startsWith('0x') ? rawData.slice(2) : rawData;
      if (hex.length < 64 || parseInt(hex.substring(0, 64), 16) === 0) return null;

      // --- 1. ИМЯ ---
      let name = "";
      try {
        const offset = parseInt(hex.substring(0, 64), 16) * 2;
        const len = parseInt(hex.substring(offset, offset + 64), 16);
        if (len > 0 && len < 100) {
          const strHex = hex.substring(offset + 64, offset + 64 + len * 2);
          let decoded = "";
          for (let i = 0; i < len * 2; i += 2) {
            const byte = parseInt(strHex.substr(i, 2), 16);
            if (byte >= 32 && byte <= 126) decoded += String.fromCharCode(byte);
            else break;
          }
          if (decoded.trim()) name = decoded.trim();
        }
      } catch {}

      // Fallback для имени
      if (!name) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) bytes[i/2] = parseInt(hex.substr(i, 2), 16);
        let curr = "", cands: string[] = [];
        for (const b of bytes) {
          if (b >= 32 && b <= 126) curr += String.fromCharCode(b);
          else { if (curr.length > 3) cands.push(curr); curr = ""; }
        }
        for (const c of cands) {
          if (c.length === 40 && /^[0-9a-f]+$/.test(c)) continue;
          if (/^\d+$/.test(c)) continue;
          if (c.includes(" ")) { name = c; break; }
          if (!name && c.length > 5) name = c;
        }
      }
      if (!name) return null;

      // --- 2. GENDER & PTYPE (фиксированные позиции) ---
      let gender = 0, pType = 0;
      const gVal = parseInt(hex.substring(64, 66), 16);
      if (gVal <= 2) gender = gVal;
      const pVal = parseInt(hex.substring(128, 130), 16);
      if (pVal <= 3) pType = pVal;

      // --- 3. ПОИСК РЕДКОСТИ (Smart Search) ---
      // Ищем паттерн: 62 нуля followed by 00, 01, 02, or 03
      // Это соответствует uint8, упакованному в uint256 slot
      let rarity = 0;
      const searchStart = Math.floor(hex.length * 0.6); // Ищем во второй половине данных
      for (let i = searchStart; i < hex.length - 64; i += 2) {
        const slot = hex.substring(i, i + 64);
        if (slot.startsWith("00000000000000000000000000000000000000000000000000000000000000")) {
          const val = parseInt(slot.substring(62, 64), 16);
          if (val >= 0 && val <= 3) {
            // Проверяем контекст: рядом не должно быть других маленьких чисел (чтобы не спутать с concentration)
            // Но для простоты берем первое валидное значение в хвосте
            rarity = val;
            break; 
          }
        }
      }

      // --- 4. ОПИСАНИЕ (Первая нота) ---
      // Пытаемся найти вторую строку в данных (первая верхняя нота)
      let description = TYPE_LABELS[pType]; // Fallback
      try {
        // После имени идут смещения для массивов. 
        // Пропускаем первые ~200-300 байт и ищем следующую читаемую строку
        const afterNameOffset = parseInt(hex.substring(0, 64), 16) * 2 + 64 + (name.length * 2) + 32; // Грубая оценка
        const searchArea = hex.substring(Math.min(afterNameOffset, hex.length * 0.3));
        
        // Ищем первую строку длиной > 3 в этой области
        const bytes = new Uint8Array(searchArea.length / 2);
        for(let i=0; i<searchArea.length; i+=2) bytes[i/2] = parseInt(searchArea.substr(i,2), 16);
        
        let currStr = "";
        for(const b of bytes) {
          if (b >= 32 && b <= 126) currStr += String.fromCharCode(b);
          else {
            if (currStr.length > 3 && currStr.length < 20 && /^[A-Za-z-]+$/.test(currStr)) {
              description = currStr;
              break;
            }
            currStr = "";
          }
        }
      } catch {}

      return { tokenId, name, rarity, gender, pType, description };
    } catch { return null; }
  };

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const signer = await getArcSigner();
        const provider = signer.provider;
        const results: GalleryItem[] = [];
        let emptyCount = 0, currentId = 1;

        while (emptyCount < 10 && currentId < 500) {
          setStatus(`Scanning ID ${currentId}... Found: ${results.length}`);
          setProgress(currentId);
          
          const batch = [];
          for (let i = 0; i < 3; i++) {
            const id = currentId + i;
            const calldata = INTERFACE.encodeFunctionData("getPerfume", [id]);
            batch.push(
              provider.call({ to: NFT_CONTRACT_ADDRESS, data: calldata })
                .then(r => parsePerfumeFromRawData(r, id))
                .catch(() => null)
            );
          }
          
          const res = await Promise.all(batch);
          let found = false;
          for (const r of res) {
            if (r) { results.push(r); found = true; emptyCount = 0; }
            else emptyCount++;
          }
          
          currentId += 3;
          await new Promise(r => setTimeout(r, 150)); // Delay for RPC stability
        }

        setItems(results.sort((a, b) => b.tokenId - a.tokenId));
        setStatus(`Done. Total: ${results.length}`);
      } catch (e: any) {
        setStatus(`Error: ${e.message}`);
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
           {loading && <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all duration-300" style={{width: `${Math.min((progress / 500) * 100, 100)}%`}} /></div>}
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse border border-white/10" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card-luxury rounded-2xl p-8 border border-white/10">No fragrances found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const s = RARITY_STYLES[item.rarity] || RARITY_STYLES[0];
            return (
              <Link key={item.tokenId} href={`/nft/${item.tokenId}`} className={`block group relative rounded-2xl p-6 bg-gradient-to-br ${s.bg} backdrop-blur-md border transition-all duration-300 hover:-translate-y-1 ${s.border} ${s.glow}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-mono text-white/30">#{item.tokenId}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border backdrop-blur-sm ${s.badge}`}>{RARITY_LABELS[item.rarity]}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-amber-300 transition-colors">{item.name}</h3>
                <p className="text-xs text-white/40 mb-6 italic truncate">{item.description}</p>
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <span>{GENDER_ICONS[item.gender]}</span>
                    <span>{TYPE_LABELS[item.pType]}</span>
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
