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

const RARITY_BG: Record<number, string> = {
  0: "#0f172a",
  1: "#0c1222",
  2: "#110c22",
  3: "#1a1005",
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
  const rarityBg = RARITY_BG[perfume.rarity] || RARITY_BG[0];
  const url = `https://scentprotocol.vercel.app/nft/${tokenId}`;

  const tweetText = encodeURIComponent(
    `🧪 ${perfume.name} — Digital Perfume NFT #${tokenId}\n\n` +
      `⚲ ${GENDER[perfume.gender]} · ${TYPE[perfume.pType]} · ${perfume.concentration}% · ${RARITY[perfume.rarity]}\n\n` +
      `Top: ${perfume.topNotes.join(", ")}\n` +
      `Heart: ${perfume.heartNotes.join(", ")}\n` +
      `Base: ${perfume.baseNotes.join(", ")}\n\n` +
      `Created with AI on ScentProtocol — the first digital perfume house on Arc. Every scent is a unique NFT with an on-chain formula.\n\n` +
      `Mint yours →`
  );
  
  const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`;

  const copyText =
    `🧪 ${perfume.name} — Digital Perfume NFT #${tokenId}\n\n` +
    `⚲ ${GENDER[perfume.gender]} · ${TYPE[perfume.pType]} · ${perfume.concentration}% · ${RARITY[perfume.rarity]}\n\n` +
    `Top: ${perfume.topNotes.join(", ")}\n` +
    `Heart: ${perfume.heartNotes.join(", ")}\n` +
    `Base: ${perfume.baseNotes.join(", ")}\n\n` +
    `Created with AI on ScentProtocol — the first digital perfume house on Arc. Every scent is a unique NFT with an on-chain formula.\n\n` +
    `Mint yours → ${url}`;

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
    grad.addColorStop(0, rarityBg);
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Animated border glow
    ctx.shadowColor = rarityHex;
    ctx.shadowBlur = 80;
    ctx.strokeStyle = rarityHex;
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.shadowBlur = 0;

    // Inner card
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.fillRect(36, 36, W - 72, H - 72);

    // Shimmer line
    const shimmerGrad = ctx.createLinearGradient(0, 0, W, H);
    shimmerGrad.addColorStop(0, "transparent");
    shimmerGrad.addColorStop(0.5, `${rarityHex}20`);
    shimmerGrad.addColorStop(1, "transparent");
    ctx.fillStyle = shimmerGrad;
    ctx.fillRect(36, 36, W - 72, H - 72);

    // Brand
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("ScentProtocol", 80, 110);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "22px sans-serif";
    ctx.fillText("Built on Arc", 80, 140);

    // Token ID
    ctx.fillStyle = rarityHex;
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(`SCENT #${tokenId}`, 80, 200);

    // Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 80px sans-serif";
    ctx.fillText(perfume.name, 80, 300);

    // Tags
    ctx.font = "30px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const tags = `${GENDER[perfume.gender]}  ·  ${TYPE[perfume.pType]}  ·  ${perfume.concentration}%  ·  ${RARITY[perfume.rarity]}`;
    ctx.fillText(tags, 80, 360);

    // Divider with glow
    ctx.shadowColor = rarityHex;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = rarityHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 400);
    ctx.lineTo(W - 80, 400);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Notes
    ctx.font = "bold 28px sans-serif";
    ctx.fillStyle = rarityHex;
    ctx.fillText("PYRAMID OF NOTES", 80, 450);

    ctx.font = "26px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText(`Top:     ${perfume.topNotes.join(", ")}`, 80, 495);
    ctx.fillText(`Heart:   ${perfume.heartNotes.join(", ")}`, 80, 535);
    ctx.fillText(`Base:    ${perfume.baseNotes.join(", ")}`, 80, 575);

    // URL
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(url, W - 80, H - 60);
    ctx.textAlign = "left";

    return canvas.toDataURL("image/png");
  }, [perfume, tokenId, rarityHex, rarityBg, url]);

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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative rounded-2xl p-6 max-w-sm w-full space-y-5 overflow-hidden"
            style={{
              background: `linear-gradient(145deg, ${rarityBg} 0%, #0f172a 100%)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated border */}
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: `linear-gradient(90deg, ${rarityHex}40, ${rarityHex}, ${rarityHex}40)`,
                backgroundSize: "200% 100%",
                animation: "shimmer-border 3s linear infinite",
                padding: "2px",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            {/* Inner glow */}
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none opacity-30"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${rarityHex}30, transparent 70%)`,
              }}
            />

            <h3 className="relative text-lg font-bold text-white">Share Your Scent</h3>

            {/* Preview card */}
            <div
              className="relative rounded-xl p-5 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${rarityHex}15 0%, transparent 60%)`,
                border: `1px solid ${rarityHex}50`,
              }}
            >
              {/* Shimmer overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(105deg, transparent 40%, ${rarityHex}10 50%, transparent 60%)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.5s infinite",
                }}
              />
              <p className="relative text-white/60 text-xs uppercase tracking-wider mb-1">Scent #{tokenId}</p>
              <h4 className="relative text-xl font-bold text-white mb-3">{perfume.name}</h4>
              <div className="relative flex flex-wrap gap-2 text-xs text-white/80">
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">{GENDER[perfume.gender]}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">{TYPE[perfume.pType]}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">{perfume.concentration}%</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">{RARITY[perfume.rarity]}</span>
              </div>
              <div className="relative mt-3 text-xs text-white/70 space-y-0.5">
                <p>Top: {perfume.topNotes.join(", ")}</p>
                <p>Heart: {perfume.heartNotes.join(", ")}</p>
                <p>Base: {perfume.baseNotes.join(", ")}</p>
              </div>
            </div>

            {/* Action Buttons - Clean SVG icons, no emojis */}
            <div className="relative grid grid-cols-2 gap-3">
              <button
                onClick={handleTweet}
                className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white text-sm font-semibold transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Post on X
              </button>
              <button
                onClick={handleDownload}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save PNG
              </button>
              <button
                onClick={handleCopy}
                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors col-span-2 border border-white/10 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Text
              </button>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="relative w-full text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Close
            </button>

            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
              @keyframes shimmer-border {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}
    </>
  );
}
