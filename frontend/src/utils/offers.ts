// Finds the purchase offers that are open right now on the marketplace.
//
// The marketplace has no list of offers, only OfferMade events, and the public Arc RPC answers
// only small log ranges. So this works in three layers:
//   1. Remember bidders found earlier (browser cache, shared with the NFT detail page).
//   2. Read new OfferMade events: the explorer log API in one request, or the RPC in small slow steps.
//   3. Ask the contract (getOffer) whether each candidate offer is open now. The contract is the truth:
//      cancelled, accepted, replaced and expired offers never count.
import { ethers } from "ethers";

export const MARKETPLACE_ADDRESS = ethers.getAddress("0xe7Cc5d3e31AB0b2F8f1bFAc0A3FeB17b37333120");
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.arc.io";
const OFFER_TOPIC = ethers.id("OfferMade(address,uint256,address,uint256,uint256)");
const MARKET_ABI = [
  "function getOffer(address nft, uint256 tokenId, address offerer) view returns (uint256 price, uint256 expiry, uint16 feeBps)",
];

export interface TokenRef {
  nft: string;
  tokenId: number;
}
export interface ActiveOffer {
  offerer: string;
  price: bigint; // USDC, 6 decimals
  expiry: number;
}

const keyOf = (nft: string, id: number | string) => `${nft.toLowerCase()}-${Number(id)}`;
const cacheKey = (nft: string, id: number | string) => `scent-offerers:${nft.toLowerCase()}:${id}`;
const CURSOR_KEY = "scent-offers-cursor";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readList(k: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(k) || "[]");
  } catch {
    return [];
  }
}

/** Remember a bidder so their offer is found even when log lookups fail. */
export function rememberOfferer(nft: string, tokenId: number | string, offerer: string) {
  const set = new Set(readList(cacheKey(nft, tokenId)));
  set.add(offerer.toLowerCase());
  localStorage.setItem(cacheKey(nft, tokenId), JSON.stringify([...set]));
}

type Found = Map<string, Set<string>>; // "nft-id" -> offerers

function addLog(found: Found, wanted: Set<string>, topics: string[]) {
  const nft = ("0x" + topics[1].slice(26)).toLowerCase();
  const id = Number(BigInt(topics[2]));
  const k = `${nft}-${id}`;
  if (!wanted.has(k)) return;
  if (!found.has(k)) found.set(k, new Set());
  found.get(k)!.add(("0x" + topics[3].slice(26)).toLowerCase());
}

/** All OfferMade logs since the last scan, in one request to the explorer. Returns the new cursor or null. */
async function scanWithExplorer(found: Found, wanted: Set<string>, fromBlock: number): Promise<number | null> {
  try {
    const params = new URLSearchParams({
      module: "logs", action: "getLogs", fromBlock: String(fromBlock), toBlock: "latest",
      address: MARKETPLACE_ADDRESS, topic0: OFFER_TOPIC,
    });
    const res = await fetch(`${EXPLORER_URL}/api?${params}`);
    const json = await res.json();
    if (!Array.isArray(json.result)) return null;
    let last = fromBlock;
    for (const log of json.result) {
      addLog(found, wanted, log.topics);
      last = Math.max(last, Number(log.blockNumber));
    }
    return last + 1;
  } catch {
    return null;
  }
}

/** Fallback: read the recent past from the RPC, one small range at a time, oldest first. */
async function scanWithRpc(found: Found, wanted: Set<string>, provider: ethers.Provider, fromBlock: number): Promise<number> {
  const latest = await provider.getBlockNumber();
  const CHUNK = 2000;
  const start = Math.max(fromBlock, latest - 100_000); // about 12 hours
  let cursor = start;
  let requests = 0;
  while (cursor <= latest && requests < 60) {
    const to = Math.min(latest, cursor + CHUNK - 1);
    let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      try {
        const logs = await provider.getLogs({ address: MARKETPLACE_ADDRESS, fromBlock: cursor, toBlock: to, topics: [OFFER_TOPIC] });
        for (const log of logs) addLog(found, wanted, [...log.topics]);
        ok = true;
      } catch {
        await sleep(300);
      }
    }
    if (!ok) break; // keep the cursor here and continue on the next visit
    cursor = to + 1;
    requests++;
    await sleep(120);
  }
  return cursor;
}

/** Open offers for the given tokens, keyed by "nft-tokenId" (lowercase). */
export async function loadActiveOffers(tokens: TokenRef[], provider: ethers.Provider): Promise<Map<string, ActiveOffer[]>> {
  const wanted = new Set(tokens.map((t) => keyOf(t.nft, t.tokenId)));
  const found: Found = new Map();

  // 1. what earlier visits already learned
  for (const t of tokens) {
    const list = readList(cacheKey(t.nft, t.tokenId));
    if (list.length) found.set(keyOf(t.nft, t.tokenId), new Set(list));
  }

  // 2. new events since the last scan
  try {
    const cursor = Number(localStorage.getItem(CURSOR_KEY) || 0);
    let next = await scanWithExplorer(found, wanted, cursor);
    if (next === null) next = await scanWithRpc(found, wanted, provider, cursor);
    localStorage.setItem(CURSOR_KEY, String(next));
  } catch {
    /* keep going with what we have */
  }
  for (const [k, offerers] of found) {
    const [nft, id] = [k.slice(0, k.lastIndexOf("-")), k.slice(k.lastIndexOf("-") + 1)];
    localStorage.setItem(cacheKey(nft, id), JSON.stringify([...offerers]));
  }

  // 3. the contract decides which offers are open
  const market = new ethers.Contract(MARKETPLACE_ADDRESS, MARKET_ABI, provider);
  const now = Math.floor(Date.now() / 1000);
  const checks: Array<() => Promise<void>> = [];
  const result = new Map<string, ActiveOffer[]>();
  for (const [k, offerers] of found) {
    const nft = ethers.getAddress(k.slice(0, k.lastIndexOf("-")));
    const id = Number(k.slice(k.lastIndexOf("-") + 1));
    for (const o of offerers) {
      checks.push(async () => {
        const offerer = ethers.getAddress(o);
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const [price, expiry] = await market.getOffer(nft, id, offerer);
            if (price > 0n && Number(expiry) > now) {
              const list = result.get(k) ?? [];
              list.push({ offerer, price, expiry: Number(expiry) });
              result.set(k, list);
            }
            return;
          } catch {
            await sleep(300 * (attempt + 1)); // the public RPC drops some calls under load
          }
        }
      });
    }
  }
  for (let i = 0; i < checks.length; i += 3) await Promise.all(checks.slice(i, i + 3).map((c) => c()));
  return result;
}
