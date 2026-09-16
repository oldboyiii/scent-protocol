"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import Link from "next/link";

// Прокидываем ethers в window для отладки из консоли (необязательно, но удобно)
if (typeof window !== "undefined") {
  (window as any).ethers = ethers;
}

const GENESIS_CONTRACT_ADDRESS = "0x1152E29703313B49BAD9560af64458E24C785E2B";
const ARC_CHAIN_ID = 5042;
const ARC_CHAIN_ID_HEX = "0x" + ARC_CHAIN_ID.toString(16); // 0x13b2
const REVEAL_BLOCKS = 5;

const GENESIS_ABI = [
  "function requestMint() external returns (uint256)",
  "function revealAndMint(uint256 tokenId, uint256 userSeed) external",
  "function getRemainingSupply() external view returns (uint256)",
  "function getWalletMintedCount(address wallet) external view returns (uint256)",
  "function getNextTokenId() external view returns (uint256)",
  "function getPendingMint(uint256 tokenId) external view returns (tuple(address minter, uint256 blockNumber))",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)"
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type Step = "idle" | "requested" | "revealed" | "soldout" | "wrongnetwork";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [minting, setMinting] = useState(false);
  const [mintedCount, setMintedCount] = useState(0);
  const [userMinted, setUserMinted] = useState(0);
  const [timeLeft, setTimeLeft] = useState<{
    days: number; hours: number; minutes: number; seconds: number;
  } | null>(null);

  const [step, setStep] = useState<Step>("idle");
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const maxSupply = 100;
  const maxPerWallet = 1;

  /**
   * Загружает состояние контракта и восстанавливает UI:
   *  - сначала ищет pending mint для текущего кошелька
   *  - только если pending нет — проверяет walletMintedCount
   */
  const loadState = useCallback(async () => {
    try {
      const w = window as any;
      if (!w.ethereum) {
        setStatusMessage("MetaMask не найден. Установите расширение.");
        return;
      }

      const provider = new ethers.BrowserProvider(w.ethereum);

      // 1. Проверяем сеть
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== ARC_CHAIN_ID) {
        setStep("wrongnetwork");
        setStatusMessage(
          `Неверная сеть: Chain ID ${network.chainId}. Переключитесь на Arc Mainnet (${ARC_CHAIN_ID}).`
        );
        return;
      }

      // 2. Проверяем, что контракт задеплоен
      const code = await provider.getCode(GENESIS_CONTRACT_ADDRESS);
      if (code === "0x" || code === "0x0") {
        setStatusMessage("Контракт Genesis не найден по этому адресу.");
        return;
      }

      const contract = new ethers.Contract(
        GENESIS_CONTRACT_ADDRESS,
        GENESIS_ABI,
        provider
      );

      // 3. Общий прогресс
      const nextTokenId = Number(await contract.getNextTokenId());
      const reserved = nextTokenId - 1; // сколько слотов занято (requestMint)
      setMintedCount(reserved);

      if (reserved >= maxSupply) {
        setStep("soldout");
        setStatusMessage("Все 100 NFT зарезервированы.");
        // Но всё равно надо проверить pending текущего пользователя ниже
      }

      // 4. Данные о пользователе
      const signer = await provider.getSigner();
      const address = (await signer.getAddress()).toLowerCase();

      // 5. Сначала ищем pending mint для нашего адреса
      let pendingTokenId: number | null = null;
      let pendingBlockNumber = 0;
      for (let i = 1; i < nextTokenId; i++) {
        try {
          const p = await contract.getPendingMint(i);
          if (p.minter && p.minter.toLowerCase() === address) {
            pendingTokenId = i;
            pendingBlockNumber = Number(p.blockNumber);
            break;
          }
        } catch {
          // RPC может ругаться на отдельных токенах — пропускаем
        }
      }

      if (pendingTokenId !== null) {
        setTokenId(pendingTokenId);
        setStep("requested");
        const currentBlock = await provider.getBlockNumber();
        const blocksPassed = currentBlock - pendingBlockNumber;
        const blocksRemaining = Math.max(0, REVEAL_BLOCKS - blocksPassed);
        setCountdown(blocksRemaining * 2); // ~2 сек на блок Arc
        setStatusMessage(
          `У вас есть незавершённый минт tokenId ${pendingTokenId}. Завершите reveal.`
        );
        return;
      }

      // 6. Pending нет — смотрим, сколько уже сминчено на кошелёк
      const minted = Number(await contract.getWalletMintedCount(address));
      setUserMinted(minted);

      if (minted >= maxPerWallet) {
        setStep("revealed");
        setStatusMessage("Вы уже получили Genesis NFT.");
        return;
      }

      if (reserved >= maxSupply) {
        setStep("soldout");
        setStatusMessage("Все 100 NFT разминчены. Спасибо за интерес!");
        return;
      }

      setStep("idle");
      setStatusMessage("");
    } catch (err: any) {
      console.error("loadState failed:", err);
      setStatusMessage(
        "Не удалось загрузить данные контракта. Проверьте RPC и сеть."
      );
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Таймер конца события
  useEffect(() => {
    const endTime = Math.floor(
      new Date("2025-09-18T00:00:00Z").getTime() / 1000
    );
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
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Обратный отсчёт после requestMint
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  /** Шаг 1: requestMint */
  const handleMint = async () => {
    const w = window as any;
    if (!w.ethereum) {
      alert("Подключите MetaMask.");
      return;
    }

    setMinting(true);
    try {
      const provider = new ethers.BrowserProvider(w.ethereum);

      // Проверка сети прямо перед отправкой
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== ARC_CHAIN_ID) {
        alert(`Переключите сеть на Arc Mainnet (Chain ID ${ARC_CHAIN_ID}).`);
        return;
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        GENESIS_CONTRACT_ADDRESS,
        GENESIS_ABI,
        signer
      );

      // Пробный eth_call — покажет причину реверта до отправки
      try {
        await contract.requestMint.staticCall();
      } catch (simErr: any) {
        const reason =
          simErr?.reason || simErr?.shortMessage || simErr?.message || "";
        if (reason.includes("MaxSupplyReached")) {
          alert("Все 100 NFT разминчены.");
          setStep("soldout");
          return;
        }
        if (reason.includes("MaxPerWalletReached")) {
          alert("Вы уже минтили Genesis.");
          setStep("revealed");
          return;
        }
        // если причина неизвестна — просто продолжаем, пусть кошелёк попробует
        console.warn("staticCall warning:", simErr);
      }

      const tx = await contract.requestMint();
      console.log("requestMint tx:", tx.hash);

      const receipt = await tx.wait();

      // Находим tokenId из события
      let newTokenId: number | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "MintRequested") {
            newTokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch {
          // не наш лог
        }
      }

      if (newTokenId === null) {
        // fallback: следующий tokenId - 1
        const nextId = Number(await contract.getNextTokenId());
        newTokenId = nextId - 1;
      }

      setTokenId(newTokenId);
      setStep("requested");
      setCountdown(REVEAL_BLOCKS * 2); // ~10 сек
      setMintedCount((prev) => prev + 1);
      setStatusMessage(
        `Заявка принята. tokenId: ${newTokenId}. Дождитесь окончания таймера и нажмите Reveal.`
      );
    } catch (err: any) {
      console.error("requestMint failed:", err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        alert("Транзакция отклонена.");
      } else if (err.code === "CALL_EXCEPTION" && !err.data) {
        alert(
          "Контракт отклонил вызов. Возможно, минт закрыт или вы уже минтили."
        );
      } else {
        alert(err.reason || err.shortMessage || err.message || "Ошибка минта.");
      }
    } finally {
      setMinting(false);
    }
  };

  /** Шаг 2: revealAndMint */
  const handleReveal = async () => {
    if (!tokenId) return;
    const w = window as any;
    if (!w.ethereum) return;

    setMinting(true);
    try {
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        GENESIS_CONTRACT_ADDRESS,
        GENESIS_ABI,
        signer
      );

      // Генерируем seed безопасно
      const seedBytes = ethers.randomBytes(32);
      const userSeed = BigInt(ethers.hexlify(seedBytes));

      // Пробный staticCall — увидим причину реверта
      try {
        await contract.revealAndMint.staticCall(tokenId, userSeed);
      } catch (simErr: any) {
        const reason =
          simErr?.reason || simErr?.shortMessage || simErr?.message || "";
        if (reason.includes("TooEarly")) {
          alert("Ещё рано. Подождите несколько секунд и повторите.");
          return;
        }
        if (reason.includes("NoPendingMint")) {
          alert(
            "Pending минт не найден. Возможно, он уже раскрыт. Обновляем состояние..."
          );
          await loadState();
          return;
        }
        console.warn("staticCall warning:", simErr);
      }

      const tx = await contract.revealAndMint(tokenId, userSeed);
      console.log("revealAndMint tx:", tx.hash);
      await tx.wait();

      setStep("revealed");
      setUserMinted(1);
      setStatusMessage("NFT успешно сминчен! Проверьте Collection.");
      alert("NFT успешно сминчен! Проверьте Collection.");
    } catch (err: any) {
      console.error("revealAndMint failed:", err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        alert("Транзакция отклонена.");
      } else {
        alert(
          err.reason || err.shortMessage || err.message || "Ошибка reveal."
        );
      }
    } finally {
      setMinting(false);
    }
  };

  const progress = (mintedCount / maxSupply) * 100;

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 relative z-10">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
      >
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
          <p className="text-center text-xs text-white/40 uppercase tracking-wider mb-4">
            Event ends in
          </p>
          <div className="flex justify-center gap-4 max-w-2xl mx-auto">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((item) => (
              <div
                key={item.label}
                className="flex-1 bg-black/30 rounded-2xl p-6 border border-amber-500/20"
              >
                <div className="text-4xl md:text-5xl font-bold text-amber-400 text-center">
                  {String(item.value).padStart(2, "0")}
                </div>
                <div className="text-xs text-white/40 text-center mt-2 uppercase">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-900/90 via-purple-900/50 to-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/30 mb-12">
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-white/60">Minted / Reserved</span>
            <span className="text-white/60">
              {mintedCount} / {maxSupply}
            </span>
          </div>
          <div className="h-4 bg-black/30 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-white/40 mt-2 text-center">
            {progress.toFixed(1)}% claimed • {maxSupply - mintedCount} remaining
          </p>
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl bg-amber-900/20 border border-amber-500/30 text-amber-200 text-sm">
            {statusMessage}
          </div>
        )}

        {step === "wrongnetwork" && (
          <div className="p-6 bg-red-900/20 rounded-2xl border border-red-500/30 text-center">
            <p className="text-red-400 font-bold mb-2">Неверная сеть</p>
            <p className="text-white/70 text-sm">
              Переключите MetaMask на Arc Mainnet (Chain ID {ARC_CHAIN_ID}).
            </p>
          </div>
        )}

        {step === "soldout" && (
          <div className="p-6 bg-black/20 rounded-2xl border border-white/10 text-center">
            <p className="text-2xl font-bold text-white mb-2">Sold Out</p>
            <p className="text-white/60 text-sm">
              Все 100 Genesis NFT разминчены. Следите за следующими дропами.
            </p>
          </div>
        )}

        {step === "idle" && userMinted < maxPerWallet && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-black/20 rounded-2xl border border-white/10">
            <div className="text-center md:text-left">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                Price per NFT
              </p>
              <p className="text-4xl font-bold text-white">Free</p>
              <p className="text-xs text-white/40 mt-2">
                Max {maxPerWallet} per wallet • You minted: {userMinted}/{maxPerWallet}
              </p>
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
              <p className="text-emerald-400 font-semibold mb-2">
                ✅ Step 1 Complete!
              </p>
              <p className="text-white/80">
                Your tokenId:{" "}
                <span className="font-mono text-amber-400">{tokenId}</span>
              </p>
              <p className="text-white/50 text-sm mt-2">
                {countdown > 0
                  ? `⏳ Wait ${countdown}s before reveal...`
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
            <p className="text-white/80 mb-1">
              Token ID:{" "}
              <span className="font-mono text-amber-400">
                {tokenId || "Check your wallet"}
              </span>
            </p>
            <p className="text-white/50 text-sm">
              You have reached the maximum of {maxPerWallet} NFT
            </p>
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
            All minted NFTs appear in your{" "}
            <Link href="/collection" className="text-amber-400 hover:underline">
              Collection
            </Link>{" "}
            page. Genesis NFTs are marked with a special badge and can be listed on the{" "}
            <Link href="/marketplace" className="text-amber-400 hover:underline">
              Marketplace
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
