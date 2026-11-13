"use client";

// All chain logic for the Genesis mint: supply, the wallet's state, the commit-reveal flow and recovery.
// The reveal secret is derived from a free wallet signature, so a cleared browser can never lose a mint.

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";

export const GENESIS_CONTRACT_ADDRESS = "0x37D6a1c730B8DdbB70aD765B39b1edc5Dad12EF6";
export const MAX_SUPPLY = 100;
const RPC_URL = "https://rpc.mainnet.arc.io";
const REVEAL_BLOCKS = 6; // The contract needs more than 5 blocks after the request

const GENESIS_ABI = [
  "function requestMint(bytes32 seedCommitment) external returns (uint256)",
  "function revealAndMint(uint256 tokenId, bytes32 seedPreimage) external",
  "function getRemainingSupply() external view returns (uint256)",
  "function getWalletMintedCount(address wallet) external view returns (uint256)",
  "function getNextTokenId() external view returns (uint256)",
  "function getPendingMint(uint256 tokenId) external view returns (tuple(address minter, uint256 blockNumber, bytes32 seedCommitment))",
  "function getPerfume(uint256 tokenId) external view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator, bool isGenesis))",
  "error ScentProtocol__TooEarly()",
  "error ScentProtocol__TooLate()",
  "error ScentProtocol__CommitmentMismatch()",
  "error ScentProtocol__NoPendingMint()",
  "error ScentProtocol__NotAuthorized()",
  "error ScentProtocol__MaxSupplyReached()",
  "error ScentProtocol__MaxPerWalletReached()",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)",
];

export interface GenesisPerfume {
  name: string;
  gender: number;
  pType: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  concentration: number;
  rarity: number;
  createdAt: number;
  creator: string;
}

export type MintStage = 0 | 1 | 2 | 3 | 4; // 0 idle, 1 seal, 2 mature, 3 open, 4 done

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const readProvider = () => new ethers.JsonRpcProvider(RPC_URL);

function walletProvider(): ethers.BrowserProvider {
  const eth = (window as unknown as { ethereum?: ethers.Eip1193Provider }).ethereum;
  if (!eth) throw new Error("No wallet found. Connect a wallet first.");
  return new ethers.BrowserProvider(eth);
}

function seedMessage(address: string): string {
  return [
    "ScentProtocol Genesis: private reveal key",
    `Wallet: ${address.toLowerCase()}`,
    `Contract: ${GENESIS_CONTRACT_ADDRESS.toLowerCase()}`,
    "Signing creates your private reveal key. It costs no gas and moves no funds.",
  ].join("\n");
}

function toPerfume(p: any): GenesisPerfume {
  return {
    name: p.name,
    gender: Number(p.gender),
    pType: Number(p.pType),
    topNotes: Array.from(p.topNotes || []).map(String),
    heartNotes: Array.from(p.heartNotes || []).map(String),
    baseNotes: Array.from(p.baseNotes || []).map(String),
    concentration: Number(p.concentration),
    rarity: Number(p.rarity),
    createdAt: Number(p.createdAt),
    creator: p.creator,
  };
}

export function explain(err: unknown): string {
  const e = err as { code?: string | number; shortMessage?: string; reason?: string; message?: string; revert?: { name?: string } };
  if (e.code === 4001 || e.code === "ACTION_REJECTED") return "You rejected the request in your wallet.";
  const text = `${e.revert?.name ?? ""} ${e.reason ?? ""} ${e.shortMessage ?? ""} ${e.message ?? ""}`;
  if (/MaxPerWalletReached/.test(text)) return "This wallet already minted its Genesis.";
  if (/MaxSupplyReached/.test(text)) return "Genesis is sold out.";
  if (/TooEarly/.test(text)) return "Not ready yet. The network needs a few more seconds.";
  if (/TooLate/.test(text)) return "The reveal window passed for this mint.";
  if (/CommitmentMismatch/.test(text)) return "The reveal key does not match this mint.";
  return (e.reason || e.shortMessage || e.message || "Something went wrong.").slice(0, 200);
}

export function useGenesisMint(address: string | undefined) {
  const [minted, setMinted] = useState(0);
  const [supplyLoaded, setSupplyLoaded] = useState(false);
  const [userMinted, setUserMinted] = useState(0);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [myToken, setMyToken] = useState<{ id: number; perfume: GenesisPerfume } | null>(null);
  const [stage, setStage] = useState<MintStage>(0);
  const [blocksDone, setBlocksDone] = useState(0);
  const [result, setResult] = useState<{ id: number; perfume: GenesisPerfume } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Supply is public, so visitors see it before connecting a wallet.
  const loadSupply = useCallback(async () => {
    try {
      const c = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, readProvider());
      const remaining = Number(await c.getRemainingSupply());
      if (alive.current) {
        setMinted(MAX_SUPPLY - remaining);
        setSupplyLoaded(true);
      }
    } catch (e) {
      console.warn("Supply read failed:", e);
    }
  }, []);

  useEffect(() => {
    void loadSupply();
    const id = setInterval(loadSupply, 20000);
    return () => clearInterval(id);
  }, [loadSupply]);

  // ✅ FIXED: The wallet's own state logic. Prevents false ownership assignment.
  const loadWallet = useCallback(async () => {
    if (!address) {
      setUserMinted(0);
      setPendingId(null);
      setMyToken(null);
      return;
    }
    try {
      const c = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, readProvider());
      
      // 1. Get the exact mint count for this specific address from the contract
      const count = Number(await c.getWalletMintedCount(address));
      if (!alive.current) return;
      
      setUserMinted(count);

      // ✅ CRITICAL FIX: If the wallet has 0 mints, clear state and exit immediately.
      // This prevents false positives when queryFilter falls back to checking all IDs.
      if (count === 0) {
        setPendingId(null);
        setMyToken(null);
        return;
      }

      // 2. If count > 0, find the specific token ID belonging to this wallet
      let ids: number[] = [];
      try {
        const latest = await readProvider().getBlockNumber();
        const logs = await c.queryFilter(c.filters.MintRequested(null, address), Math.max(0, latest - 200000), latest);
        ids = logs.map((l) => Number((l as ethers.EventLog).args.tokenId));
      } catch {
        // Fallback: if RPC limits log queries, check all possible IDs safely
        const next = Number(await c.getNextTokenId());
        ids = Array.from({ length: Math.max(0, next - 1) }, (_, i) => i + 1);
      }

      let pending: number | null = null;
      let ownedId: number | null = null;

      // Check candidates, strictly verifying the owner/creator address
      for (const id of ids) {
        // First, check if there is an unrevealed pending mint for this wallet
        try {
          const p = await c.getPendingMint(id);
          if (String(p.minter).toLowerCase() === address.toLowerCase()) {
            pending = id;
            break; // Found the pending mint, no need to check further
          }
        } catch {
          // No pending mint for this ID, continue checking
        }

        // If no pending mint, check if an already revealed token belongs to this wallet
        if (pending === null) {
          try {
            const perfumeData = await c.getPerfume(id);
            // Verify ownership by checking the creator field against the current address
            if (String(perfumeData.creator).toLowerCase() === address.toLowerCase()) {
              ownedId = id;
              break; // Found the owned token, stop searching
            }
          } catch {
            // Token might not be revealed yet or doesn't exist, ignore and continue
          }
        }
      }

      if (!alive.current) return;
      
      setPendingId(pending);

      if (ownedId !== null) {
        try {
          const perfumeData = await c.getPerfume(ownedId);
          if (alive.current) {
            setMyToken({ id: ownedId, perfume: toPerfume(perfumeData) });
          }
        } catch {
          // Ignore parsing errors
        }
      }
    } catch (e) {
      console.warn("Wallet state read failed:", e);
    }
  }, [address]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const waitForBlocks = async (provider: ethers.Provider, from: number) => {
    for (;;) {
      if (!alive.current) throw new Error("cancelled");
      const done = Math.max(0, (await provider.getBlockNumber()) - from);
      setBlocksDone(Math.min(done, REVEAL_BLOCKS));
      if (done >= REVEAL_BLOCKS) return;
      await sleep(600);
    }
  };

  // Reveal, read the result and pin its metadata. Pinning never blocks the celebration.
  const revealAndLoad = async (c: ethers.Contract, id: number, preimage: string) => {
    await c.revealAndMint.staticCall(id, preimage);
    await (await c.revealAndMint(id, preimage)).wait();
    localStorage.removeItem(`genesis_preimage_${id}`);
    let data;
    for (let i = 0; i < 6; i++) {
      try {
        data = await c.getPerfume(id);
        break;
      } catch (e) {
        if (i === 5) throw e;
        await sleep(1200);
      }
    }
    const perfume = toPerfume(data);
    void fetch("/api/pin-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenId: id,
        contractAddress: GENESIS_CONTRACT_ADDRESS,
        perfumeData: {
          name: perfume.name,
          rarity: perfume.rarity,
          gender: perfume.gender,
          pType: perfume.pType,
          concentration: perfume.concentration,
          topNotes: perfume.topNotes,
          heartNotes: perfume.heartNotes,
          baseNotes: perfume.baseNotes,
        },
      }),
    }).catch((e) => console.warn("IPFS pinning failed, but the NFT is minted:", e));
    return perfume;
  };

  const finish = (id: number, perfume: GenesisPerfume) => {
    setResult({ id, perfume });
    setMyToken({ id, perfume });
    setPendingId(null);
    setStage(4);
    void loadSupply();
    void loadWallet();
  };

  const mint = async () => {
    if (!address) return;
    setError(null);
    setBlocksDone(0);
    setStage(1);
    try {
      const provider = walletProvider();
      const signer = await provider.getSigner();
      const c = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, signer);
      const preimage = ethers.keccak256(await signer.signMessage(seedMessage(address)));
      const commitment = ethers.keccak256(preimage);

      await c.requestMint.staticCall(commitment);
      const receipt = await (await c.requestMint(commitment)).wait();
      const ev = receipt.logs
        .map((l: ethers.Log) => {
          try {
            return c.interface.parseLog(l);
          } catch {
            return null;
          }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "MintRequested");
      if (!ev) throw new Error("Mint requested, but the token id was not found. Reload and use Finish reveal.");
      const id = Number(ev.args.tokenId);
      localStorage.setItem(`genesis_preimage_${id}`, preimage);
      setPendingId(id);

      setStage(2);
      await waitForBlocks(provider, receipt.blockNumber);
      setStage(3);
      finish(id, await revealAndLoad(c, id, preimage));
    } catch (e) {
      if ((e as Error).message === "cancelled") return;
      console.error("Genesis mint failed:", e);
      setError(explain(e));
      setStage(0);
      void loadWallet();
    }
  };

  // Finish an unrevealed mint, even after a refresh, a new browser or cleared storage.
  const resume = async () => {
    if (!address || pendingId === null) return;
    setError(null);
    setStage(3);
    try {
      const provider = walletProvider();
      const signer = await provider.getSigner();
      const c = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, signer);
      const stored = localStorage.getItem(`genesis_preimage_${pendingId}`);
      const candidates: string[] = stored ? [stored] : [];
      const derived = async () => ethers.keccak256(await signer.signMessage(seedMessage(address)));

      let chosen: string | null = null;
      for (let attempt = 0; attempt < 12 && !chosen; attempt++) {
        if (candidates.length === 0) candidates.push(await derived());
        for (const pre of candidates) {
          try {
            await c.revealAndMint.staticCall(pendingId, pre);
            chosen = pre;
            break;
          } catch (e) {
            const name = (e as { revert?: { name?: string } }).revert?.name ?? "";
            if (name.includes("CommitmentMismatch") && candidates.length === 1 && stored) candidates.push(await derived());
          }
        }
        if (!chosen) await sleep(1500);
      }
      if (!chosen) throw new Error("Could not finish the reveal. If this mint is old, its reveal window may have closed.");
      finish(pendingId, await revealAndLoad(c, pendingId, chosen));
    } catch (e) {
      console.error("Genesis resume failed:", e);
      setError(explain(e));
      setStage(0);
    }
  };

  return { 
    minted, 
    supplyLoaded, 
    userMinted, 
    pendingId, 
    myToken, 
    stage, 
    blocksDone, 
    blocksTotal: REVEAL_BLOCKS, 
    result, 
    error, 
    setError, 
    mint, 
    resume, 
    clearResult: () => setResult(null), 
    setStage 
  };
}
