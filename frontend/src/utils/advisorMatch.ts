export interface RankedListing {
  collection: string;
  tokenId: number;
  name: string;
  priceUsdc: string;
  matchedNotes: string[];
  score: number;
  href: string;
}

interface MoodAnalysis {
  recognized: boolean;
  gender?: number;
  pType: number;
  tags: string[];
  archetype: string;
  notes: { top: string[]; heart: string[]; base: string[] };
}

const KEYWORDS: Record<string, { tags: string[]; archetype: string; notes: { top: string[]; heart: string[]; base: string[] }; pType: number }> = {
  romantic: { tags: ["romantic", "elegant"], archetype: "The Romantic", notes: { top: ["Bergamot", "Rose"], heart: ["Jasmine", "Peony"], base: ["Vanilla", "Musk"] }, pType: 1 },
  date: { tags: ["romantic", "elegant"], archetype: "The Charmer", notes: { top: ["Orange", "Bergamot"], heart: ["Rose", "Jasmine"], base: ["Amber", "Vanilla"] }, pType: 1 },
  forest: { tags: ["woody", "earthy", "nature"], archetype: "The Explorer", notes: { top: ["Pine", "Bergamot"], heart: ["Lavender", "Cedar"], base: ["Vetiver", "Musk"] }, pType: 0 },
  rain: { tags: ["fresh", "earthy", "calm"], archetype: "The Dreamer", notes: { top: ["Lemon", "Aquatic"], heart: ["Lavender", "Violet"], base: ["Musk", "Vetiver"] }, pType: 2 },
  office: { tags: ["clean", "professional", "elegant"], archetype: "The Professional", notes: { top: ["Bergamot", "Lemon"], heart: ["Lavender", "Iris"], base: ["Musk", "Cedar"] }, pType: 1 },
  beach: { tags: ["fresh", "summer", "relaxed"], archetype: "The Free Spirit", notes: { top: ["Lemon", "Orange"], heart: ["Jasmine", "Aquatic"], base: ["Musk", "Amber"] }, pType: 2 },
  club: { tags: ["bold", "party", "intense"], archetype: "The Rebel", notes: { top: ["Orange", "Spicy"], heart: ["Leather", "Amber"], base: ["Oud", "Musk"] }, pType: 0 },
  winter: { tags: ["cozy", "warm", "elegant"], archetype: "The Guardian", notes: { top: ["Bergamot", "Spicy"], heart: ["Rose", "Cinnamon"], base: ["Vanilla", "Amber", "Oud"] }, pType: 0 },
  elegant: { tags: ["elegant", "refined", "luxury"], archetype: "The Sophisticate", notes: { top: ["Bergamot", "Lemon"], heart: ["Iris", "Rose"], base: ["Sandalwood", "Musk"] }, pType: 1 },
  fresh: { tags: ["fresh", "clean", "sport"], archetype: "The Athlete", notes: { top: ["Lemon", "Bergamot"], heart: ["Mint", "Aquatic"], base: ["Musk", "Cedar"] }, pType: 2 },
};

export function analyzeMood(text: string, selectedGender: number, variation: number = 0): MoodAnalysis {
  const lowerText = text.toLowerCase();
  const matchedKeys = Object.keys(KEYWORDS).filter(k => lowerText.includes(k));
  
  if (matchedKeys.length === 0) {
    return { recognized: false, pType: 1, tags: [], archetype: "Unknown", notes: { top: [], heart: [], base: [] } };
  }

  const tags = new Set<string>();
  const notes = { top: new Set<string>(), heart: new Set<string>(), base: new Set<string>() };
  let pTypeSum = 0;
  const archetypes: string[] = [];

  matchedKeys.forEach(key => {
    const data = KEYWORDS[key];
    data.tags.forEach(t => tags.add(t));
    data.notes.top.forEach(n => notes.top.add(n));
    data.notes.heart.forEach(n => notes.heart.add(n));
    data.notes.base.forEach(n => notes.base.add(n));
    pTypeSum += data.pType;
    archetypes.push(data.archetype);
  });

  const seed = text.length + variation;
  const shuffle = <T,>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed * (i + 1)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  return {
    recognized: true,
    gender: selectedGender,
    pType: Math.round(pTypeSum / matchedKeys.length),
    tags: shuffle(Array.from(tags)),
    archetype: archetypes[seed % archetypes.length],
    notes: {
      top: shuffle(Array.from(notes.top)).slice(0, 3),
      heart: shuffle(Array.from(notes.heart)).slice(0, 3),
      base: shuffle(Array.from(notes.base)).slice(0, 3),
    }
  };
}

export function seedFor(text: string, variation: number): string {
  return `${text.toLowerCase().replace(/\s+/g, '-')}-v${variation}`;
}

export function rankListings(mood: MoodAnalysis, listings: any[], gender: number, limit: number): RankedListing[] {
  const scored = listings.map((listing: any) => {
    let score = 0;
    const matched: string[] = [];
    const allNotes = [...(listing.topNotes || []), ...(listing.heartNotes || []), ...(listing.baseNotes || [])];
    
    mood.tags.forEach(tag => {
      if (listing.name.toLowerCase().includes(tag) || listing.description?.toLowerCase().includes(tag)) {
        score += 10;
      }
    });

    allNotes.forEach(note => {
      if (mood.notes.top.includes(note) || mood.notes.heart.includes(note) || mood.notes.base.includes(note)) {
        score += 15;
        if (!matched.includes(note)) matched.push(note);
      }
    });

    const normalizedScore = Math.min(1, score / 50);

    return {
      collection: listing.collection || "V3",
      tokenId: listing.tokenId,
      name: listing.name,
      priceUsdc: listing.priceUsdc || "0.5",
      matchedNotes: matched,
      score: normalizedScore,
      href: `/nft/${listing.tokenId}?contract=${listing.contractAddress}`
    };
  });

  return scored
    .filter(l => l.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
