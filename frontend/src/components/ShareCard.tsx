"use client";

import { useState, useRef } from "react";

interface ShareCardProps {
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  concentration: number;
}

const RARITY_LABEL = ["Common", "Rare", "Epic", "Legendary"];
const RARITY_GRADIENT = [
  "from-gray-600 to-gray-900",
  "from-blue-600 to-blue-900",
  "from-purple-600 to-purple-900",
  "from-amber-600 to-amber-900",
];
const GENDER_ICON = ["⚲", "♂", "♀"];
const TYPE_LABEL = ["Parfum", "EDP", "EDT", "EDC"];

export default function ShareCard({ tokenId, name, rarity, gender, pType, topNotes, heartNotes, baseNotes, concentration }: ShareCardProps) {
  const [showModal, setShowModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!cardRef.current) return;

    // Простое копирование текста, т.к. html-to-image требует npm
    const text = `🧪 ${name} — Scent #${tokenId}

${GENDER_ICON[gender]} ${TYPE_LABEL[pType]} · ${concentration}% · ${RARITY_LABEL[rarity]}

Top: ${topNotes.join(", ")}
Heart: ${heartNotes.join(", ")}
Base: ${baseNotes.join(", ")}

Minted on ScentProtocol | Built on Arc`;

    try {
      await navigator.clipboard.writeText(text);
      alert("Card text copied! Paste anywhere.");
    } catch {
      alert(text);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        Share Card
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowModal(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* The Card */}
            <div
              ref={cardRef}
              className={`w-80 p-6 rounded-2xl bg-gradient-to-br ${RARITY_GRADIENT[rarity]} border border-white/20 shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-white/50 font-mono">SCENT #{tokenId}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                  {RARITY_LABEL[rarity]}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
              <p className="text-xs text-white/60 mb-4">
                {GENDER_ICON[gender]} {TYPE_LABEL[pType]} · {concentration}% concentration
              </p>

              <div className="space-y-2 mb-4">
                <NoteLine label="TOP" notes={topNotes} />
                <NoteLine label="HEART" notes={heartNotes} />
                <NoteLine label="BASE" notes={baseNotes} />
              </div>

              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-[10px] font-bold text-black">S</div>
                  <span className="text-[10px] text-white/40">ScentProtocol</span>
                </div>
                <span className="text-[10px] text-white/30">Built on Arc</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleShare}
                className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
              >
                Copy Text
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NoteLine({ label, notes }: { label: string; notes: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/30 w-10 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {notes.map((n, i) => (
          <span key={i} className="px-2 py-0.5 rounded bg-white/10 text-[11px] text-white/80">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
