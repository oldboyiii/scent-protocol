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

interface ShareCardProps {
  tokenId: number;
  perfume: Perfume;
  contractAddress?: string; // NEW: To detect Viral scents
}

const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];
const RARITY = ["Common", "Rare", "Epic", "Legendary"];

const RARITY_HEX: Record<number, string> = {
  0: "#94a3b8", // Slate
  1: "#60a5fa", // Blue
  2: "#c084fc", // Purple
  3: "#fbbf24", // Amber/Gold
};

const RARITY_BG: Record<number, string> = {
  0: "#0f172a",
  1: "#0c1222",
  2: "#110c22",
  3: "#1a1005",
};

export default function ShareCard({ tokenId, perfume, contractAddress }: ShareCardProps) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rarityHex = RARITY_HEX[perfume.rarity] || RARITY_HEX[0];
  const rarityBg = RARITY_BG[perfume.rarity] || RARITY_BG[0];
  const isViral = contractAddress === "0x5b2835bcd2fB197Ea68b9C9cc52F6Fc267bc65bb";
  const url = `https://scentprotocol.io/nft/${tokenId}`; // Updated to your actual domain if different

  const collectionName = isViral ? "Viral Scent" : "ScentProtocol";
  
  const tweetText = encodeURIComponent(
    `🧪 ${perfume.name} — ${isViral ? "Viral " : ""}Digital Perfume NFT #${tokenId}\n\n` +
    `⚲ ${GENDER[perfume.gender]} · ${TYPE[perfume.pType]} · ${perfume.concentration}% · ${RARITY[perfume.rarity]}\n\n` +
    `Top: ${perfume.topNotes.join(", ")}\n` +
    `Heart: ${perfume.heartNotes.join(", ")}\n` +
    `Base: ${perfume.baseNotes.join(", ")}\n\n` +
    `Created with AI on @Scent_Protocol — the first digital perfume house on Arc.\n\n` +
    `Mint yours →`
  );
  
  const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`;

  const copyText =
    `🧪 ${perfume.name} — ${isViral ? "Viral " : ""}Digital Perfume NFT #${tokenId}\n\n` +
    `⚲ ${GENDER[perfume.gender]} · ${TYPE[perfume.pType]} · ${perfume.concentration}% · ${RARITY[perfume.rarity]}\n\n` +
    `Top: ${perfume.topNotes.join(", ")}\n` +
    `Heart: ${perfume.heartNotes.join(", ")}\n` +
    `Base: ${perfume.baseNotes.join(", ")}\n\n` +
    `Created with AI on ScentProtocol. Mint yours → ${url}`;

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    // 1. Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, rarityBg);
    grad.addColorStop(1, "#050510");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 2. Outer Glow Border
    ctx.shadowColor = rarityHex;
    ctx.shadowBlur = 60;
    ctx.strokeStyle = rarityHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.shadowBlur = 0; // Reset shadow

    // 3. Inner Glass Panel
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(30, 30, W - 60, H - 60);
    
    // Inner border
    ctx.strokeStyle = `${rarityHex}40`;
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    // 4. Brand & Collection
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px 'Segoe UI', sans-serif";
    ctx.fillText("ScentProtocol", 80, 100);
    ctx.fillStyle = rarityHex;
    ctx.font = "bold 24px 'Segoe UI', sans-serif";
    ctx.fillText(isViral ? "VIRAL EXPERIMENT" : "BUILT ON ARC", 80, 135);

    // 5. Faux Crest (Circle with Initials)
    const initials = perfume.name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "SP";
    
    const crestX = W - 160;
    const crestY = 110;
    const crestR = 55;

    // Crest bg
    ctx.beginPath();
    ctx.arc(crestX, crestY, crestR, 0, 2 * Math.PI);
    ctx.fillStyle = `${rarityHex}15`;
    ctx.fill();
    // Crest border
    ctx.strokeStyle = rarityHex;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Crest inner dashed line
    ctx.beginPath();
    ctx.arc(crestX, crestY, crestR - 8, 0, 2 * Math.PI);
    ctx.strokeStyle = `${rarityHex}60`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
    // Crest Initials
    ctx.fillStyle = rarityHex;
    ctx.font = "bold 42px 'Segoe UI', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, crestX, crestY + 2);
    
    // Reset alignment for rest of text
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // 6. Token ID & Name
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "bold 28px 'Segoe UI', sans-serif";
    ctx.fillText(`${isViral ? "VIRAL" : "SCENT"} #${tokenId}`, 80, 210);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px 'Segoe UI', sans-serif";
    ctx.fillText(perfume.name, 80, 290);

    // 7. Tags
    ctx.font = "bold 32px 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const tags = `${GENDER[perfume.gender]}  ·  ${TYPE[perfume.pType]}  ·  ${perfume.concentration}%  ·  ${RARITY[perfume.rarity]}`;
    ctx.fillText(tags, 80, 350);

    // 8. Divider with glow
    ctx.shadowColor = rarityHex;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = rarityHex;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 390);
    ctx.lineTo(W - 80, 390);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 9. Notes Pyramid
    ctx.fillStyle = rarityHex;
    ctx.font = "bold 26px 'Segoe UI', sans-serif";
    ctx.fillText("PYRAMID OF NOTES", 80, 440);

    ctx.font = "28px 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    
    // Helper to draw notes with colored labels
    const drawNote = (label: string, notes: string[], y: number) => {
      ctx.fillStyle = rarityHex;
      ctx.font = "bold 28px 'Segoe UI', sans-serif";
      ctx.fillText(`${label}:`, 80, y);
      
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "28px 'Segoe UI', sans-serif";
      ctx.fillText(notes.join(", "), 260, y);
    };

    drawNote("Top", perfume.topNotes, 490);
    drawNote("Heart", perfume.heartNotes, 540);
    drawNote("Base", perfume.baseNotes, 590);

    // 10. Footer URL
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "24px 'Segoe UI', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(url, W - 80, H - 50);

    return canvas.toDataURL("image/png");
  }, [perfume, tokenId, rarityHex, rarityBg, url, isViral]);

  const handleDownload = () => {
    const dataUrl = drawCard();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `scent-${tokenId}-${perfume.name.replace(/\s+/g, '-').toLowerCase()}.png`;
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
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative rounded-2xl p-6 max-w-sm w-full space-y-5 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${rarityHex}15 0%, ${rarityHex}05 50%, #0f172a 100%)`,
              border: `1px solid ${rarityHex}50`,
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
                padding: "1px",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            <h3 className="relative text-lg font-bold text-white text-center">Share Your Scent</h3>

            {/* Preview card */}
            <div
              className="relative rounded-xl p-5 overflow-hidden backdrop-blur-md"
              style={{
                background: `linear-gradient(135deg, ${rarityHex}10 0%, transparent 60%)`,
                border: `1px solid ${rarityHex}40`,
              }}
            >
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(105deg, transparent 40%, ${rarityHex}15 50%, transparent 60%)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.5s infinite",
                }}
              />
              <p className="relative text-white/50 text-[10px] uppercase tracking-widest mb-1">
                {isViral ? "VIRAL" : "SCENT"} #{tokenId}
              </p>
              <h4 className="relative text-xl font-bold text-white mb-3">{perfume.name}</h4>
              <div className="relative flex flex-wrap gap-2 text-[10px] font-semibold text-white/80 mb-3">
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{GENDER[perfume.gender]}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{TYPE[perfume.pType]}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{perfume.concentration}%</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10" style={{ color: rarityHex, borderColor: `${rarityHex}40` }}>
                  {RARITY[perfume.rarity]}
                </span>
              </div>
              <div className="relative text-xs text-white/60 space-y-1 font-mono">
                <p><span style={{ color: rarityHex }}>Top:</span> {perfume.topNotes.join(", ")}</p>
                <p><span style={{ color: rarityHex }}>Heart:</span> {perfume.heartNotes.join(", ")}</p>
                <p><span style={{ color: rarityHex }}>Base:</span> {perfume.baseNotes.join(", ")}</p>
              </div>
            </div>

            {/* Action Buttons */}
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
              className="relative w-full text-xs text-white/40 hover:text-white/70 transition-colors mt-2"
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
