"use client";

import { useState, useRef, useCallback } from "react";

interface Perfume {
  name: string;
  gender: number;
  pType: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  concentration: number;
  rarity: number;
}

const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];
const RARITY = ["Common", "Rare", "Epic", "Legendary"];

const RARITY_HEX: Record<number, string> = {
  0: "#94a3b8",
  1: "#60a5fa",
  2: "#c084fc",
  3: "#fbbf24",
};

export default function ShareCard({
  tokenId,
  perfume,
}: {
  tokenId: number;
  perfume: Perfume;
}) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rarityHex = RARITY_HEX[perfume.rarity] || RARITY_HEX[0];
  const url = `https://scentprotocol.vercel.app/nft/${tokenId}`;

  const tweetText = encodeURIComponent(
    `🧪 ${perfume.name} — Scent #${tokenId}

` +
      `⚲ ${GENDER[perfume.gender]} · ${TYPE[perfume.pType]} · ${perfume.concentration}% · ${RARITY[perfume.rarity]}

` +
      `Top: ${perfume.topNotes.join(", ")}
` +
      `Heart: ${perfume.heartNotes.join(", ")}
` +
      `Base: ${perfume.baseNotes.join(", ")}

` +
      `Minted on ScentProtocol | Built on Arc 🌐`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`;

  const copyText =
    `🧪 ${perfume.name} — Scent #${tokenId}

` +
    `⚲ ${GENDER[perfume.gender]} · ${TYPE[perfume.pType]} · ${perfume.concentration}% · ${RARITY[perfume.rarity]}

` +
    `Top: ${perfume.topNotes.join(", ")}
` +
    `Heart: ${perfume.heartNotes.join(", ")}
` +
    `Base: ${perfume.baseNotes.join(", ")}

` +
    `Minted on ScentProtocol | Built on Arc
${url}`;

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Accent border glow
    ctx.shadowColor = rarityHex;
    ctx.shadowBlur = 60;
    ctx.strokeStyle = rarityHex;
    ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.shadowBlur = 0;

    // Inner card
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(40, 40, W - 80, H - 80);

    // Brand
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("🜂 ScentProtocol", 80, 100);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "20px sans-serif";
    ctx.fillText("Built on Arc", 80, 130);

    // Token ID
    ctx.fillStyle = rarityHex;
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(`SCENT #${tokenId}`, 80, 190);

    // Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px sans-serif";
    ctx.fillText(perfume.name, 80, 280);

    // Tags
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const tags = `${GENDER[perfume.gender]}  ·  ${TYPE[perfume.pType]}  ·  ${perfume.concentration}%  ·  ${RARITY[perfume.rarity]}`;
    ctx.fillText(tags, 80, 340);

    // Divider
    ctx.strokeStyle = rarityHex;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 380);
    ctx.lineTo(W - 80, 380);
    ctx.stroke();

    // Notes
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = rarityHex;
    ctx.fillText("PYRAMID OF NOTES", 80, 430);

    ctx.font = "24px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(`Top:     ${perfume.topNotes.join(", ")}`, 80, 475);
    ctx.fillText(`Heart:   ${perfume.heartNotes.join(", ")}`, 80, 515);
    ctx.fillText(`Base:    ${perfume.baseNotes.join(", ")}`, 80, 555);

    // URL
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(url, W - 80, H - 60);
    ctx.textAlign = "left";

    return canvas.toDataURL("image/png");
  }, [perfume, tokenId, rarityHex, url]);

  const handleDownload = () => {
    const dataUrl = drawCard();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `scent-${tokenId}.png`;
    link.click();
    setOpen(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyText);
    setOpen(false);
  };

  const handleTweet = () => {
    window.open(tweetUrl, "_blank", "width=600,height=400");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-white/50 hover:text-white transition-colors underline underline-offset-2"
      >
        Share Card
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="rounded-2xl p-6 max-w-sm w-full space-y-5"
            style={{
              background: "linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)",
              border: `2px solid ${rarityHex}60`,
              boxShadow: `0 0 40px ${rarityHex}30`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">Share Your Scent</h3>

            {/* Preview card */}
            <div
              className="rounded-xl p-5"
              style={{
                background: `linear-gradient(135deg, ${rarityHex}20 0%, transparent 100%)`,
                border: `1px solid ${rarityHex}40`,
              }}
            >
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Scent #{tokenId}</p>
              <h4 className="text-xl font-bold text-white mb-3">{perfume.name}</h4>
              <div className="flex flex-wrap gap-2 text-xs text-white/80">
                <span className="px-2 py-0.5 rounded-full bg-white/10">{GENDER[perfume.gender]}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10">{TYPE[perfume.pType]}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10">{perfume.concentration}%</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10">{RARITY[perfume.rarity]}</span>
              </div>
              <div className="mt-3 text-xs text-white/70 space-y-0.5">
                <p>Top: {perfume.topNotes.join(", ")}</p>
                <p>Heart: {perfume.heartNotes.join(", ")}</p>
                <p>Base: {perfume.baseNotes.join(", ")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleTweet}
                className="py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors"
              >
                🐦 Tweet
              </button>
              <button
                onClick={handleDownload}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors"
              >
                🖼️ Save PNG
              </button>
              <button
                onClick={handleCopy}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors col-span-2"
              >
                📋 Copy Text
              </button>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Close
            </button>
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}
    </>
  );
}
