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

// ---------------------------------------------------------------------------------------------
// Local evolution (no network). The rules are fixed and public, so a card can work them out from
// the NFT's own creation time. This mirrors ScentEvolution.sol exactly (stages at 30, 90 and 180
// days, the evolved note chosen by keccak256(abi.encode(nft, tokenId)) % 10, +1 tier at Vintage).
// The contract stays the source of truth for the optional holding streak.
// ---------------------------------------------------------------------------------------------
export const EVOLUTION_STAGE_DAYS = [30, 90, 180] as const;
const STAGE_NAMES = ["Fresh", "Aged", "Matured", "Vintage"];
const NOTE_POOL = [
  "Aged Oud",
  "Amber Resin",
  "Vintage Leather",
  "Smoked Vetiver",
  "Aged Sandalwood",
  "Honeyed Benzoin",
  "Tobacco Leaf",
  "Dried Rose",
  "Black Tea",
  "Cognac Wood",
];

export function evolve(
  nft: string,
  tokenId: number | bigint | string,
  baseRarity: number,
  createdAt: number | bigint | string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Evolution | null {
  const created = Number(createdAt);
  if (!Number.isFinite(created) || created <= 0 || created > nowSeconds || !ethers.isAddress(nft)) return null;
  const age = nowSeconds - created;
  const [d1, d2, d3] = EVOLUTION_STAGE_DAYS;
  const stage = age >= d3 * DAY ? 3 : age >= d2 * DAY ? 2 : age >= d1 * DAY ? 1 : 0;
  const nextAt = stage === 0 ? d1 : stage === 1 ? d2 : stage === 2 ? d3 : null;
  const base = Math.min(Math.max(Number(baseRarity) || 0, 0), 3);

  let evolvedNote: string | null = null;
  if (stage > 0) {
    const hash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [nft.toLowerCase(), BigInt(tokenId)]),
    );
    evolvedNote = NOTE_POOL[Number(BigInt(hash) % BigInt(NOTE_POOL.length))];
  }

  return {
    baseRarity: base,
    effectiveRarity: base >= 3 ? 3 : stage === 3 ? base + 1 : base,
    stage,
    stageName: STAGE_NAMES[stage],
    createdAt: created,
    ageDays: Math.floor(age / DAY),
    daysToNextStage: nextAt === null ? null : Math.ceil((nextAt * DAY - age) / DAY),
    evolvedNote,
    streakActive: false,
    streakDays: 0,
    streakBadge: false,
  };
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
