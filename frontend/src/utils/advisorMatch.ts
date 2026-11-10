// frontend/src/utils/advisorMatch.ts
//
// Mood analysis and NFT matching for the Scent Advisor. Pure functions, no network, easy to test.

import { KNOWLEDGE_BASE, type KnowledgeEntry } from "./advisorData";

export type Family = "citrus" | "green" | "floral" | "woody" | "sweet" | "spicy" | "musk" | "aquatic" | "smoky";

const EXTRA_ENTRIES: Record<string, KnowledgeEntry> = {
  forest: { pType: 2, intensity: 2, tags: ["green", "woody", "earthy", "fresh"], notes: { top: ["Eucalyptus", "Mint"], heart: ["Geranium"], base: ["Cedarwood", "Vetiver"] }, archetype: "The Wanderer" },
  rain: { pType: 2, intensity: 1, tags: ["green", "fresh", "musky", "calm"], notes: { top: ["Mint"], heart: ["Lavender"], base: ["Musk", "Vetiver"] }, archetype: "The Dreamer" },
  night: { pType: 0, intensity: 3, tags: ["dark", "amber", "smoky", "mysterious"], notes: { top: ["Thyme"], heart: ["Heliotrope"], base: ["Oud", "Amber", "Patchouli"] }, archetype: "The Night Owl" },
  morning: { pType: 3, intensity: 1, tags: ["citrus", "fresh", "light", "green"], notes: { top: ["Grapefruit", "Mint"], heart: ["Neroli"], base: ["Musk"] }, archetype: "The Early Bird" },
  evening: { pType: 1, intensity: 2, tags: ["warm", "romantic", "amber", "soft"], notes: { top: ["Bergamot"], heart: ["Rose", "Jasmine"], base: ["Amber", "Musk", "Vanilla"] }, archetype: "The Evening Muse" },
  afternoon: { pType: 2, intensity: 1, tags: ["fresh", "citrus", "light"], notes: { top: ["Orange", "Bergamot"], heart: ["Neroli"], base: ["Cedarwood", "Musk"] }, archetype: "The Optimist" },
  sunny: { pType: 3, intensity: 1, tags: ["citrus", "fresh", "tropical"], notes: { top: ["Grapefruit", "Lemon"], heart: ["Jasmine"], base: ["White Musk"] }, archetype: "The Free Spirit" },
  cloudy: { pType: 2, intensity: 1, tags: ["calm", "soft", "green"], notes: { top: ["Lavender"], heart: ["Chamomile"], base: ["Musk", "Cedarwood"] }, archetype: "The Thinker" },
  snow: { pType: 1, intensity: 2, tags: ["warm", "comforting", "soft"], notes: { top: ["Cinnamon"], heart: ["Vanilla Orchid"], base: ["Vanilla", "Tonka Bean"] }, archetype: "The Homebody" },
  fog: { pType: 1, intensity: 2, tags: ["mysterious", "calm", "earthy"], notes: { top: ["Lavender"], heart: ["Iris"], base: ["Vetiver", "Cedarwood"] }, archetype: "The Philosopher" },
  wind: { pType: 2, intensity: 1, tags: ["fresh", "green", "aromatic"], notes: { top: ["Mint", "Eucalyptus"], heart: ["Lavender"], base: ["Vetiver"] }, archetype: "The Wanderer" },
  hot: { pType: 3, intensity: 1, tags: ["fresh", "citrus", "aquatic"], notes: { top: ["Grapefruit", "Lemon"], heart: ["Sea Notes"], base: ["White Musk"] }, archetype: "The Free Spirit" },
  cold: { pType: 0, intensity: 3, tags: ["warm", "spicy", "comforting"], notes: { top: ["Cinnamon"], heart: ["Rose", "Oud"], base: ["Vanilla", "Amber"] }, archetype: "The Mystic" },
};

const EN_ALIASES: Array<[string[], string]> = [
  [["dusk", "sunset", "twilight", "tonight"], "evening"], [["midnight"], "night"], [["dawn", "sunrise", "breakfast"], "morning"],
  [["noon", "lunch"], "afternoon"], [["sun", "clear"], "sunny"], [["overcast", "grey", "gray"], "cloudy"], [["blizzard", "frost"], "snow"],
  [["mist", "haze", "foggy"], "fog"], [["breez", "gust"], "wind"], [["drizzl", "shower", "storm", "thunder", "wet"], "rain"],
  [["heat", "scorch", "warm"], "hot"], [["chill", "freez", "icy"], "cold"],
];

const SITUATIONAL = new Set(["morning", "afternoon", "evening", "night", "sunny", "cloudy", "snow", "fog", "wind", "hot", "cold", "rain"]);

export function seasonWord(date: Date = new Date()): string {
  const m = date.getMonth();
  return m === 11 || m <= 1 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn";
}

const ALL: Record<string, KnowledgeEntry> = { ...KNOWLEDGE_BASE, ...EXTRA_ENTRIES };

const FAMILY_WORDS: Record<Family, string[]> = {
  citrus: ["bergamot", "lemon", "orange", "grapefruit", "mandarin", "lime", "citrus", "pineapple", "coconut"],
  green: ["mint", "eucalyptus", "basil", "rosemary", "thyme", "lavender", "moss", "green", "apple", "geranium"],
  floral: ["rose", "jasmine", "lily", "neroli", "ylang", "chamomile", "petitgrain", "heliotrope", "peony", "violet", "iris", "tuberose", "gardenia", "freesia", "orchid", "floral", "raspberry"],
  woody: ["sandalwood", "cedar", "vetiver", "oud", "patchouli", "oakmoss", "driftwood", "woods"],
  sweet: ["vanilla", "tonka", "benzoin", "amber", "honey", "caramel"],
  spicy: ["pepper", "cinnamon", "saffron", "ginger", "clove"],
  musk: ["musk"],
  aquatic: ["sea", "marine", "aquatic", "salt"],
  smoky: ["leather", "tobacco", "incense", "smoke", "absinthe"],
};

const TAG_FAMILIES: Record<string, Family[]> = {
  fresh: ["citrus", "green"], light: ["citrus", "musk"], citrus: ["citrus"], floral: ["floral"], green: ["green"], clean: ["citrus", "musk"],
  warm: ["sweet", "woody"], woody: ["woody"], spicy: ["spicy"], sweet: ["sweet"], romantic: ["floral", "sweet"], seductive: ["sweet", "musk"],
  earthy: ["woody", "green"], mysterious: ["woody", "smoky"], bold: ["spicy", "woody"], dark: ["smoky", "woody"], amber: ["sweet"],
  aquatic: ["aquatic"], salty: ["aquatic"], tropical: ["citrus"], leathery: ["smoky"], aromatic: ["green"], rich: ["woody", "sweet"], soft: ["musk", "floral"],
  tender: ["floral", "musk"], comforting: ["sweet", "musk"], elegant: ["floral", "woody"], musky: ["musk"], smoky: ["smoky"], calm: ["musk", "green"],
};

export function familyOf(note: string): Family | null {
  const n = note.toLowerCase();
  for (const f of Object.keys(FAMILY_WORDS) as Family[]) if (FAMILY_WORDS[f].some((w) => n.includes(w))) return f;
  return null;
}

export interface MoodAnalysis {
  recognized: boolean;
  keywords: string[];
  tags: string[];
  notes: { top: string[]; heart: string[]; base: string[] };
  archetype: string;
  pType: number;
  gender?: number;
  families: Partial<Record<Family, number>>;
}

function tokens(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
}

function keywordsFor(text: string): string[] {
  const hits = new Map<string, number>();
  for (const t of tokens(text)) {
    for (const key of Object.keys(ALL)) if (t === key || (t.length > 4 && t.startsWith(key))) hits.set(key, (hits.get(key) ?? 0) + 1);
    for (const [stems, key] of EN_ALIASES) if (stems.some((s) => t.startsWith(s))) hits.set(key, (hits.get(key) ?? 0) + 1);
  }
  const found = Array.from(hits.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  
  const impliesSeason = found.some((k) => ["snow", "cold", "hot", "sunny"].includes(k));
  if (found.length > 0 && !impliesSeason && found.every((k) => SITUATIONAL.has(k))) {
    const season = seasonWord();
    if (!found.includes(season)) found.push(season);
  }
  return found;
}

function rank(lists: string[][], size: number, shift: number): string[] {
  const count = new Map<string, number>();
  lists.flat().forEach((n) => count.set(n, (count.get(n) ?? 0) + 1));
  const ordered = Array.from(count.entries()).sort((a, b) => b[1] - a[1]).map(([n]) => n);
  if (ordered.length === 0) return [];
  const start = shift % ordered.length;
  return [...ordered.slice(start), ...ordered.slice(0, start)].slice(0, size);
}

export function analyzeMood(text: string, selectedGender = 0, variation = 0): MoodAnalysis {
  const keywords = keywordsFor(text);
  const entries = keywords.map((k) => ALL[k]).filter((e): e is KnowledgeEntry => e !== undefined);
  
  if (entries.length === 0) {
    return {
      recognized: false,
      keywords: [],
      tags: [],
      notes: { top: [], heart: [], base: [] },
      archetype: "The Explorer",
      pType: 2,
      gender: selectedGender,
      families: {},
    };
  }
  
  const families: Partial<Record<Family, number>> = {};
  const bump = (f: Family, w: number) => { families[f] = (families[f] ?? 0) + w; };
  
  entries.forEach((e, i) => {
    const weight = 1 / (i + 1);
    e.tags.forEach((t) => (TAG_FAMILIES[t] ?? []).forEach((f) => bump(f, weight)));
    [...(e.notes.top ?? []), ...(e.notes.heart ?? []), ...(e.notes.base ?? [])].forEach((n) => { const f = familyOf(n); if (f) bump(f, weight * 0.5); });
  });
  
  const notes = {
    top: rank(entries.map((e) => e.notes.top ?? []), 3, variation),
    heart: rank(entries.map((e) => e.notes.heart ?? []), 3, variation),
    base: rank(entries.map((e) => e.notes.base ?? []), 3, variation),
  };
  const gendered = entries.find((e) => e.gender !== undefined);
  const pTypes = entries.map((e) => e.pType).filter((p): p is number => p !== undefined);
  
  return {
    recognized: keywords.length > 0,
    keywords,
    tags: Array.from(new Set(entries.flatMap((e) => e.tags))).slice(0, 4),
    notes,
    archetype: entries.find((e) => e.archetype)?.archetype ?? "The Explorer",
    pType: pTypes.length ? Math.min(...pTypes) : 2,
    gender: gendered ? gendered.gender : selectedGender,
    families,
  };
}

export function seedFor(text: string, variation: number): string {
  let h = 2166136261;
  for (const c of `${text.trim().toLowerCase()}|${variation}`) h = Math.imul(h ^ c.codePointAt(0)!, 16777619) >>> 0;
  return `${text.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 24)}-${h.toString(16)}`;
}

export function moodWordsFromWeather(w: { condition: string; isNight: boolean; tempC: number | null }): string {
  const words: string[] = [];
  if (w.condition === "rain" || w.condition === "drizzle" || w.condition === "thunder") words.push("rain", "cozy");
  else if (w.condition === "snow") words.push("winter", "cozy");
  else if (w.condition === "fog") words.push("autumn", "mysterious");
  else if (w.tempC !== null && w.tempC >= 24) words.push("summer", "beach");
  else if (w.tempC !== null && w.tempC <= 5) words.push("winter");
  else words.push("morning");
  if (w.isNight) words.push("night");
  return words.join(" ");
}

export interface AdvisorListing {
  collection: string;
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  notes: string[];
  priceUsdc: number;
  href: string;
}

export interface RankedListing extends AdvisorListing {
  score: number;
  matchedNotes: string[];
}

export function rankListings(mood: MoodAnalysis, listings: AdvisorListing[], selectedGender = 0, limit = 3): RankedListing[] {
  const wanted = Object.entries(mood.families) as Array<[Family, number]>;
  const total = wanted.reduce((s, [, w]) => s + w, 0);
  if (total === 0) return [];
  const weight = new Map(wanted);
  
  return listings
    .map((l) => {
      const matched: string[] = [];
      let fit = 0;
      for (const n of l.notes) {
        const f = familyOf(n);
        const w = f ? weight.get(f) ?? 0 : 0;
        if (w > 0) { matched.push(n); fit += w / total; }
      }
      let score = Math.min(1, fit / 3);
      if (selectedGender !== 0 && l.gender === selectedGender) score += 0.1;
      if (Math.abs(l.pType - mood.pType) <= 1) score += 0.05;
      score += l.rarity * 0.01;
      return { ...l, score: Math.min(1, score), matchedNotes: matched.slice(0, 4) };
    })
    .filter((l) => l.matchedNotes.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
