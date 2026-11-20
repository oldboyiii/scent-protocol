// Reads the ScentEvolution companion contract.
// Nothing here changes an NFT: it only asks the contract how far a fragrance has aged.
import { ethers } from "ethers";

/** Set after you deploy ScentEvolution on Arc mainnet. Empty means "evolution is off". */
export const EVOLUTION_ADDRESS = process.env.NEXT_PUBLIC_EVOLUTION_ADDRESS ?? "";

export const EVOLUTION_ABI = [
  "function collectionKind(address) view returns (uint8)",
  "function effectiveRarityOf(address nft, uint256 tokenId) view returns (uint8)",
  "function evolutionOf(address nft, uint256 tokenId) view returns ((uint8 baseRarity, uint8 effectiveRarity, uint8 stage, string stageName, uint256 createdAt, uint256 ageSeconds, uint256 secondsToNextStage, string evolvedNote, bool streakActive, uint256 streakDays, bool streakBadge) result)",
  "function evolvedNoteOf(address nft, uint256 tokenId) view returns (string)",
  "function stage1Age() view returns (uint64)",
  "function stage2Age() view returns (uint64)",
  "function stage3Age() view returns (uint64)",
  "function stageOf(address nft, uint256 tokenId) view returns (uint8)",
  "function startStreak(address nft, uint256 tokenId)",
  "function streakBadgeAge() view returns (uint64)",
  "function streakOf(address nft, uint256 tokenId) view returns (address holder, uint256 since, bool active, uint256 streakDays, bool streakBadge)",
];

export interface Evolution {
  baseRarity: number;
  /** The rarity shown in the app: the base rarity, plus one tier once Vintage (never above Legendary). */
  effectiveRarity: number;
  /** 0 Fresh, 1 Aged, 2 Matured, 3 Vintage */
  stage: number;
  stageName: string;
  createdAt: number;
  ageDays: number;
  /** Days until the next stage, or null at Vintage. */
  daysToNextStage: number | null;
  /** The extra heart note unlocked at Aged, or null before that. */
  evolvedNote: string | null;
  streakActive: boolean;
  streakDays: number;
  streakBadge: boolean;
}

const DAY = 86400;
let cache = new Map<string, { at: number; value: Evolution | null }>();

/**
 * How far a fragrance has evolved, or null when evolution is off, the collection is not listed
 * in the contract, or the token cannot be read. Never throws, so a card can always render.
 */
export async function getEvolution(
  provider: ethers.Provider,
  nft: string,
  tokenId: number | bigint | string,
): Promise<Evolution | null> {
  if (!EVOLUTION_ADDRESS || !ethers.isAddress(EVOLUTION_ADDRESS)) return null;
  const key = `${nft.toLowerCase()}-${tokenId}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.value;

  let value: Evolution | null = null;
  try {
    const c = new ethers.Contract(EVOLUTION_ADDRESS, EVOLUTION_ABI, provider);
    const r = await c.evolutionOf(nft, tokenId);
    const next = Number(r.secondsToNextStage);
    value = {
      baseRarity: Number(r.baseRarity),
      effectiveRarity: Number(r.effectiveRarity),
      stage: Number(r.stage),
      stageName: String(r.stageName),
      createdAt: Number(r.createdAt),
      ageDays: Math.floor(Number(r.ageSeconds) / DAY),
      daysToNextStage: Number(r.stage) >= 3 || next === 0 ? null : Math.ceil(next / DAY),
      evolvedNote: r.evolvedNote ? String(r.evolvedNote) : null,
      streakActive: Boolean(r.streakActive),
      streakDays: Number(r.streakDays),
      streakBadge: Boolean(r.streakBadge),
    };
  } catch {
    value = null;
  }
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Start the optional holding streak. Only the current owner can do this. */
export async function startHoldingStreak(signer: ethers.Signer, nft: string, tokenId: number | bigint | string) {
  if (!EVOLUTION_ADDRESS) throw new Error("Evolution is not enabled yet.");
  const c = new ethers.Contract(EVOLUTION_ADDRESS, EVOLUTION_ABI, signer);
  await c.startStreak.staticCall(nft, tokenId);
  const tx = await c.startStreak(nft, tokenId);
  await tx.wait();
  cache = new Map();
}
