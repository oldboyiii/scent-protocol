// frontend/src/utils/marketListings.ts
//
// Loads the NFTs that are for sale right now, in a light form the Scent Advisor can rank.

import { ethers } from "ethers";
import type { AdvisorListing } from "./advisorMatch";

const RPC_URL = "https://rpc.mainnet.arc.io";
const MARKETPLACE = "0xe7Cc5d3e31AB0b2F8f1bFAc0A3FeB17b37333120";
const V3 = "0x87950a56456Df786A249F484e9E56dF00fF207cb";
const COLLECTIONS = [
  V3,
  "0x37D6a1c730B8DdbB70aD765B39b1edc5Dad12EF6", // Genesis
  "0x2Eb16402a50EE92bc3012038A0059ac4e9f7dF20", // MFW 2026
  "0x55A3527C87190fa8456De46247b52214287e8688", // Viral
  "0xe922c92423728b2092D61b6a9eD5ecA7d0e0B58D", // Alchemy hybrids
];
const ALCHEMY = "0xe922c92423728b2092D61b6a9eD5ecA7d0e0B58D";

const HYBRID_ABI = [
  "function getHybridPerfume(uint256 hybridId) view returns (tuple(uint256 hybridId, uint256 parentTokenId1, uint256 parentTokenId2, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address alchemist))",
];

const MARKET_ABI = [
  "function getActiveListings(address nft) view returns (uint256[])",
  "function getListing(address nft, uint256 tokenId) view returns (address seller, uint256 price, uint256 expiry, uint16 feeBps)",
];

const NFT_ABI = [
  "function getPerfume(uint256 tokenId) view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator))",
];

const MAX_LISTINGS = 60;
let cache: { at: number; items: AdvisorListing[] } | null = null;

export async function loadMarketListings(): Promise<AdvisorListing[]> {
  if (cache && Date.now() - cache.at < 120_000) return cache.items;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const market = new ethers.Contract(MARKETPLACE, MARKET_ABI, provider);
  const now = Math.floor(Date.now() / 1000);
  const items: AdvisorListing[] = [];

  for (const collection of COLLECTIONS) {
    if (items.length >= MAX_LISTINGS) break;
    let ids: bigint[] = [];
    try {
      ids = await market.getActiveListings(collection);
    } catch {
      continue; // this collection has nothing listed, or the call is unavailable
    }
    
    const isHybrid = collection.toLowerCase() === ALCHEMY.toLowerCase();
    const nft = new ethers.Contract(collection, isHybrid ? HYBRID_ABI : NFT_ABI, provider);
    
    for (let i = 0; i < ids.length && items.length < MAX_LISTINGS; i += 6) {
      const batch = ids.slice(i, i + 6);
      const loaded = await Promise.all(
        batch.map(async (id): Promise<AdvisorListing | null> => {
          try {
            const [listing, p] = await Promise.all([
              market.getListing(collection, id), 
              isHybrid ? nft.getHybridPerfume(id) : nft.getPerfume(id)
            ]);
            
            if (listing.seller === ethers.ZeroAddress || Number(listing.expiry) <= now || !p?.name) return null;
            
            const tokenId = Number(id);
            return {
              collection,
              tokenId,
              name: String(p.name),
              rarity: Number(p.rarity),
              gender: Number(p.gender),
              pType: Number(p.pType),
              notes: [...Array.from(p.topNotes as string[]), ...Array.from(p.heartNotes as string[]), ...Array.from(p.baseNotes as string[])].map(String),
              priceUsdc: Number(ethers.formatUnits(listing.price, 6)),
              href: `/nft/${tokenId}?from=advisor&contract=${collection}`,
            };
          } catch {
            return null;
          }
        })
      );
      for (const l of loaded) if (l) items.push(l);
    }
  }

  cache = { at: Date.now(), items };
  return items;
}
