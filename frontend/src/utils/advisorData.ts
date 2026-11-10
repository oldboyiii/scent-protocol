// frontend/src/utils/advisorData.ts

export interface KnowledgeEntry {
  pType: number;
  intensity: number;
  gender?: number;
  tags: string[];
  notes: { top?: string[]; heart?: string[]; base?: string[] };
  archetype: string;
}

export const KNOWLEDGE_BASE: Record<string, KnowledgeEntry> = {
  romantic: { pType: 1, intensity: 2, gender: 1, tags: ["romantic", "elegant", "sweet"], notes: { top: ["Bergamot", "Rose"], heart: ["Jasmine", "Peony"], base: ["Vanilla", "Musk"] }, archetype: "The Romantic" },
  date: { pType: 1, intensity: 2, tags: ["romantic", "elegant", "sweet"], notes: { top: ["Orange", "Bergamot"], heart: ["Rose", "Jasmine"], base: ["Amber", "Vanilla"] }, archetype: "The Charmer" },
  work: { pType: 1, intensity: 1, tags: ["clean", "professional", "elegant"], notes: { top: ["Bergamot", "Lemon"], heart: ["Lavender", "Iris"], base: ["Musk", "Cedar"] }, archetype: "The Professional" },
  elegant: { pType: 1, intensity: 2, tags: ["elegant", "refined", "luxury"], notes: { top: ["Bergamot", "Lemon"], heart: ["Iris", "Rose"], base: ["Sandalwood", "Musk"] }, archetype: "The Sophisticate" },
  rebel: { pType: 0, intensity: 3, tags: ["bold", "party", "intense", "dark"], notes: { top: ["Orange", "Spicy"], heart: ["Leather", "Amber"], base: ["Oud", "Musk"] }, archetype: "The Rebel" },
  party: { pType: 0, intensity: 3, tags: ["bold", "party", "intense"], notes: { top: ["Orange", "Spicy"], heart: ["Leather", "Amber"], base: ["Oud", "Musk"] }, archetype: "The Party Animal" },
  sport: { pType: 2, intensity: 1, tags: ["fresh", "clean", "sport", "citrus"], notes: { top: ["Lemon", "Bergamot"], heart: ["Mint", "Aquatic"], base: ["Musk", "Cedar"] }, archetype: "The Athlete" },
  beach: { pType: 2, intensity: 1, tags: ["fresh", "summer", "relaxed", "aquatic"], notes: { top: ["Lemon", "Orange"], heart: ["Jasmine", "Aquatic"], base: ["Musk", "Amber"] }, archetype: "The Free Spirit" },
  luxury: { pType: 0, intensity: 3, tags: ["luxury", "rich", "elegant", "woody"], notes: { top: ["Saffron", "Bergamot"], heart: ["Rose", "Oud"], base: ["Amber", "Leather"] }, archetype: "The Aristocrat" },
  cozy: { pType: 1, intensity: 2, tags: ["warm", "comforting", "sweet", "soft"], notes: { top: ["Cinnamon"], heart: ["Vanilla Orchid"], base: ["Vanilla", "Tonka Bean"] }, archetype: "The Homebody" },
  artist: { pType: 2, intensity: 2, tags: ["creative", "earthy", "green", "mysterious"], notes: { top: ["Fig", "Bergamot"], heart: ["Iris", "Violet"], base: ["Vetiver", "Cedarwood"] }, archetype: "The Creator" },
  masculine: { pType: 0, intensity: 2, gender: 0, tags: ["woody", "spicy", "bold"], notes: { top: ["Black Pepper", "Bergamot"], heart: ["Lavender", "Geranium"], base: ["Vetiver", "Cedarwood"] }, archetype: "The Gentleman" },
  feminine: { pType: 1, intensity: 2, gender: 1, tags: ["floral", "sweet", "elegant"], notes: { top: ["Pear", "Bergamot"], heart: ["Jasmine", "Rose"], base: ["Musk", "Vanilla"] }, archetype: "The Muse" },
};

export const NOTE_COLORS: Record<string, string> = {
  Bergamot: "#facc15", Lemon: "#facc15", Orange: "#fb923c", Grapefruit: "#f97316",
  Rose: "#f472b6", Jasmine: "#fde68a", Lavender: "#a78bfa", Peony: "#f9a8d4",
  Vanilla: "#f59e0b", Musk: "#d6d3d1", Oud: "#78350f", Vetiver: "#65a30d",
  Pine: "#166534", Amber: "#d97706", Floral: "#f472b6", Woody: "#78350f",
  Citrus: "#facc15", Fresh: "#38bdf8", Mint: "#4ade80", Cedar: "#92400e",
  "White Musk": "#e5e7eb", "Sea Notes": "#0ea5e9", "Tonka Bean": "#b45309",
};

export const CREATIVE_DESCRIPTIONS: Record<number, Record<number, string>> = {
  0: { 
    0: "A bold and intense statement.", 
    1: "Elegant with a powerful core.", 
    2: "Fresh yet undeniably strong.", 
    3: "Light but leaves a lasting impression." 
  },
  1: { 
    0: "A captivating and intense allure.", 
    1: "Sophisticated and elegantly bold.", 
    2: "Crisp, fresh, and empowering.", 
    3: "Delicate, fresh, and effortlessly chic." 
  },
  2: { 
    0: "A universal, intense masterpiece.", 
    1: "Refined elegance for anyone.", 
    2: "Clean, fresh, and universally appealing.", 
    3: "Light, airy, and perfectly balanced." 
  },
};

export const TYPE_NAMES = ["Parfum", "EDP", "EDT", "EDC"];
export const GENDER_NAMES = ["Male", "Female", "Unisex"];
