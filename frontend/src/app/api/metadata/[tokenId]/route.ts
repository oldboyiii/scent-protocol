import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.arc.network";

const ABI = [
  "function getPerfume(uint256 tokenId) external view returns (tuple(string name,uint8 gender,uint8 pType,string[3] topNotes,string[3] heartNotes,string[3] baseNotes,uint8 concentration,uint8 rarity,uint256 createdAt,address creator))",
];

export async function GET(
  req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  const tokenId = parseInt(params.tokenId);

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const perfume = await contract.getPerfume(tokenId);

    const svg = generateSVG(perfume, tokenId);
    const svgBase64 = Buffer.from(svg).toString("base64");

    const metadata = {
      name: perfume.name,
      description: `A unique ${["unisex", "male", "female"][perfume.gender]} fragrance. Top: ${perfume.topNotes.join(", ")}. Heart: ${perfume.heartNotes.join(", ")}. Base: ${perfume.baseNotes.join(", ")}.`,
      image: `data:image/svg+xml;base64,${svgBase64}`,
      attributes: [
        { trait_type: "Gender", value: ["Unisex", "Male", "Female"][perfume.gender] },
        { trait_type: "Type", value: ["Parfum", "EDP", "EDT", "EDC"][perfume.pType] },
        { trait_type: "Rarity", value: ["Common", "Rare", "Epic", "Legendary"][perfume.rarity] },
        { trait_type: "Concentration", value: `${perfume.concentration}%` },
      ],
    };

    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

function generateSVG(perfume: any, tokenId: number): string {
  const colors = [
    ["#2c3e50", "#8e44ad"],
    ["#0f2027", "#2c5364"],
    ["#200122", "#6f0000"],
  ];
  const [c1, c2] = colors[perfume.gender] || colors[0];

  const rarityColors = ["#95a5a6", "#3498db", "#9b59b6", "#f1c40f"];
  const rarityColor = rarityColors[perfume.rarity] || rarityColors[0];
  const rarityText = ["COMMON", "RARE", "EPIC", "LEGENDARY"][perfume.rarity] || "COMMON";

  const genderText = ["Unisex", "Male", "Female"][perfume.gender];
  const typeText = ["Parfum", "EDP", "EDT", "EDC"][perfume.pType];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect x="20" y="20" width="460" height="460" rx="20" fill="none" stroke="${rarityColor}" stroke-width="3"/>
    <text x="250" y="80" text-anchor="middle" fill="#d4af37" font-size="32" font-family="Georgia,serif" filter="url(#glow)">${perfume.name}</text>
    <text x="250" y="120" text-anchor="middle" fill="#fff" font-size="14" font-family="sans-serif" opacity="0.8">#${tokenId} • ${genderText} • ${typeText}</text>
    <text x="60" y="180" fill="#2ecc71" font-size="12" font-family="sans-serif" font-weight="bold">TOP NOTES</text>
    <text x="60" y="205" fill="#fff" font-size="14" font-family="sans-serif">${perfume.topNotes.join(" • ")}</text>
    <text x="60" y="250" fill="#e74c3c" font-size="12" font-family="sans-serif" font-weight="bold">HEART NOTES</text>
    <text x="60" y="275" fill="#fff" font-size="14" font-family="sans-serif">${perfume.heartNotes.join(" • ")}</text>
    <text x="60" y="320" fill="#f39c12" font-size="12" font-family="sans-serif" font-weight="bold">BASE NOTES</text>
    <text x="60" y="345" fill="#fff" font-size="14" font-family="sans-serif">${perfume.baseNotes.join(" • ")}</text>
    <text x="250" y="430" text-anchor="middle" fill="${rarityColor}" font-size="20" font-family="sans-serif" font-weight="bold" letter-spacing="3">${rarityText}</text>
    <text x="250" y="460" text-anchor="middle" fill="#fff" font-size="10" font-family="sans-serif" opacity="0.5">Built on Arc • ScentProtocol</text>
  </svg>`;
}
