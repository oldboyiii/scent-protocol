"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import Link from "next/link";

// Updated to the correctly deployed Genesis contract address
const GENESIS_CONTRACT_ADDRESS = "0x807dF79Ec16CF51C07e7B522175EB408D6dE247E";

const GENESIS_ABI = [
  "function requestMint() external returns (uint256)",
  "function revealAndMint(uint256 tokenId, uint256 userSeed) external",
  "function getRemainingSupply() external view returns (uint256)",
  "function getWalletMintedCount(address wallet) external view returns (uint256)",
  "function getNextTokenId() external view returns (uint256)",
  "function getPendingMint(uint256 tokenId) external view returns (tuple(address minter, uint256 blockNumber))",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)"
];

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [minting, setMinting] = useState(false);
  const [mintedCount, setMintedCount] = useState(0);
  const [userMinted, setUserMinted] = useState(0);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  
  const [step, setStep] = useState<"idle" | "requested" | "revealed">("idle");
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  const maxSupply = 100;
  const maxPerWallet = 1;

  useEffect(() => {
    async function fetchData() {
      try {
        const w = window as any;
        
        // FIX: Use a stable fallback RPC and explicitly define the network to prevent ethers v6 bugs
        const arcNetwork = new ethers.Network("Arc Mainnet", 5042);
        const provider = w.ethereum 
          ? new ethers.BrowserProvider(w.ethereum, arcNetwork) 
          : new ethers.JsonRpcProvider("https://arc.drpc.org", arcNetwork);
          
        const contract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider);
        
        const remaining = await contract.getRemainingSupply();
        const actualMinted = maxSupply - Number(remaining);
        setMintedCount(actualMinted);

        if (w.ethereum) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          
          // Try to get revealed count, but don't crash if RPC glitches
          let revealedCount = 0;
          try {
            const minted = await contract.getWalletMintedCount(address);
            revealedCount = Number(minted);
            setUserMinted(revealedCount);
          } catch (err) {
            console.warn("RPC glitch on getWalletMintedCount, relying on pending check", err);
          }

          // If already fully revealed, show success state
          if (revealedCount >= maxPerWallet) {
            setStep("revealed");
            return;
          }

          // FIX: Check for pending mints to restore state after page refresh
          const nextTokenId = await contract.getNextTokenId();
          let foundPending = false;
          
          for (let i = 1; i < Number(nextTokenId); i++) {
            try {
              const pending = await contract.getPendingMint(i);
              if (pending.minter.toLowerCase() === address.toLowerCase()) {
                console.log(`Found pending mint for user at tokenId: ${i}`);
                setTokenId(i);
                setStep("requested");
                
                // Calculate remaining wait time based on blocks
                const currentBlock = await provider.getBlockNumber();
                const blocksPassed = currentBlock - Number(pending.blockNumber);
                const blocksRemaining = Math.max(0, 5 - blocksPassed);
                setCountdown(blocksRemaining * 2); // Approx 2 seconds per block
                
                foundPending = true;
                break;
              }
            } catch (err) {
              // Ignore individual token read errors, continue loop
            }
          }
          
          if (!foundPending && revealedCount < maxPerWallet) {
            setStep("idle");
          }
        }
      } catch (error) {
        console.error("Failed to fetch contract data:", error);
      }
    }

    fetchData();

    // Countdown timer for event end
    const endTime = Math.floor(new Date("2025-09-18T00:00:00Z").getTime() / 1000);
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      if (now < endTime) {
        const diff = endTime - now;
        setTimeLeft({
          days: Math.floor(diff / 86400),
          hours: Math.floor((diff % 86400) / 3600),
          minutes: Math.floor((diff % 3600) / 60),
          seconds: diff % 60,
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleMint = async () => {
    const w = window as any;
    if (!w.ethereum) {
      alert("Please connect your wallet first.");
      return;
    }

    setMinting(true);
    try {
      const arcNetwork = new ethers.Network("Arc Mainnet", 5042);
      const provider = new ethers.BrowserProvider(w.ethereum, arcNetwork);
      const signer = await provider.getSigner();
      const contractWithSigner = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, signer);

      console.log("Calling requestMint...");
      const tx = await contractWithSigner.requestMint();
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      const mintEvent = receipt.logs
        .map((log: any) => {
          try {
            return contractWithSigner.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e?.name === "MintRequested");

      const newTokenId = mintEvent ? Number(mintEvent.args.tokenId) : 1;
      setTokenId(newTokenId);
      setStep("requested");
      setCountdown(12); // Fallback 12 seconds wait

      const countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      console.error("Mint request failed:", error);
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        alert("Transaction rejected by user.");
      } else {
        alert(error.message || "Mint request failed. Please try again.");
      }
    } finally {
      setMinting(false);
    }
  };

  const handleReveal = async () => {
    if (!tokenId) return;
    setMinting(true);
    try {
      const w = window as any;
      const arcNetwork = new ethers.Network("Arc Mainnet", 5042);
      const provider = new ethers.BrowserProvider(w.ethereum, arcNetwork);
      const signer = await provider.getSigner();
      const contractWithSigner = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, signer);

      console.log("Calling revealAndMint...");
      
      // FIX: Cryptographically secure 32-byte random value for uint256 without overflow
      const randomArray = new Uint8Array(32);
      if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(randomArray);
      } else {
        for (let i = 0; i < 32; i++) {
          randomArray[i] = Math.floor(Math.random() * 256);
        }
      }
      const userSeedHex = "0x" + Array.from(randomArray, b => b.toString(16).padStart(2, "0")).join("");
      const userSeed = BigInt(userSeedHex);
      
      const tx = await contractWithSigner.revealAndMint(tokenId, userSeed);
      console.log("Reveal transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Reveal confirmed");

      setStep("revealed");
      setUserMinted((prev) => prev + 1);
      setMintedCount((prev) => prev + 1);
      alert("NFT successfully minted! Check your Collection.");

    } catch (error: any) {
      console.error("Reveal failed:", error);
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        alert("Transaction rejected by user.");
      } else {
        alert(error.message || "Reveal failed. Please try again.");
      }
    } finally {
      setMinting(false);
    }
  };

  const progress = (mintedCount / maxSupply) * 100;

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 relative z-10">
      <Link href="/events" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </Link>

      <div className="text-center mb-12">
        <span className="inline-block px-4 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30 mb-4">
          Live Now
        </span>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent leading-[1.2] pb-4">
          Genesis Collection
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          The first 100 AI-generated fragrances on Arc Mainnet. 
          Limited edition with an enhanced Legendary drop rate.
        </p>
      </div>

      {timeLeft && (
        <div className="mb-12">
          <p className="text-center text-xs text-white/40 uppercase tracking-wider mb-4">Event ends in</p>
          <div className="flex justify-center gap-4 max-w-2xl mx-auto">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="flex-1 bg-black/30 rounded-2xl p-6 border border-amber-500/20">
                <div className="text-4xl md:text-5xl font-bold text-amber-400 text-center">
                  {String(item.value).padStart(2, "0")}
                </div>
                <div className="text-xs text-white/40 text-center mt-2 uppercase">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-900/90 via-purple-900/50 to-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/30 mb-12">
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-white/60">Minted</span>
            <span className="text-white/60">{mintedCount} / {maxSupply}</span>
          </div>
          <div className="h-4 bg-black/30 rounded-full overflow-hidden border border-white/10">
            <div className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-white/40 mt-2 text-center">{progress.toFixed(1)}% minted • {maxSupply - mintedCount} remaining</p>
        </div>

        {step === "idle" && userMinted < maxPerWallet && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-black/20 rounded-2xl border border-white/10">
            <div className="text-center md:text-left">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Price per NFT</p>
              <p className="text-4xl font-bold text-white">Free</p>
              <p className="text-xs text-white/40 mt-2">Max {maxPerWallet} per wallet • You minted: {userMinted}/{maxPerWallet}</p>
            </div>
            <button
              onClick={handleMint}
              disabled={minting}
              className="px-10 py-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {minting ? "Processing..." : "Mint Now"}
            </button>
          </div>
        )}

        {step === "requested" && tokenId !== null && (
          <div className="space-y-6 p-6 bg-black/20 rounded-2xl border border-white/10">
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6 text-center">
              <p className="text-emerald-400 font-semibold mb-2">✅ Step 1 Complete!</p>
              <p className="text-white/80">Your tokenId: <span className="font-mono text-amber-400">{tokenId}</span></p>
              <p className="text-white/50 text-sm mt-2">
                {countdown > 0 ? `⏳ Wait ${countdown} seconds before reveal...` : "✅ Ready for reveal!"}
              </p>
            </div>
            <button
              onClick={handleReveal}
              disabled={countdown > 0 || minting}
              className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {minting ? "Revealing..." : "Reveal & Mint NFT"}
            </button>
          </div>
        )}

        {step === "revealed" && (
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center">
                <svg className="w-9 h-9 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-emerald-400 text-2xl font-bold mb-2">NFT Minted!</p>
            <p className="text-white/80 mb-1">Token ID: <span className="font-mono text-amber-400">{tokenId || "Check your wallet"}</span></p>
            <p className="text-white/50 text-sm">You have reached the maximum of {maxPerWallet} NFT</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
            <p className="text-amber-400 text-sm font-bold mb-1">15% Legendary</p>
            <p className="text-xs text-white/60">Enhanced drop rate vs 5% standard</p>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
            <p className="text-amber-400 text-sm font-bold mb-1">Genesis Badge</p>
            <p className="text-xs text-white/60">Exclusive badge on all NFTs</p>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
            <p className="text-amber-400 text-sm font-bold mb-1">Priority Access</p>
            <p className="text-xs text-white/60">Early access to future drops</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-3">What is Genesis Collection?</h3>
          <p className="text-sm text-white/60 leading-relaxed">
            Genesis Collection marks the launch of ScentProtocol on Arc Mainnet. 
            Each NFT is a unique AI-generated fragrance formula with enhanced rarity rates. 
            Holders receive lifetime priority access to all future drops and events.
          </p>
        </div>

        <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-3">Where to view my NFTs?</h3>
          <p className="text-sm text-white/60 leading-relaxed">
            All minted NFTs appear in your <Link href="/collection" className="text-amber-400 hover:underline">Collection</Link> page. 
            Genesis NFTs are marked with a special badge and can be listed on the <Link href="/marketplace" className="text-amber-400 hover:underline">Marketplace</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
