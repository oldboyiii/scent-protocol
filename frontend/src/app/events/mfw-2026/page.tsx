"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";

const MFW_CONTRACT_ADDRESS = "0xBcF87E80C18CF5d0D8769703fDb891A16D279B50";
const GENESIS_CONTRACT_ADDRESS = "0x807dF79Ec16CF51C07e7B522175EB408D6dE247E";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const MFW_ABI = [
  "function requestMint(bytes32 seedCommitment) external returns (uint256)",
  "function revealAndMint(uint256 tokenId, bytes32 seedPreimage) external",
  "function cancelMint(uint256 tokenId) external",
  "function getMintPrice(address minter) external view returns (uint256)",
  "function pendingMints(uint256) external view returns (address minter, uint256 blockNumber, uint256 paidAmount, bytes32 seedCommitment)",
  "function getNextTokenId() external view returns (uint256)",
  "function getWalletMintedCount(address wallet) external view returns (uint256)",
  "function getRemainingSupply() external view returns (uint256)",
  "function hasBadge(address account) external view returns (bool)",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

export default function MFW2026EventPage() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0);
  const [userMinted, setUserMinted] = useState(0);
  const [isGenesisHolder, setIsGenesisHolder] = useState(false);
  const [mintPrice, setMintPrice] = useState<bigint>(0n);
  const [needsApproval, setNeedsApproval] = useState(false);
  
  // Состояние для pending mint
  const [pendingTokenId, setPendingTokenId] = useState<number | null>(null);
  const [seedPreimage, setSeedPreimage] = useState<string>("");
  const [countdown, setCountdown] = useState(0);
  const [canReveal, setCanReveal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!address) {
        setLoading(false);
        return;
      }
      
      try {
        const w = window as any;
        if (!w.ethereum) return;
        
        const provider = new ethers.BrowserProvider(w.ethereum);
        const contract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, provider);
        const genesisContract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, ["function balanceOf(address) view returns (uint256)"], provider);

        // Проверяем Genesis holder
        const genesisBalance = await genesisContract.balanceOf(address);
        setIsGenesisHolder(Number(genesisBalance) > 0);

        // Получаем цену
        const price = await contract.getMintPrice(address);
        setMintPrice(price);

        // Общее количество сминченных
        const remaining = await contract.getRemainingSupply();
        setTotalMinted(500 - Number(remaining));

        // Сколько сминтил пользователь
        const mintedCount = await contract.getWalletMintedCount(address);
        setUserMinted(Number(mintedCount));

        // Проверяем есть ли pending mint
        const nextId = Number(await contract.getNextTokenId());
        for (let i = Math.max(1, nextId - 5); i < nextId; i++) {
          try {
            const pending = await contract.pendingMints(i);
            if (pending.minter.toLowerCase() === address.toLowerCase()) {
              setPendingTokenId(i);
              const currentBlock = await provider.getBlockNumber();
              const blocksPassed = currentBlock - Number(pending.blockNumber);
              const blocksRemaining = Math.max(0, 150 - blocksPassed); // 30 секунд / 0.2с на блок
              setCountdown(blocksRemaining);
              setCanReveal(blocksPassed >= 150);
              break;
            }
          } catch (e) {}
        }

      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [address]);

  // Таймер обратного отсчета
  useEffect(() => {
    if (countdown > 0 && !canReveal) {
      const timer = setTimeout(() => {
        setCountdown(c => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanReveal(true);
    }
  }, [countdown, canReveal]);

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
      alert("Approval failed: " + error.message);
    }
  };

  const handleRequestMint = async () => {
    if (!address || needsApproval) return;

    setMinting(true);
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, signer);

      // Генерируем seed и сохраняем его
      const randomBytes = ethers.randomBytes(32);
      const preimageHex = ethers.hexlify(randomBytes);
      setSeedPreimage(preimageHex);
      
      const seedCommitment = ethers.keccak256(randomBytes);
      const tx = await contract.requestMint(seedCommitment);
      const receipt = await tx.wait();

      // Находим tokenId из события
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === "MintRequested";
        } catch { return false; }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        const tokenId = Number(parsed?.args[0]);
        setPendingTokenId(tokenId);
        setCountdown(30);
        setCanReveal(false);
      }

      alert("✅ Reservation created! Wait 30 seconds, then click Reveal.");
    } catch (error: any) {
      alert(error.reason || error.message || "Request failed");
    } finally {
      setMinting(false);
    }
  };

  const handleReveal = async () => {
    if (!address || pendingTokenId === null || !seedPreimage) return;

    setMinting(true);
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, signer);

      const tx = await contract.revealAndMint(pendingTokenId, seedPreimage);
      await tx.wait();

      alert("🎉 NFT successfully minted! Check your Collection.");
      setPendingTokenId(null);
      setSeedPreimage("");
      setCanReveal(false);
      
      // Обновляем данные
      const mintedCount = await contract.getWalletMintedCount(address);
      setUserMinted(Number(mintedCount));
      const remaining = await contract.getRemainingSupply();
      setTotalMinted(500 - Number(remaining));
      
    } catch (error: any) {
      alert(error.reason || error.message || "Reveal failed");
    } finally {
      setMinting(false);
    }
  };

  const handleCancel = async () => {
    if (!pendingTokenId || !confirm("Cancel this mint? You'll get 50% refund (0.5 USDC).")) return;

    setMinting(true);
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, signer);

      const tx = await contract.cancelMint(pendingTokenId);
      await tx.wait();

      alert("Cancelled. 50% refund processed.");
      setPendingTokenId(null);
      setSeedPreimage("");
      setCanReveal(false);
    } catch (error: any) {
      alert(error.reason || error.message || "Cancel failed");
    } finally {
      setMinting(false);
    }
  };

  const priceInUSDC = Number(mintPrice) / 1e6;

  if (loading) {
    return <div className="min-h-screen py-20 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div></div>;
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/events" className="inline-flex items-center gap-2 text-white/50 hover:text-purple-400 mb-8 transition-colors">
          ← Back to Events
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent mb-4">
            Milan Fashion Week 2026
          </h1>
          <p className="text-white/60">A vision for the future of fashion and digital perfumery</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 text-center rounded-xl">
            <p className="text-2xl font-bold text-purple-400">{totalMinted}</p>
            <p className="text-xs text-white/40 uppercase">Minted</p>
          </div>
          <div className="glass-card p-4 text-center rounded-xl">
            <p className="text-2xl font-bold text-amber-400">500</p>
            <p className="text-xs text-white/40 uppercase">Supply</p>
          </div>
          <div className="glass-card p-4 text-center rounded-xl">
            <p className="text-2xl font-bold text-emerald-400">{priceInUSDC} USDC</p>
            <p className="text-xs text-white/40 uppercase">Price</p>
          </div>
        </div>

        {/* Pending Mint Alert */}
        {pendingTokenId !== null && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pending Mint #{pendingTokenId}</h3>
                <p className="text-sm text-white/60">Your reservation is waiting</p>
              </div>
            </div>

            <div className="space-y-4">
              {canReveal ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleReveal}
                    disabled={minting}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {minting ? "Processing..." : "Reveal & Mint NFT"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={minting}
                    className="px-6 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    Cancel (50% Refund)
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 rounded-xl bg-black/30">
                  <p className="text-white/80 mb-2">⏳ Wait before reveal</p>
                  <p className="text-3xl font-bold text-purple-400">{countdown}s</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mint Form */}
        {!pendingTokenId && userMinted < 3 && (
          <div className="glass-card p-8 rounded-2xl border border-white/10">
            {isGenesisHolder && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-amber-400 text-sm">
                   Genesis Holder: Discounted price of <span className="font-bold text-emerald-400">1 USDC</span>
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-white/40 uppercase mb-1">Mint Price</p>
                <p className="text-4xl font-bold text-emerald-400">{priceInUSDC} USDC</p>
                <p className="text-sm text-white/50 mt-2">You minted: {userMinted}/3</p>
              </div>

              {needsApproval ? (
                <button
                  onClick={handleApprove}
                  disabled={minting}
                  className="px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                  Approve USDC
                </button>
              ) : (
                <button
                  onClick={handleRequestMint}
                  disabled={minting}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {minting ? "Processing..." : "Request Mint"}
                </button>
              )}
            </div>
          </div>
        )}

        {userMinted >= 3 && (
          <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-xl text-white font-semibold">Max limit reached (3/3)</p>
            <p className="text-white/60 mt-2">Check your Collection to view your NFTs</p>
          </div>
        )}
      </div>
    </div>
  );
}
