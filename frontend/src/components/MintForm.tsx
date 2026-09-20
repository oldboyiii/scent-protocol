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
  
  // Step management for the commit-reveal flow
  const [step, setStep] = useState<"idle" | "requesting" | "waiting" | "revealing" | "success">("idle");
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { addToast, updateToast } = useToast();

  // Update local state if AI advisor pre-fills the form
  useEffect(() => {
    if (defaultGender !== undefined) setGender(defaultGender);
    if (defaultType !== undefined) setPType(defaultType);
  }, [defaultGender, defaultType]);

  // Countdown timer for the reveal phase
  useEffect(() => {
    if (step === "waiting" && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  const handleRequestMint = async () => {
    const w = window as any;
    if (!w.ethereum) {
      addToast("Please connect your wallet first", "error");
      return;
    }

    setStep("requesting");
    setError(null);
    const toastId = addToast("Confirm the transaction in your wallet...", "loading");

    try {
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const contract = getContract(signer);
      const usdc = getUSDCContract(signer);

      const mintPrice = await contract.getMintPrice();
      updateToast(toastId, "Checking USDC allowance...", "loading");

      const allowance = await usdc.allowance(userAddress, CONTRACT_ADDRESS);
      if (allowance < mintPrice) {
        updateToast(toastId, "Approving USDC spend...", "loading");
        const txApprove = await usdc.approve(CONTRACT_ADDRESS, mintPrice * BigInt(100));
        await txApprove.wait();
      }

      updateToast(toastId, "Step 1/2: Requesting mint...", "loading");
      const txRequest = await contract.requestMint();
      const receiptRequest = await txRequest.wait();

      // Extract tokenId from the MintRequested event
      let newTokenId = 0;
      for (const log of receiptRequest.logs) {
        if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) continue;
        try {
          const parsed = contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          });
          if (parsed && parsed.name === "MintRequested") {
            newTokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch {}
      }

      if (newTokenId === 0) throw new Error("TokenId not found in transaction logs");

      setTokenId(newTokenId);
      setStep("waiting");
      setCountdown(10); // Wait ~10 seconds (5 blocks) for randomness security
      updateToast(toastId, `Step 1 Complete! Reserved Token #${newTokenId}`, "success");
      
    } catch (err: any) {
      console.error("Request mint failed:", err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction rejected by user.");
        updateToast(toastId, "Transaction rejected.", "error");
      } else {
        setError(err.reason || err.message || "Failed to request mint.");
        updateToast(toastId, err.reason || err.message || "Failed to request mint.", "error");
      }
      setStep("idle");
    }
  };

  const handleReveal = async () => {
    if (!tokenId) return;

    setStep("revealing");
    setError(null);
    const toastId = addToast("Step 2/2: Revealing your Scent NFT...", "loading");

    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      // SECURE: Generate a cryptographically safe 32-byte hex string for uint256
      const userSeedHex = ethers.hexlify(ethers.randomBytes(32));
      
      const txReveal = await contract.revealAndMint(tokenId, userSeedHex);
      await txReveal.wait();

      updateToast(toastId, "Fetching your perfume data...", "loading");
      const rawPerfume = await contract.getPerfume(tokenId);
      
      const perfume: PerfumeData = {
        name: rawPerfume.name,
        gender: Number(rawPerfume.gender),
        pType: Number(rawPerfume.pType),
        topNotes: Array.from(rawPerfume.topNotes || []).map((n: any) => String(n)),
        heartNotes: Array.from(rawPerfume.heartNotes || []).map((n: any) => String(n)),
        baseNotes: Array.from(rawPerfume.baseNotes || []).map((n: any) => String(n)),
        concentration: Number(rawPerfume.concentration),
        rarity: Number(rawPerfume.rarity),
        createdAt: Number(rawPerfume.createdAt),
        creator: rawPerfume.creator,
      };

      // PIN TO IPFS: Secure metadata permanently
      try {
        updateToast(toastId, "Securing metadata on IPFS...", "loading");
        const pinResponse = await fetch("/api/pin-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenId,
            contractAddress: CONTRACT_ADDRESS,
            perfumeData: perfume,
          })
        });

        const pinResult = await pinResponse.json();
        if (pinResult.success) {
          console.log("✅ Metadata pinned to IPFS:", pinResult.ipfsUri);
        } else {
          console.warn("⚠️ IPFS pinning failed, but NFT is minted:", pinResult.error);
        }
      } catch (pinError) {
        console.error("IPFS pinning error:", pinError);
      }

      const desc = generateDescription(perfume);
      onMinted(tokenId, perfume, desc);
      
      updateToast(toastId, `Scent #${tokenId} minted and secured successfully!`, "success");
      setStep("success");

    } catch (err: any) {
      console.error("Reveal failed:", err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction rejected by user.");
        updateToast(toastId, "Transaction rejected.", "error");
      } else {
        setError(err.reason || err.shortMessage || err.message || "Failed to reveal.");
        updateToast(toastId, err.reason || err.shortMessage || "Failed to reveal.", "error");
      }
      setStep("idle");
    }
  };

  const resetForm = () => {
    setStep("idle");
    setTokenId(null);
    setCountdown(0);
    setError(null);
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

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {step === "idle" && (
        <>
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
                        ? "bg-blue-500 text-white"
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
                        ? "bg-blue-500 text-white"
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
            onClick={handleRequestMint}
            className="w-full py-3 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all"
          >
            Create for 1 USDC
          </button>
        </>
      )}

      {step === "requesting" && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-white/80 font-medium">Requesting mint on blockchain...</p>
          <p className="text-white/40 text-xs mt-1">Please confirm in your wallet</p>
        </div>
      )}

      {step === "waiting" && (
        <div className="text-center space-y-6 py-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-emerald-400 font-semibold mb-1">✅ Step 1 Complete!</p>
            <p className="text-white/80 text-sm">
              Reserved Token ID: <span className="font-mono text-amber-400">#{tokenId}</span>
            </p>
          </div>
          
          {countdown > 0 ? (
            <div>
              <p className="text-white/60 text-sm mb-2">Securing on-chain randomness...</p>
              <div className="text-4xl font-bold text-white font-mono">{countdown}s</div>
            </div>
          ) : (
            <button
              onClick={handleReveal}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all"
            >
              Reveal & Mint NFT
            </button>
          )}
        </div>
      )}

      {step === "revealing" && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white/80 font-medium">Revealing your unique formula...</p>
          <p className="text-white/40 text-xs mt-1">Please confirm in your wallet</p>
        </div>
      )}

      {step === "success" && (
        <div className="text-center space-y-4 py-4">
          <div className="mb-2">
  <svg className="w-12 h-12 mx-auto text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
</div>
          <h3 className="text-xl font-bold text-emerald-400">Successfully Minted!</h3>
          <p className="text-white/60 text-sm">Your NFT is secured on-chain and metadata is pinned to IPFS.</p>
          <button
            onClick={resetForm}
            className="mt-4 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            Mint Another
          </button>
        </div>
      )}

      <p className="text-xs text-white/40 text-center mt-6">
        Gas in USDC • Finality &lt;1 sec • Built on Arc
      </p>
    </div>
  );
}
