// Pure frontend calculation for scent evolution based on creation time.
// No network calls required, as the base contract already provides `createdAt` and `rarity`.

export const STAGE_THRESHOLDS = {
  AGED: 30 * 24 * 60 * 60,    // 30 days in seconds
  MATURED: 90 * 24 * 60 * 60, // 90 days
  VINTAGE: 180 * 24 * 60 * 60,// 180 days
};

export const EVOLVED_NOTES = [
  "Aged Oud", "Amber Resin", "Vintage Leather", "Smoked Vetiver",
  "Aged Sandalwood", "Honeyed Benzoin", "Tobacco Leaf", "Dried Rose", 
  "Black Tea", "Cognac Wood"
];

export interface Evolution {
  baseRarity: number;
  effectiveRarity: number;
  stage: number; // 0: Fresh, 1: Aged, 2: Matured, 3: Vintage
  stageName: string;
  createdAt: number;
  ageDays: number;
  daysToNextStage: number | null;
  evolvedNote: string | null;
  // Streak fields (will be populated later when contract is integrated)
  streakActive: boolean;
  streakDays: number;
  streakBadge: boolean;
}

/**
 * Calculates evolution purely on the frontend using the NFT's creation timestamp.
 */
export function calculateEvolution(
  createdAt: number, 
  baseRarity: number, 
  tokenId: number | string
): Evolution {
  const now = Math.floor(Date.now() / 1000);
  const ageSeconds = Math.max(0, now - Number(createdAt));
  const ageDays = Math.floor(ageSeconds / 86400);

  let stage = 0;
  let stageName = "Fresh";
  let effectiveRarity = baseRarity;
  let evolvedNote: string | null = null;
  let daysToNextStage: number | null = null;

  // Deterministic note selection (mimics contract's keccak256 modulo logic)
  const noteIndex = Number(tokenId) % 10;
  const selectedNote = EVOLVED_NOTES[noteIndex] || "Aged Oud";

  if (ageSeconds >= STAGE_THRESHOLDS.VINTAGE) {
    stage = 3;
    stageName = "Vintage";
    effectiveRarity = Math.min(baseRarity + 1, 3); // Cap at Legendary (3)
  } else if (ageSeconds >= STAGE_THRESHOLDS.MATURED) {
    stage = 2;
    stageName = "Matured";
    daysToNextStage = Math.ceil((STAGE_THRESHOLDS.VINTAGE - ageSeconds) / 86400);
  } else if (ageSeconds >= STAGE_THRESHOLDS.AGED) {
    stage = 1;
    stageName = "Aged";
    evolvedNote = selectedNote;
    daysToNextStage = Math.ceil((STAGE_THRESHOLDS.MATURED - ageSeconds) / 86400);
  } else {
    daysToNextStage = Math.ceil((STAGE_THRESHOLDS.AGED - ageSeconds) / 86400);
  }

  return {
    baseRarity,
    effectiveRarity,
    stage,
    stageName,
    createdAt: Number(createdAt),
    ageDays,
    daysToNextStage,
    evolvedNote,
    streakActive: false,
    streakDays: 0,
    streakBadge: false,
  };
}
