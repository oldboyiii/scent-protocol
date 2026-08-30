"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

const GALLERY_ABI = [
  "function getPerfume(uint256 tokenId) view returns (tuple(string name, uint8 gender, uint8 pType, uint8 concentration, uint8 rarity, string[] topNotes, string[] heartNotes, string[] baseNotes, address creator, uint256 createdAt))"
];

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
  const [status, setStatus] = useState("Initializing...");
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    async function fetchGallery() {
      try {
        setStatus("Connecting to Arc Network...");
        const signer = await getArcSigner();
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, GALLERY_ABI, signer.provider);

        const results: GalleryItem[] = [];
        const BATCH_SIZE = 5; // Reduced batch size for better stability
        const MAX_ID = 100;   // Start small to test connectivity

        setStatus(`Scanning IDs 1-${MAX_ID}...`);

        for (let start = 1; start <= MAX_ID; start += BATCH_SIZE) {
          const end = Math.min(start + BATCH_SIZE - 1, MAX_ID);
          setStatus(`Checking IDs ${start}-${end}...`);
          
          const batchPromises = [];
          for (let id = start; id <= end; id++) {
            batchPromises.push(
              contract.getPerfume(id)
                .then((p: any) => {
                  // Log first successful response to console for debugging
                  if (id === 1 && p) console.log("First NFT Data:", p); 
                  
                  return (p && p.name) 
                    ? { tokenId: id, name: p.name, rarity: Number(p.rarity) } 
                    : null;
                })
                .catch((err) => {
                  console.warn(`Error fetching ID ${id}:`, err.message);
                  return null;
                })
            );
          }

          const batchResults = await Promise.all(batchPromises);
          const valid = batchResults.filter((r): r is GalleryItem => r !== null);
          
          if (valid.length > 0) {
            results.push(...valid);
            setDebugInfo(`Found ${results.length} scents so far.`);
          }
        }

        setItems(results.reverse());
        setStatus(results.length > 0 ? "Done!" : "Scan complete. No items found in range.");
      } catch (e: any) {
        console.error("Critical Gallery Error:", e);
        setStatus(`Error: ${e.message || "Unknown RPC error"}`);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-16 px-4 relative z-10">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent">Gallery</h1>
      
      {/* Diagnostic Status Bar */}
      <div className="mb-8 p-4 rounded-lg bg-black/40 border border-white/10 font-mono text-sm">
        <p className="text-amber-400">Status: {status}</p>
        {debugInfo && <p className="text-emerald-400 mt-1">{debugInfo}</p>}
        <p className="text-white/40 text-xs mt-2">Contract: {NFT_CONTRACT_ADDRESS.slice(0,10)}...</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-card-luxury h-40 animate-pulse rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card-luxury rounded-2xl p-8">
          <p>No fragrances found in scanned range (1-100).</p>
          <p className="text-xs mt-2">Check console (F12) for RPC errors.</p>
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
