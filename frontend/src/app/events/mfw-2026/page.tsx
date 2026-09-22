"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";

const MFW_CONTRACT_ADDRESS = "0xBcF87E80C18CF5d0D8769703fDb891A16D279B50";
const GENESIS_CONTRACT_ADDRESS = "0x807dF79Ec16CF51C07e7B522175EB408D6dE247E";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const MFW_ABI = [
  "function requestMint() external returns (uint256)",
  "function revealAndMint(uint256 tokenId, uint256 userSeed) external",
  "function getMintPrice(address minter) external view returns (uint256)",
  "function isGenesisHolder(address account) external view returns (bool)",
  "function getRemainingSupply() external view returns (uint256)",
  "function getWalletMintedCount(address wallet) external view returns (uint256)",
  "function getNextTokenId() external view returns (uint256)",
  "function getPerfume(uint256 tokenId) external view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator, bool hasExclusiveBadge))",
  "function hasBadge(address account) external view returns (bool)",
  "event PerfumeMinted(uint256 indexed tokenId, address indexed creator, uint256 price)",
  "event BadgeAwarded(address indexed recipient)",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

export default function MFW2026EventPage() {
  const { address } = useWallet();
  const [minting, setMinting] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0);
  const [userMinted, setUserMinted] = useState(0);
  const [isGenesisHolder, setIsGenesisHolder] = useState(false);
  const [hasBadge, setHasBadge] = useState(false);
  const [mintPrice, setMintPrice] = useState<bigint>(0n);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [step, setStep] = useState<"idle" | "requested" | "revealing" | "success">("idle");

  const maxSupply = 500;
  const maxPerWallet = 3;

  const fetchContractData = async () => {
    if (!address) return;
    try {
      const w = window as any;
      if (!w.ethereum) return;
      
      const provider = new ethers.BrowserProvider(w.ethereum);
      const mfwContract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, provider);
      const genesisContract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, ["function balanceOf(address) view returns (uint256)"], provider);

      try {
        const genesisBalance = await genesisContract.balanceOf(address);
        setIsGenesisHolder(Number(genesisBalance) > 0);
        
        try {
          const userHasBadge = await mfwContract.hasBadge(address);
          setHasBadge(userHasBadge);
        } catch {}
      } catch {}

      try {
        const price = await mfwContract.getMintPrice(address);
        setMintPrice(price);
      } catch {}

      const remaining = await mfwContract.getRemainingSupply();
      setTotalMinted(maxSupply - Number(remaining));

      const mintedCount = await mfwContract.getWalletMintedCount(address);
      setUserMinted(Number(mintedCount));
      
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
    }
  };

  const checkApproval = async () => {
    if (!address || mintPrice === 0n) return;
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      
      const allowance = await usdcContract.allowance(address, MFW_CONTRACT_ADDRESS);
      setNeedsApproval(allowance < mintPrice);
    } catch (error) {
      console.error("Approval check failed:", error);
    }
  };

  useEffect(() => {
    fetchContractData();
  }, [address]);

  useEffect(() => {
    if (mintPrice > 0n) checkApproval();
  }, [mintPrice, address]);

  const handleApprove = async () => {
    if (!address) return;
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      
      const tx = await usdcContract.approve(MFW_CONTRACT_ADDRESS, mintPrice * BigInt(100));
      await tx.wait();
      setNeedsApproval(false);
    } catch (error: any) {
      console.error("Approval failed:", error);
      alert("Approval failed: " + (error.reason || error.message));
    }
  };

  const handleRequestMint = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }
    if (needsApproval) {
      alert("Please approve USDC first");
      return;
    }

    setMinting(true);
    setStep("requested");
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, signer);

      const tx = await contract.requestMint();
      const receipt = await tx.wait();

      const mintEvent = receipt.logs
        .map((log: any) => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find((e: any) => e?.name === "MintRequested");

      const newTokenId = mintEvent ? Number(mintEvent.args[0]) : 1;
      setTokenId(newTokenId);
      setCountdown(10);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      console.error("Request mint failed:", error);
      alert(error.reason || error.message || "Mint request failed");
      setStep("idle");
    } finally {
      setMinting(false);
    }
  };

  const handleReveal = async () => {
    if (!address || tokenId === null) return;

    setMinting(true);
    setStep("revealing");
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, signer);

      const userSeedHex = ethers.hexlify(ethers.randomBytes(32));
      const tx = await contract.revealAndMint(tokenId, userSeedHex);
      await tx.wait();

      if (isGenesisHolder || !hasBadge) {
        alert("🎉 Mint successful! You received the exclusive MFW 2026 Badge!");
      } else {
        alert("NFT successfully minted!");
      }

      setStep("success");
      await fetchContractData();
      await checkApproval();

    } catch (error: any) {
      console.error("Reveal failed:", error);
      alert(error.reason || error.shortMessage || error.message || "Reveal failed");
      setStep("idle");
    } finally {
      setMinting(false);
    }
  };

  const progress = (totalMinted / maxSupply) * 100;
  const priceInUSDC = Number(mintPrice) / 1e6;

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/events" className="inline-flex items-center gap-2 text-white/50 hover:text-amber-400 mb-12 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider border border-purple-500/30 mb-6">
            Coming Soon • Sep 22-28, 2026
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 mb-4">
            Milan Fashion Week 2026
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Exclusive digital fragrance drop inspired by haute couture
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{totalMinted}</p>
            <p className="text-xs text-white/40 uppercase">Minted</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{maxSupply}</p>
            <p className="text-xs text-white/40 uppercase">Total Supply</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-pink-400">{maxPerWallet}</p>
            <p className="text-xs text-white/40 uppercase">Per Wallet</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{priceInUSDC} USDC</p>
            <p className="text-xs text-white/40 uppercase">Price</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-white/40">
            {progress.toFixed(1)}% minted
          </p>
        </div>

        {/* Mint Card */}
        <div className="glass-card p-8 rounded-2xl border border-white/10 mb-12">
          {/* Genesis Discount Info */}
          {isGenesisHolder && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <p className="text-amber-400 font-semibold">Genesis Holder Benefit</p>
              </div>
              <p className="text-white/80 text-sm">
                You qualify for the discounted price of <span className="font-bold text-emerald-400">1 USDC</span>.
              </p>
            </div>
          )}

          {/* Universal Badge Info */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p className="text-purple-400 font-semibold">Exclusive Digital Badge</p>
            </div>
            <p className="text-white/80 text-sm">
              {hasBadge 
                ? "You already own the exclusive MFW 2026 digital badge!" 
                : "Every minter receives an exclusive MFW 2026 digital badge on their profile!"}
            </p>
          </div>

          {userMinted < maxPerWallet ? (
            <>
              {step === "idle" && (
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Mint Price</p>
                    <p className="text-4xl font-bold text-emerald-400">
                      {priceInUSDC} USDC
                    </p>
                    {isGenesisHolder && (
                      <p className="text-sm text-white/50 mt-1">
                        Genesis discount applied (regular: 5 USDC)
                      </p>
                    )}
                    <p className="text-sm text-white/50 mt-2">
                      You minted: {userMinted}/{maxPerWallet}
                    </p>
                  </div>

                  {needsApproval ? (
                    <button
                      onClick={handleApprove}
                      disabled={minting}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-blue-500/40 hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {minting ? "Processing..." : "Approve USDC"}
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestMint}
                      disabled={minting}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {minting ? "Requesting..." : "Request Mint"}
                    </button>
                  )}
                </div>
              )}

              {step === "requested" && tokenId !== null && (
                <div className="space-y-6">
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6">
                    <p className="text-emerald-400 font-semibold mb-2">✅ Step 1 Complete!</p>
                    <p className="text-white/80">
                      Your tokenId: <span className="font-mono text-amber-400">#{tokenId}</span>
                    </p>
                    <p className="text-white/50 text-sm mt-2">
                      {countdown > 0 
                        ? `⏳ Wait ${countdown} seconds before reveal...`
                        : "✅ Ready for reveal!"}
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

              {step === "revealing" && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-white/80 font-medium">Revealing your unique formula...</p>
                  <p className="text-white/40 text-xs mt-1">Please confirm in your wallet</p>
                </div>
              )}

              {step === "success" && (
                <div className="text-center space-y-4 py-4">
                  <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center">
                      <svg className="w-9 h-9 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-emerald-400">Successfully Minted!</h3>
                  <p className="text-white/60 text-sm">Your NFT is secured on-chain and you received the exclusive badge!</p>
                  <button
                    onClick={() => setStep("idle")}
                    className="mt-4 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                  >
                    Mint Another
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white font-semibold mb-2">Max Limit Reached</p>
              <p className="text-white/60 text-sm">
                You've already minted {userMinted}/{maxPerWallet} NFTs
              </p>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Event Details
            </h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">📅</span>
                <span><strong>Dates:</strong> September 22-28, 2026</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">🎨</span>
                <span><strong>Supply:</strong> 500 NFTs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">💎</span>
                <span><strong>Price:</strong> 5 USDC (1 USDC for Genesis)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">🏷️</span>
                <span><strong>Bonus:</strong> Exclusive Digital Badge for ALL minters</span>
              </li>
            </ul>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              What You Get
            </h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">✨</span>
                <span>Unique AI-generated MFW-inspired fragrance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">🎖️</span>
                <span>Exclusive digital badge for all attendees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">🎫</span>
                <span>Priority access to future fashion collaborations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">🌟</span>
                <span>Physical redemption opportunities</span>
              </li>
            </ul>
          </div>
        </div>

        {/* About Section */}
        <div className="glass-card p-8 rounded-2xl border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">About This Event</h2>
          <p className="text-white/60 leading-relaxed mb-4">
            We're partnering with <strong>Milan Fashion Week 2026</strong> for an unprecedented collaboration between haute couture and digital perfumery. This limited edition drop features AI-generated scents that capture the essence of MFW 2026's most iconic moments.
          </p>
          <p className="text-white/60 leading-relaxed">
            Each NFT holder receives exclusive access to future fashion week collaborations, a digital badge displayed on their profile, and priority access to physical redemption opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}
