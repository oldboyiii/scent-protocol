"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useToast } from "@/components/ToastProvider";
import {
  getContract,
  getUSDCContract,
  CONTRACT_ADDRESS,
  PerfumeData,
} from "@/utils/contract";

interface MintFormProps {
  onMinted: (tokenId: number, perfume: PerfumeData, desc: string) => void;
  defaultGender?: number;
  defaultType?: number;
}

export default function MintForm({ onMinted, defaultGender, defaultType }: MintFormProps) {
  const [gender, setGender] = useState(defaultGender ?? 0);
  const [pType, setPType] = useState(defaultType ?? 2);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultGender !== undefined) setGender(defaultGender);
    if (defaultType !== undefined) setPType(defaultType);
  }, [defaultGender, defaultType]);

  const { addToast, updateToast } = useToast();

  const mint = async () => {
    const w = window as any;
    if (!w.ethereum) {
      addToast("Please connect MetaMask first", "error");
      return;
    }

    setLoading(true);
    const toastId = addToast("Preparing transaction...", "loading");

    try {
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const contract = getContract(signer);
      const usdc = getUSDCContract(signer);

      // 1. Get mint price (will be 1_000_000n for 1 USDC with 6 decimals)
      const mintPrice = await contract.mintPrice();
      updateToast(toastId, "Checking USDC allowance...", "loading");

      // 2. Approve USDC if needed
      const allowance = await usdc.allowance(userAddress, CONTRACT_ADDRESS);
      if (allowance < mintPrice) {
        updateToast(toastId, "Approving USDC spend...", "loading");
        // Approve 100x the mint price to save gas on future mints
        const approveAmount = mintPrice * 100n;
        const txApprove = await usdc.approve(CONTRACT_ADDRESS, approveAmount);
        await txApprove.wait();
      }

      // 3. STEP 1: Request Mint (locks USDC, reserves TokenId)
      updateToast(toastId, "Step 1/2: Requesting mint...", "loading");
      const txRequest = await contract.requestMint();
      const receiptRequest = await txRequest.wait();

      // Parse TokenId from MintRequested event
      let tokenId = 0;
      for (const log of receiptRequest.logs) {
        if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) continue;
        try {
          const parsed = contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          });
          if (parsed && parsed.name === "MintRequested") {
            tokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch {}
      }

      if (tokenId === 0) throw new Error("TokenId not found in request logs");

      // 4. Wait for reveal blocks (5 blocks on Arc is ~5-10 seconds)
      updateToast(toastId, `Step 2/2: Waiting for reveal (Token #${tokenId})...`, "loading");
      await new Promise((resolve) => setTimeout(resolve, 12000)); // Wait 12 seconds to be safe

      // 5. STEP 2: Reveal and Mint
      updateToast(toastId, "Revealing your Scent NFT...", "loading");
      const userSeed = BigInt(Math.floor(Math.random() * 1000000000)); // Random seed for fairness
      const txReveal = await contract.revealAndMint(tokenId, userSeed);
      await txReveal.wait();

      // 6. Fetch perfume data
      updateToast(toastId, "Fetching your perfume data...", "loading");
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

      const desc = generateDescription(perfume);

      onMinted(tokenId, perfume, desc);
      updateToast(toastId, `Scent #${tokenId} minted successfully!`, "success");
    } catch (error: any) {
      console.error(error);
      let errorMsg = "Transaction failed. Please try again.";
      if (error?.reason) errorMsg = error.reason;
      else if (error?.message) errorMsg = error.message;
      else if (error?.data?.message) errorMsg = error.data.message;
      
      updateToast(toastId, errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  function generateDescription(perfume: PerfumeData): string {
    const genderText = ["unisex", "masculine", "feminine"][perfume.gender] || "unisex";
    const typeText = ["Parfum", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne"][perfume.pType] || "fragrance";

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
    const baseLine = bases[(seed + 2) % hearts.length];
    const rarityLine = rarityPhrases[perfume.rarity];

    return `${open} ${heartLine} ${baseLine} ${rarityLine} Concentration: ${perfume.concentration}%.`;
  }

  return (
    <div className="glass-card p-8 max-w-xl w-full">
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
                    ? "bg-amber-600 text-white shadow-lg"
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
                    ? "bg-amber-600 text-white shadow-lg"
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
        className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
          loading ? "animate-pulse" : ""
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : (
          "Create for 1 USDC"
        )}
      </button>

      <p className="text-xs text-white/40 text-center mt-4">
        Gas in USDC • Finality &lt;1 sec • Built on Arc
      </p>
    </div>
  );
}
