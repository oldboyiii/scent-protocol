"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { 
  MFW_ADDRESS, 
  MAX_SUPPLY, 
  MFW_ABI, 
  explain, 
  toPerfume, 
  walletProvider,
  readProvider,
  sleep,
  seedMessage,
  MfwPerfume
} from "./mfwChain";

export type MintStage = 0 | 1 | 2 | 3 | 4;
const REVEAL_BLOCKS = 6;

export function useMfwMint(address: string | undefined, isGenesisHolder: boolean) {
  const [minted, setMinted] = useState(0);
  const [supplyLoaded, setSupplyLoaded] = useState(false);
  const [userMinted, setUserMinted] = useState(0);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [myToken, setMyToken] = useState<{ id: number; perfume: MfwPerfume } | null>(null);
  const [stage, setStage] = useState<MintStage>(0);
  const [blocksDone, setBlocksDone] = useState(0);
  const [result, setResult] = useState<{ id: number; perfume: MfwPerfume } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState({ regular: "0", genesis: "0" });
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const loadSupply = useCallback(async () => {
  try {
    const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, readProvider());
    const remaining = Number(await c.getRemainingSupply());
    
    if (alive.current) {
      setMinted(MAX_SUPPLY - remaining);
      setSupplyLoaded(true);
      
      // Read actual prices from contract
      try {
        // Get regular price (for non-Genesis holders)
        const regularPrice = await c.getMintPrice(ethers.ZeroAddress);
        // Get discounted price (for current wallet if Genesis holder)
        const genesisPrice = address ? await c.getMintPrice(address) : regularPrice;
        
        // Determine if contract uses USDC (6 decimals) or ETH (18 decimals)
        // Check by trying to parse as USDC first
        const isUSDC = regularPrice > ethers.parseEther("1");
        const decimals = isUSDC ? 6 : 18;
        
        setPrices({
          regular: ethers.formatUnits(regularPrice, decimals),
          genesis: ethers.formatUnits(genesisPrice, decimals),
        });
      } catch (e) {
        console.warn("Could not read prices from contract:", e);
        // Fallback: try to determine from contract balance or use defaults
        setPrices({ regular: "0", genesis: "0" });
      }
    }
  } catch (e) {
    console.warn("Supply read failed:", e);
  }
}, [address]);

  useEffect(() => {
    void loadSupply();
    const id = setInterval(loadSupply, 20000);
    return () => clearInterval(id);
  }, [loadSupply]);

  const loadWallet = useCallback(async () => {
  if (!address) {
    setUserMinted(0);
    setPendingId(null);
    setMyToken(null);
    return;
  }
  try {
    const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, readProvider());
    
    // Get actual minted count from contract
    let walletCount = 0;
    try {
      walletCount = Number(await c.getWalletMintedCount(address));
    } catch (e) {
      console.warn("getWalletMintedCount failed:", e);
    }
    setUserMinted(walletCount);

    // Find this wallet's mint events - use a tighter range
    let ids: number[] = [];
    try {
      const latest = await readProvider().getBlockNumber();
      // Only check last 100000 blocks (much tighter)
      const logs = await c.queryFilter(
        c.filters.MintRequested(null, address), 
        Math.max(0, latest - 100000), 
        latest
      );
      ids = logs.map((l) => {
        const event = l as ethers.EventLog;
        return Number(event.args.tokenId);
      });
      console.log("Found MFW mint events for this wallet:", ids);
    } catch (e) {
      console.warn("Event query failed:", e);
      // Fallback: check only recent token IDs (last 50)
      const next = Number(await c.getNextTokenId());
      ids = Array.from({ length: Math.min(50, Math.max(0, next - 1)) }, (_, i) => next - 1 - i);
    }
    
    // Check for pending mints ONLY among this wallet's own events
    let pending: number | null = null;
    const owned: number[] = [];
    
    for (const id of ids) {
      try {
        const p = await c.pendingMints(id);
        // Strict check: minter must match AND blockNumber must be recent
        const minter = String(p.minter).toLowerCase();
        if (minter === address.toLowerCase() && Number(p.blockNumber) > 0) {
          pending = id;
          console.log("Found pending mint:", id);
        }
      } catch {
        // No pending mint for this id - that's fine
      }
    }
    
    // Owned tokens are those in our event list that aren't pending
    for (const id of ids) {
      if (id !== pending) owned.push(id);
    }
    
    if (!alive.current) return;
    setPendingId(pending);
    
    // Only set myToken if we actually found owned tokens
    const last = owned[owned.length - 1];
    if (last !== undefined && walletCount > 0) {
      try {
        const perfume = toPerfume(await c.getPerfume(last));
        if (alive.current) setMyToken({ id: last, perfume });
        console.log("Set myToken:", last, perfume.name);
      } catch (e) {
        console.warn("Could not read perfume for token", last, e);
      }
    } else {
      // No owned tokens - clear everything
      if (alive.current) setMyToken(null);
    }
  } catch (e) {
    console.warn("Wallet state read failed:", e);
  }
}, [address]);

  useEffect(() => { void loadWallet(); }, [loadWallet]);

  const waitForBlocks = async (provider: ethers.Provider, from: number) => {
    for (;;) {
      if (!alive.current) throw new Error("cancelled");
      const done = Math.max(0, (await provider.getBlockNumber()) - from);
      setBlocksDone(Math.min(done, REVEAL_BLOCKS));
      if (done >= REVEAL_BLOCKS) return;
      await sleep(600);
    }
  };

  const revealAndLoad = async (c: ethers.Contract, id: number, preimage: string) => {
    await c.revealAndMint.staticCall(id, preimage);
    await (await c.revealAndMint(id, preimage)).wait();
    localStorage.removeItem(`mfw_preimage_${id}`);
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
    return toPerfume(data);
  };

  const finish = (id: number, perfume: MfwPerfume) => {
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
      const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, signer);
      const preimage = ethers.keccak256(await signer.signMessage(seedMessage(address)));
      const commitment = ethers.keccak256(preimage);
      
      // Replace with actual logic to get price from the contract
      const price = isGenesisHolder ? prices.genesis : prices.regular;
      const value = ethers.parseEther(price);

      await c.requestMint.staticCall(commitment, { value });
      const receipt = await (await c.requestMint(commitment, { value })).wait();
      const ev = receipt.logs.map((l: ethers.Log) => {
        try { return c.interface.parseLog(l); } catch { return null; }
      }).find((e: any) => e?.name === "MintRequested");
      
      if (!ev) throw new Error("Mint requested, but token ID not found. Reload and use Finish reveal.");
      const id = Number(ev.args.tokenId);
      localStorage.setItem(`mfw_preimage_${id}`, preimage);
      setPendingId(id);

      setStage(2);
      await waitForBlocks(provider, receipt.blockNumber);
      setStage(3);
      finish(id, await revealAndLoad(c, id, preimage));
    } catch (e) {
      if ((e as Error).message === "cancelled") return;
      console.error("MFW mint failed:", e);
      setError(explain(e));
      setStage(0);
      void loadWallet();
    }
  };

  const resume = async () => {
    if (!address || pendingId === null) return;
    setError(null);
    setStage(3);
    try {
      const provider = walletProvider();
      const signer = await provider.getSigner();
      const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, signer);
      const stored = localStorage.getItem(`mfw_preimage_${pendingId}`);
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
      if (!chosen) throw new Error("Could not finish the reveal. The 10-minute window may have closed.");
      finish(pendingId, await revealAndLoad(c, pendingId, chosen));
    } catch (e) {
      console.error("MFW resume failed:", e);
      setError(explain(e));
      setStage(0);
    }
  };

  const claimRefund = async () => {
    if (!address || pendingId === null) return;
    setError(null);
    try {
      const provider = walletProvider();
      const signer = await provider.getSigner();
      const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, signer);
      await (await c.claimRefund()).wait();
      localStorage.removeItem(`mfw_preimage_${pendingId}`);
      setPendingId(null);
      void loadWallet();
      void loadSupply();
    } catch (e) {
      console.error("Refund failed:", e);
      setError(explain(e));
    }
  };

  return { 
    minted, supplyLoaded, userMinted, pendingId, myToken, stage, blocksDone, 
    blocksTotal: REVEAL_BLOCKS, result, error, setError, mint, resume, claimRefund, 
    clearResult: () => setResult(null), setStage, prices 
  };
}
