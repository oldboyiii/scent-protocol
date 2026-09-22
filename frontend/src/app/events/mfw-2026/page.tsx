"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  "function isGenesisHolder(address account) external view returns (bool)",
  "function getRemainingSupply() external view returns (uint256)",
  "function getWalletMintedCount(address wallet) external view returns (uint256)",
  "function getNextTokenId() external view returns (uint256)",
  "function getPerfume(uint256 tokenId) external view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator, bool hasExclusiveBadge))",
  "function hasBadge(address account) external view returns (bool)",
  "function pendingMints(uint256) external view returns (address minter, uint256 blockNumber, uint256 paidAmount, bytes32 seedCommitment)",
  "event PerfumeMinted(uint256 indexed tokenId, address indexed creator, uint256 price)",
  "event BadgeAwarded(address indexed recipient)",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

interface PendingMintInfo {
  tokenId: number;
  price: bigint;
  seedPreimage: string;
  canReveal: boolean;
  canCancel: boolean;
}

export default function MFW2026EventPage() {
  const { address } = useWallet();
  const router = useRouter();
  const [minting, setMinting] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0);
  const [userMinted, setUserMinted] = useState(0);
  const [isGenesisHolder, setIsGenesisHolder] = useState(false);
  const [hasBadge, setHasBadge] = useState(false);
  const [mintPrice, setMintPrice] = useState<bigint>(0n);
  const [needsApproval, setNeedsApproval] = useState(false);
  
  const [pendingMints, setPendingMints] = useState<PendingMintInfo[]>([]);
  const [checkingPending, setCheckingPending] = useState(false);

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
        const userHasBadge = await mfwContract.hasBadge(address).catch(() => false);
        setHasBadge(userHasBadge);
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

  // Поиск всех ожидающих минтов пользователя
  const checkPendingMints = async () => {
    if (!address) return;
    setCheckingPending(true);
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const contract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, provider);
      
      const nextId = Number(await contract.getNextTokenId());
      const found: PendingMintInfo[] = [];
      
      // Проверяем последние 10 ID на наличие наших резерваций
      for (let i = Math.max(1, nextId - 10); i < nextId; i++) {
        try {
          const pending = await contract.pendingMints(i);
          if (pending.minter.toLowerCase() === address.toLowerCase()) {
            const currentBlock = await provider.getBlockNumber();
            // 30 секунд ~ 150 блоков на Arc (при ~0.2с на блок), берем с запасом 300 блоков
            const canReveal = currentBlock > Number(pending.blockNumber) + 300;
            const canCancel = currentBlock > Number(pending.blockNumber) + 300;
            
            // Примечание: seedPreimage мы не можем получить из контракта (там только хеш), 
            // поэтому для восстановления мы попросим пользователя сгенерировать новый или используем локальный кэш.
            // Для упрощения, если это дубликат, мы просто покажем кнопку Cancel.
            found.push({
              tokenId: i,
              price: pending.paidAmount,
              seedPreimage: "", // Будет сгенерирован заново или взят из кэша, если бы мы его сохраняли глобально
              canReveal,
              canCancel
            });
          }
        } catch (e) {}
      }
      setPendingMints(found);
    } catch (error) {
      console.error("Failed to check pending mints:", error);
    } finally {
      setCheckingPending(false);
    }
  };

  useEffect(() => {
    fetchContractData();
  }, [address]);

  useEffect(() => {
    if (mintPrice > 0n) checkApproval();
  }, [mintPrice, address]);

  useEffect(() => {
    if (address) {
      checkPendingMints();
    }
  }, [address]);

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
      alert("Approval failed: " + (error.reason || error.message));
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

      const randomBytes = ethers.randomBytes(32);
      const seedCommitment = ethers.keccak256(randomBytes);
      
      const tx = await contract.requestMint(seedCommitment);
      await tx.wait();

      alert("Reservation successful! Please wait 30 seconds, then refresh the page to see your pending mint.");
      await checkPendingMints();
    } catch (error: any) {
      alert(error.reason || error.message || "Mint request failed");
    } finally {
      setMinting(false);
    }
  };

  const handleReveal = async (tokenId: number, seedPreimage: string) => {
    if (!address) return;
    setMinting(true);
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, signer);

      // Если seedPreimage пуст (дубликат из проверки), генерируем новый (это создаст новый рандомный парфюм для этого ID)
      const finalSeed = seedPreimage || ethers.hexlify(ethers.randomBytes(32));
      
      const tx = await contract.revealAndMint(tokenId, finalSeed);
      await tx.wait();

      alert(`🎉 Token #${tokenId} successfully minted!`);
      await fetchContractData();
      await checkPendingMints();
    } catch (error: any) {
      alert(error.reason || error.shortMessage || "Reveal failed");
    } finally {
      setMinting(false);
    }
  };

  const handleCancel = async (tokenId: number) => {
    if (!confirm(`Cancel Token #${tokenId}? You will receive a 50% refund (0.50 USDC) due to the anti-spam penalty.`)) return;
    
    setMinting(true);
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, signer);

      const tx = await contract.cancelMint(tokenId);
      await tx.wait();

      alert(`Token #${tokenId} cancelled. 50% refund processed to your wallet.`);
      await checkPendingMints();
      await checkApproval();
    } catch (error: any) {
      alert(error.reason || error.shortMessage || "Cancel failed");
    } finally {
      setMinting(false);
    }
  };

  const priceInUSDC = Number(mintPrice) / 1e6;

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/events" className="inline-flex items-center gap-2 text-white/50 hover:text-amber-400 mb-12 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Events
        </Link>

        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider border border-purple-500/30 mb-6">
            Live Now • Sep 22-28, 2026
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 mb-4">
            Milan Fashion Week 2026
          </h1>
        </div>

        {/* БЛОК ВОССТАНОВЛЕНИЯ ЗАСТРЯВШИХ МИНТОВ */}
        {pendingMints.length > 0 && (
          <div className="mb-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Pending Mints Found ({pendingMints.length})
            </h3>
            <p className="text-white/70 text-sm mb-4">
              You have active reservations. Complete them or cancel to get a 50% refund.
            </p>
            <div className="space-y-3">
              {pendingMints.map((pm) => (
                <div key={pm.tokenId} className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/10">
                  <div>
                    <p className="text-white font-bold">Token ID: #{pm.tokenId}</p>
                    <p className="text-xs text-white/50">Locked: {Number(pm.price) / 1e6} USDC</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancel(pm.tokenId)}
                      disabled={minting || !pm.canCancel}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50"
                    >
                      Cancel (50% Refund)
                    </button>
                    <button
                      onClick={() => handleReveal(pm.tokenId, pm.seedPreimage)}
                      disabled={minting || !pm.canReveal}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold shadow-lg disabled:opacity-50"
                    >
                      {pm.canReveal ? "Reveal & Mint" : "Wait 30s..."}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Основная форма минта */}
        <div className="glass-card p-8 rounded-2xl border border-white/10 mb-12">
          {isGenesisHolder && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
              <p className="text-amber-400 font-semibold">Genesis Holder Benefit: Discounted price of <span className="font-bold text-emerald-400">1 USDC</span>.</p>
            </div>
          )}

          {userMinted < maxPerWallet ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Mint Price</p>
                <p className="text-4xl font-bold text-emerald-400">{priceInUSDC} USDC</p>
                <p className="text-sm text-white/50 mt-2">You minted: {userMinted}/{maxPerWallet}</p>
              </div>

              {needsApproval ? (
                <button onClick={handleApprove} disabled={minting} className="px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50">
                  Approve USDC
                </button>
              ) : (
                <button
                  onClick={handleRequestMint}
                  disabled={minting || pendingMints.length >= maxPerWallet}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {minting ? "Processing..." : "Request Mint"}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white font-semibold">Max Limit Reached ({userMinted}/{maxPerWallet})</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
