"use client";

// State and actions for the MFW 2026 paid mint (commit, 30 second wait, reveal, recover, refund).
// This contract waits on TIME (block.timestamp), not on blocks, and the reveal window is 10 minutes.
// The reveal secret comes from a free wallet signature, so a cleared browser cannot lose a mint.

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  DEADLINE, GENESIS_ADDRESS, MAX_PER_WALLET, MAX_SUPPLY, MFW_ABI, MFW_ADDRESS, MIN_WAIT, USDC_ABI, USDC_ADDRESS,
  explain, readProvider, seedMessage, sleep, toPerfume, walletProvider,
} from "./mfwChain";
import type { MfwPerfume } from "./mfwChain";

export { MAX_PER_WALLET, MAX_SUPPLY, MFW_ADDRESS, MIN_WAIT, DEADLINE };
export type { MfwPerfume };

export interface Pending {
  tokenId: number;
  timestamp: number;
}
export interface MintResult {
  tokenId: number;
  perfume: MfwPerfume;
  firstBadge: boolean;
}

const preimageKey = (id: number) => `mfw_preimage_${id}`;

export function useMfwMint(address: string | undefined, onArc: boolean) {
  const [minted, setMinted] = useState(0);
  const [supplyLoaded, setSupplyLoaded] = useState(false);
  const [walletMinted, setWalletMinted] = useState(0);
  const [isGenesis, setIsGenesis] = useState(false);
  const [hasBadge, setHasBadge] = useState(false);
  const [price, setPrice] = useState<bigint>(0n);
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [claimable, setClaimable] = useState<bigint>(0n);
  const [pending, setPending] = useState<Pending | null>(null);
  const [clockOffset, setClockOffset] = useState(0); // chain time minus local time, in seconds
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [busy, setBusy] = useState<null | "approve" | "mint" | "reveal" | "recover" | "claim">(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MintResult | null>(null);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 500);
    return () => clearInterval(id);
  }, []);
  const chainNow = now + clockOffset;

  const loadSupply = useCallback(async () => {
    try {
      const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, readProvider());
      const remaining = Number(await c.getRemainingSupply());
      if (live.current) {
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

  const findPending = useCallback(async (user: string, c: ethers.Contract): Promise<Pending | null> => {
    const next = Number(await c.getNextTokenId());
    const ids: number[] = [];
    for (let i = Math.max(1, next - 40); i < next; i++) ids.push(i);
    const rows = await Promise.all(ids.map((i) => c.pendingMints(i).then((p: ethers.Result) => ({ i, p })).catch(() => null)));
    for (const r of rows) {
      if (r && r.p.minter.toLowerCase() === user.toLowerCase()) return { tokenId: r.i, timestamp: Number(r.p.timestamp) };
    }
    return null;
  }, []);

  const refresh = useCallback(async () => {
    if (!address) return;
    try {
      const provider = readProvider();
      const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, provider);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
      const genesis = new ethers.Contract(GENESIS_ADDRESS, ["function balanceOf(address) view returns (uint256)"], provider);
      const [p, count, badge, refund, allow, gBal, block, pend] = await Promise.all([
        c.getMintPrice(address) as Promise<bigint>,
        c.getWalletMintedCount(address) as Promise<bigint>,
        c.hasExclusiveBadge(address) as Promise<boolean>,
        c.claimableRefunds(address) as Promise<bigint>,
        usdc.allowance(address, MFW_ADDRESS) as Promise<bigint>,
        genesis.balanceOf(address).catch(() => 0n) as Promise<bigint>,
        provider.getBlock("latest"),
        findPending(address, c),
      ]);
      if (!live.current) return;
      setPrice(p);
      setWalletMinted(Number(count));
      setHasBadge(badge);
      setClaimable(refund);
      setAllowance(allow);
      setIsGenesis(gBal > 0n);
      setPending(pend);
      if (block) setClockOffset(block.timestamp - Math.floor(Date.now() / 1000));
    } catch (e) {
      console.warn("Wallet state read failed:", e);
    }
  }, [address, findPending]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signer = async () => walletProvider().getSigner();

  const derivePreimage = async (user: string): Promise<string> => {
    const sig = await (await signer()).signMessage(seedMessage(user));
    return ethers.keccak256(sig);
  };

  const approve = async () => {
    if (!address || !onArc) return;
    setBusy("approve");
    setError(null);
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, await signer());
      const mintsLeft = Math.max(1, MAX_PER_WALLET - walletMinted);
      await (await usdc.approve(MFW_ADDRESS, price * BigInt(mintsLeft))).wait();
      await refresh();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(null);
    }
  };

  const mint = async () => {
    if (!address || !onArc) return;
    setBusy("mint");
    setError(null);
    try {
      const preimage = await derivePreimage(address);
      const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, await signer());
      const commitment = ethers.keccak256(preimage);
      await c.requestMint.staticCall(commitment);
      const receipt = await (await c.requestMint(commitment)).wait();
      let tokenId = 0;
      for (const log of receipt.logs) {
        try {
          const parsed = c.interface.parseLog(log);
          if (parsed?.name === "MintRequested") tokenId = Number(parsed.args.tokenId);
        } catch {
          /* log from another contract */
        }
      }
      if (!tokenId) throw new Error("The mint was requested, but its id could not be read. Reload the page to continue.");
      localStorage.setItem(preimageKey(tokenId), preimage);
      const block = await readProvider().getBlock(receipt.blockNumber);
      const ts = block ? block.timestamp : Math.floor(Date.now() / 1000) + clockOffset;
      if (block) setClockOffset(block.timestamp - Math.floor(Date.now() / 1000));
      setPending({ tokenId, timestamp: ts });
      void refresh();
    } catch (e) {
      console.error("Request failed:", e);
      setError(explain(e));
    } finally {
      setBusy(null);
    }
  };

  const reveal = async () => {
    if (!address || !pending) return;
    setBusy("reveal");
    setError(null);
    try {
      const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, await signer());
      const stored = localStorage.getItem(preimageKey(pending.tokenId));
      const candidates = stored ? [stored] : [await derivePreimage(address)];
      let chosen: string | null = null;
      for (const pre of candidates) {
        try {
          await c.revealAndMint.staticCall(pending.tokenId, pre);
          chosen = pre;
          break;
        } catch (e) {
          if (!/Invalid seed preimage/i.test(String((e as { reason?: string }).reason ?? e))) throw e;
        }
      }
      if (!chosen) chosen = await derivePreimage(address); // the stored secret did not match: try the signature one
      await (await c.revealAndMint(pending.tokenId, chosen)).wait();
      localStorage.removeItem(preimageKey(pending.tokenId));
      let perfume: MfwPerfume | null = null;
      for (let i = 0; i < 6 && !perfume; i++) {
        try {
          perfume = toPerfume(await new ethers.Contract(MFW_ADDRESS, MFW_ABI, readProvider()).getPerfume(pending.tokenId));
        } catch {
          await sleep(1500);
        }
      }
      if (!perfume) throw new Error("Minted, but the scent could not be loaded yet. Check your collection.");
      setResult({ tokenId: pending.tokenId, perfume, firstBadge: !hasBadge });
      setPending(null);
      void refresh();
      void loadSupply();
    } catch (e) {
      console.error("Reveal failed:", e);
      setError(explain(e));
    } finally {
      setBusy(null);
    }
  };

  // Give up a pending mint: 50% goes back as a claimable refund, 50% is kept as a penalty.
  const recover = async () => {
    if (!pending) return;
    setBusy("recover");
    setError(null);
    try {
      const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, await signer());
      await c.cancelMint.staticCall(pending.tokenId);
      await (await c.cancelMint(pending.tokenId)).wait();
      localStorage.removeItem(preimageKey(pending.tokenId));
      setPending(null);
      await refresh();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(null);
    }
  };

  const claim = async () => {
    setBusy("claim");
    setError(null);
    try {
      const c = new ethers.Contract(MFW_ADDRESS, MFW_ABI, await signer());
      await (await c.claimRefund()).wait();
      await refresh();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(null);
    }
  };

  const secondsSinceRequest = pending ? Math.max(0, chainNow - pending.timestamp) : 0;
  return {
    minted, supplyLoaded, walletMinted, isGenesis, hasBadge, price, allowance, claimable, pending, busy, error, result,
    needsApproval: price > 0n && allowance < price,
    secondsSinceRequest,
    canReveal: !!pending && secondsSinceRequest > MIN_WAIT && secondsSinceRequest <= DEADLINE,
    expired: !!pending && secondsSinceRequest > DEADLINE,
    approve, mint, reveal, recover, claim, refresh,
    clearResult: () => setResult(null),
    dismissError: () => setError(null),
  };
}
