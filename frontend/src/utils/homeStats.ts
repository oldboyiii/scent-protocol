// Live numbers for the home page, read from the contracts. Nothing here is a made-up number:
// if a read fails, that number is simply left out.

import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.arc.io";
const MARKETPLACE = "0xe7Cc5d3e31AB0b2F8f1bFAc0A3FeB17b37333120";
const ALCHEMY = "0xe922c92423728b2092D61b6a9eD5ecA7d0e0B58D";

const COLLECTIONS = [
  "0x87950a56456Df786A249F484e9E56dF00fF207cb", // V3
  "0x37D6a1c730B8DdbB70aD765B39b1edc5Dad12EF6", // Genesis
  "0x2Eb16402a50EE92bc3012038A0059ac4e9f7dF20", // MFW 2026
  "0x55A3527C87190fa8456De46247b52214287e8688", // Viral
];

const NEXT_ABI = ["function getNextTokenId() view returns (uint256)"];
const ALCHEMY_ABI = ["function nextHybridId() view returns (uint256)"];
const MARKET_ABI = [
  "function getActiveListings(address nft) view returns (uint256[])",
  "function getListing(address nft, uint256 tokenId) view returns (address seller, uint256 price, uint256 expiry, uint16 feeBps)",
];

export interface HomeStats {
  /** Fragrances created across all collections (token counters minus the starting 1). */
  created: number | null;
  /** Listings that are for sale right now (not expired). */
  listed: number | null;
  /** Collections that have at least one fragrance. */
  collections: number | null;
}

const CACHE_KEY = "scent-home-stats-v1";
const CACHE_MS = 2 * 60 * 1000;

function readCache(): HomeStats | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, stats } = JSON.parse(raw) as { at: number; stats: HomeStats };
    return Date.now() - at < CACHE_MS ? stats : null;
  } catch {
    return null;
  }
}

/** Three live numbers. Never throws. */
export async function loadHomeStats(): Promise<HomeStats> {
  const cached = readCache();
  if (cached) return cached;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const counts: number[] = [];
  let anyRead = false;

  for (const address of COLLECTIONS) {
    try {
      const next = Number(await new ethers.Contract(address, NEXT_ABI, provider).getNextTokenId());
      counts.push(Math.max(0, next - 1));
      anyRead = true;
    } catch {
      /* this collection could not be read: leave it out */
    }
  }
  try {
    const next = Number(await new ethers.Contract(ALCHEMY, ALCHEMY_ABI, provider).nextHybridId());
    counts.push(Math.max(0, next - 1));
    anyRead = true;
  } catch {
    /* ignore */
  }

  let listed: number | null = null;
  try {
    const market = new ethers.Contract(MARKETPLACE, MARKET_ABI, provider);
    const now = Math.floor(Date.now() / 1000);
    let total = 0;
    for (const address of [...COLLECTIONS, ALCHEMY]) {
      try {
        const ids: bigint[] = await market.getActiveListings(address);
        for (const id of ids) {
          try {
            const l = await market.getListing(address, id);
            if (l.seller !== ethers.ZeroAddress && Number(l.expiry) > now) total++;
          } catch {
            /* skip this listing */
          }
        }
      } catch {
        /* nothing listed or call unavailable */
      }
    }
    listed = total;
  } catch {
    /* ignore */
  }

  const stats: HomeStats = {
    created: anyRead ? counts.reduce((a, b) => a + b, 0) : null,
    listed,
    collections: anyRead ? counts.filter((c) => c > 0).length : null,
  };
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), stats }));
  } catch {
    /* private mode: skip the cache */
  }
  return stats;
}
