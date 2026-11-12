"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useToast } from "@/components/ToastProvider";
import { MintContext } from "@/components/AIAdvisor";
import MintProgress from "@/components/wallet-scent/MintProgress";
import {
  getContract,
  getUSDCContract,
  CONTRACT_ADDRESS,
  PerfumeData,
} from "@/utils/contract";

interface MintFormProps {
  onMinted: (tokenId: number, perfume: PerfumeData, desc: string, mood?: string) => void;
  advisorContext?: MintContext;
}

export default function MintForm({ onMinted, advisorContext }: MintFormProps) {
  const [gender, setGender] = useState(advisorContext?.gender ?? 0);
  const [pType, setPType] = useState(advisorContext?.pType ?? 2);
  const [mintPrice, setMintPrice] = useState<string>("1.00");
  
  const [step, setStep] = useState<"idle" | "requesting" | "waiting" | "revealing" | "success">("idle");
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { addToast, updateToast } = useToast();

  useEffect(() => {
    if (advisorContext) {
      setGender(advisorContext.gender);
      setPType(advisorContext.pType);
    }
  }, [advisorContext]);

  // Fetch dynamic mint price on mount
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const w = window as any;
        if (w.ethereum) {
          const provider = new ethers.BrowserProvider(w.ethereum);
          const contract = getContract(provider);
          const price = await contract.getMintPrice();
          setMintPrice(ethers.formatUnits(price, 6));
        }
      } catch (e) {
        console.error("Failed to fetch mint price", e);
      }
    };
    fetchPrice();
  }, []);

  // Countdown timer for the commit-reveal delay
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

  // Step 1: Request mint (commits to minting, reserves tokenId)
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

      const currentMintPrice = await contract.getMintPrice();
      updateToast(toastId, "Checking USDC allowance...", "loading");

      const allowance = await usdc.allowance(userAddress, CONTRACT_ADDRESS);
      if (allowance < currentMintPrice) {
        updateToast(toastId, "Approving USDC spend...", "loading");
        // Approve MaxUint256 to avoid repeated approval transactions
        const txApprove = await usdc.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
        await txApprove.wait();
      }

      updateToast(toastId, "Step 1/2: Requesting mint...", "loading");
      
      // SECURE COMMIT-REVEAL: Generate seed preimage and commitment
      const seedPreimage = advisorContext?.seedString 
        ? ethers.id(advisorContext.seedString) // deterministic bytes32 from AI Advisor
        : ethers.hexlify(ethers.randomBytes(32)); // random bytes32
      
      const seedCommitment = ethers.keccak256(seedPreimage);
      
      const txRequest = await contract.requestMint(seedCommitment);
      const receiptRequest = await txRequest.wait();

      // Parse transaction logs to find the new tokenId
      let newTokenId = 0;
      for (const log of receiptRequest.logs) {
        if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) continue;
        try {
          const parsed = contract.interface.parseLog({
            topics: [...log.topics] as string[],
            data: log.data,
          });
          if (parsed && parsed.name === "MintRequested") {
            newTokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch {}
      }

      if (newTokenId === 0) throw new Error("TokenId not found in transaction logs");

      // CRITICAL: Save preimage to localStorage to survive page refreshes before reveal
      localStorage.setItem(`mint_preimage_${newTokenId}`, seedPreimage);

      setTokenId(newTokenId);
      setStep("waiting");
      setCountdown(10);
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

  // Step 2: Reveal and mint (generates the perfume using seedPreimage)
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

      // Retrieve preimage from localStorage (survives refresh)
      const storedPreimage = localStorage.getItem(`mint_preimage_${tokenId}`);
      if (!storedPreimage) {
        throw new Error("Seed preimage lost. Please restart the mint process.");
      }

      const txReveal = await contract.revealAndMint(tokenId, storedPreimage);
      await txReveal.wait();

      // Clean up localStorage after successful reveal
      localStorage.removeItem(`mint_preimage_${tokenId}`);

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

      // Pin metadata to IPFS for decentralized storage
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
      onMinted(tokenId, perfume, desc, advisorContext?.mood);
      
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

  // Generates a poetic description based on perfume data
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

  const GENDER_OPTIONS = ["Unisex", "Male", "Female"];
  const TYPE_OPTIONS = [
    { label: "Parfum", full: "Pure perfume", desc: "20-30%", note: "Richest and longest lasting" },
    { label: "EDP", full: "Eau de Parfum", desc: "15-20%", note: "Balanced strength, the classic" },
    { label: "EDT", full: "Eau de Toilette", desc: "10-15%", note: "Lighter and fresher" },
    { label: "EDC", full: "Eau de Cologne", desc: "5-10%", note: "Lightest and brightest" },
  ];
  const WAIT_SECONDS = 10;
  const chosenType = TYPE_OPTIONS[pType] ?? TYPE_OPTIONS[1];
  const choiceBase =
    "relative rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60";
  const choiceOn = "border-amber-400/70 bg-amber-400/10 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.18)]";
  const choiceOff = "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/25 hover:bg-white/[0.07]";

  return (
    <div className="glass-card relative w-full max-w-xl overflow-hidden p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

      <header className="relative mb-7 text-center">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80">Mint a fragrance</p>
        <h2 className="pb-1 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Create Your Scent</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/55">
          Nine notes, a rarity tier and a poetic description, sealed in an NFT you own.
        </p>
      </header>

      {/* Display selected mood/context from AI Advisor if available */}
      {advisorContext?.mood && (
        <div className="relative mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
          <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-amber-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
            </svg>
            From your Advisor
          </p>
          <p className="text-[15px] font-medium leading-snug text-white">{advisorContext.mood}</p>
          {advisorContext.topNotes && advisorContext.topNotes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[...advisorContext.topNotes, ...(advisorContext.heartNotes ?? []), ...(advisorContext.baseNotes ?? [])].map((n, i) => (
                <span key={`${n}-${i}`} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/75">
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="relative mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-3.5 text-center text-sm text-red-300">
          {error}
        </div>
      )}

      {step === "idle" && (
        <div className="relative">
          <div className="mb-6 space-y-6">
            <fieldset>
              <legend className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-white/45">Gender</legend>
              <div className="grid grid-cols-3 gap-2.5">
                {GENDER_OPTIONS.map((g, i) => (
                  <button key={g} type="button" aria-pressed={gender === i} onClick={() => setGender(i)}
                    className={`${choiceBase} min-h-[48px] px-3 py-3 text-center text-sm font-medium ${gender === i ? choiceOn : choiceOff}`}>
                    {g}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-white/45">Type</legend>
              <div className="grid grid-cols-2 gap-2.5">
                {TYPE_OPTIONS.map((t, i) => (
                  <button key={t.label} type="button" aria-pressed={pType === i} onClick={() => setPType(i)}
                    className={`${choiceBase} px-3.5 py-3 ${pType === i ? choiceOn : choiceOff}`}>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[15px] font-semibold">{t.label}</span>
                      <span className="text-[11px] tabular-nums text-amber-300/80">{t.desc}</span>
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-white/45">{t.note}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <p className="mb-3 text-center text-xs text-white/45">
            {GENDER_OPTIONS[gender]} <span className="text-white/25">/</span> {chosenType.full} <span className="text-white/25">/</span> {chosenType.desc}
          </p>

          <button
            type="button"
            onClick={handleRequestMint}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-amber-900/30 transition-all hover:brightness-110 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            Create for {mintPrice} USDC
          </button>
          <p className="mt-3 text-center text-xs text-white/40">Two quick confirmations: seal your scent, then open it.</p>
        </div>
      )}

      {step === "requesting" && (
        <div className="relative space-y-5 py-2">
          <MintProgress stage={1} blocksDone={0} blocksTotal={WAIT_SECONDS} accent="#fbbf24" />
          <div className="text-center">
            <p className="font-medium text-white/85">Sealing your scent on Arc</p>
            <p className="mt-1 text-xs text-white/40">Please confirm in your wallet</p>
          </div>
        </div>
      )}

      {step === "waiting" && (
        <div className="relative space-y-6 py-2">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[0.07] px-3.5 py-1.5 text-sm">
            <span className="text-white/60">Reserved</span>
            <span className="font-mono font-semibold text-amber-300">#{tokenId}</span>
          </div>

          <MintProgress stage={countdown > 0 ? 2 : 3} blocksDone={WAIT_SECONDS - countdown} blocksTotal={WAIT_SECONDS} accent="#fbbf24" />

          {countdown > 0 ? (
            <p className="text-center text-sm text-white/55">Securing on-chain randomness. This takes about {countdown}s.</p>
          ) : (
            <button
              type="button"
              onClick={handleReveal}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-amber-900/30 transition-all hover:brightness-110 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Reveal and mint
            </button>
          )}
        </div>
      )}

      {step === "revealing" && (
        <div className="relative space-y-5 py-2">
          <MintProgress stage={3} blocksDone={WAIT_SECONDS} blocksTotal={WAIT_SECONDS} accent="#fbbf24" />
          <div className="text-center">
            <p className="font-medium text-white/85">Opening the bottle</p>
            <p className="mt-1 text-xs text-white/40">Please confirm in your wallet</p>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="relative space-y-4 py-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-300/60 bg-amber-400/15">
            <svg className="h-8 w-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-display text-2xl font-semibold text-white">Successfully minted</h3>
          <p className="text-sm text-white/60">Your NFT is secured on-chain and metadata is pinned to IPFS.</p>
          <button
            type="button"
            onClick={resetForm}
            className="mt-2 rounded-xl border border-white/15 bg-white/[0.06] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.12]"
          >
            Mint another
          </button>
        </div>
      )}

      <ul className="relative mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-white/40">
        {["Gas in USDC", "Finality under 1 sec", "Built on Arc"].map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span aria-hidden className="h-1 w-1 rounded-full bg-amber-400/60" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
