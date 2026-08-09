"use client";

import { useState } from "react";
import { ethers } from "ethers";
import {
  getContract,
  getUSDCContract,
  CONTRACT_ADDRESS,
  PerfumeData,
} from "@/utils/contract";

export default function MintForm({ onMinted }: { onMinted: (tokenId: number, perfume: PerfumeData, desc: string) => void }) {
  const [gender, setGender] = useState(0);
  const [pType, setPType] = useState(2);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");

  const mint = async () => {
    const w = window as any;
    if (!w.ethereum) {
      alert("Connect MetaMask first");
      return;
    }

    setLoading(true);
    setStep("Getting signer...");

    try {
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const contract = getContract(signer);
      const usdc = getUSDCContract(signer);

      const mintPrice = await contract.mintPrice();
      setStep("Checking USDC allowance...");

      const allowance = await usdc.allowance(userAddress, CONTRACT_ADDRESS);
      if (allowance < mintPrice) {
        setStep("Approving USDC...");
        const tx = await usdc.approve(CONTRACT_ADDRESS, mintPrice * BigInt(100));
        await tx.wait();
      }

      setStep("Minting perfume...");
      const tx = await contract.createPerfume(gender, pType);
      const receipt = await tx.wait();

      let tokenId = 0;

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) continue;
        try {
          const parsed = contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          });
          if (parsed && parsed.name === "PerfumeCreated") {
            const tid = parsed.args.tokenId ?? parsed.args[0];
            tokenId = Number(tid);
            break;
          }
        } catch {}
      }

      if (tokenId === 0) {
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) continue;
          try {
            const parsed = contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
            if (parsed && parsed.name === "Transfer") {
              const from = parsed.args.from ?? parsed.args[0];
              const tid = parsed.args.tokenId ?? parsed.args[2];
              if (from === "0x0000000000000000000000000000000000000000") {
                tokenId = Number(tid);
                break;
              }
            }
          } catch {}
        }
      }

      if (tokenId === 0) throw new Error("TokenId not found in transaction logs");

      setStep("Fetching perfume data...");
      const rawPerfume = await contract.getPerfume(tokenId);
      const perfume: PerfumeData = {
        name: rawPerfume.name,
        gender: Number(rawPerfume.gender),
        pType: Number(rawPerfume.pType),
        topNotes: [...rawPerfume.topNotes],
        heartNotes: [...rawPerfume.heartNotes],
        baseNotes: [...rawPerfume.baseNotes],
        concentration: Number(rawPerfume.concentration),
        rarity: Number(rawPerfume.rarity),
        createdAt: Number(rawPerfume.createdAt),
        creator: rawPerfume.creator,
      };

      setStep("Crafting description...");
      const desc = generateDescription(perfume);

      onMinted(tokenId, perfume, desc);
      setStep("Done!");
    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.reason || error.message));
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  function generateDescription(perfume: PerfumeData): string {
    const genderText = ["unisex", "masculine", "feminine"][perfume.gender] || "unisex";
    const typeText = ["Parfum", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne"][perfume.pType] || "fragrance";
    const rarityText = ["a classic", "a rare", "an epic", "a legendary"][perfume.rarity] || "a unique";

    const top = perfume.topNotes.join(", ");
    const heart = perfume.heartNotes.join(", ");
    const base = perfume.baseNotes.join(", ");

    const openings = [
      `A ${genderText} ${typeText.toLowerCase()} that opens with a burst of ${top}.`,
      `This ${genderText} creation greets you with ${top}.`,
      `The journey begins with ${top}, unfolding into something extraordinary.`,
    ];

    const hearts = [
      `The heart reveals ${heart}, creating a warm and inviting aura.`,
      `At its core, ${heart} weave an unforgettable melody.`,
      `The soul of this scent lies in ${heart}.`,
    ];

    const bases = [
      `It settles into ${base}, leaving a lasting impression.`,
      `The dry-down of ${base} ensures hours of elegance.`,
      `Finally, ${base} anchor the composition with depth and sophistication.`,
    ];

    const rarityPhrases = [
      "A timeless everyday companion.",
      "A collector's piece for the discerning nose.",
      "A masterpiece of perfumery, rarely encountered.",
      "A once-in-a-lifetime fragrance, forged in digital gold.",
    ];

    const seed = perfume.name.length + perfume.concentration;
    const open = openings[seed % openings.length];
    const heartLine = hearts[(seed + 1) % hearts.length];
    const baseLine = bases[(seed + 2) % bases.length];
    const rarityLine = rarityPhrases[perfume.rarity];

    return `${open} ${heartLine} ${baseLine} ${rarityLine} Concentration: ${perfume.concentration}%.`;
  }

  return (
    <div className="glass-card p-8 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Your Scent</h2>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm text-white/60 mb-2">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {["Unisex", "Male", "Female"].map((g, i) => (
              <button
                key={i}
                onClick={() => setGender(i)}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  gender === i
                    ? "bg-arc-600 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Parfum", desc: "20-30%" },
              { label: "EDP", desc: "15-20%" },
              { label: "EDT", desc: "10-15%" },
              { label: "EDC", desc: "5-10%" },
            ].map((t, i) => (
              <button
                key={i}
                onClick={() => setPType(i)}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  pType === i
                    ? "bg-arc-600 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <div>{t.label}</div>
                <div className="text-xs opacity-60">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={mint}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? step || "Processing..." : "Create for 10 USDC"}
      </button>

      <p className="text-xs text-white/40 text-center mt-4">
        Gas in USDC • Finality &lt;1 sec • Built on Arc
      </p>
    </div>
  );
}
