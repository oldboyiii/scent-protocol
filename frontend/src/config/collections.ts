export interface CollectionConfig {
  id: string;
  name: string;
  contractAddress: string;
  badgeIcon: string;
  badgeColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
  isGenesis: boolean;
}

export const COLLECTIONS: Record<string, CollectionConfig> = {
  genesis: {
    id: "genesis",
    name: "Genesis",
    contractAddress: "0x37D6a1c730B8DdbB70aD765B39b1edc5Dad12EF6",
    badgeIcon: "🏆",
    badgeColor: "bg-amber-500/20 text-amber-300",
    borderColor: "border-amber-500/40",
    glowColor: "shadow-[0_0_40px_rgba(251,191,36,0.3)]",
    description: "Genesis Collection",
    isGenesis: true,
  },
  scentProtocol: {
    id: "scentProtocol",
    name: "ScentProtocol",
    contractAddress: "0x87950a56456Df786A249F484e9E56dF00fF207cb",
    badgeIcon: "",
    badgeColor: "bg-purple-500/20 text-purple-300",
    borderColor: "border-purple-500/40",
    glowColor: "shadow-[0_0_40px_rgba(168,85,247,0.3)]",
    description: "Main Collection",
    isGenesis: false,
  },
  mfw: {
    id: "mfw",
    name: "MFW 2026",
    contractAddress: "0x2Eb16402a50EE92bc3012038A0059ac4e9f7dF20",
    badgeIcon: "👗",
    badgeColor: "bg-purple-500/20 text-purple-300",
    borderColor: "border-purple-500/40",
    glowColor: "shadow-[0_0_40px_rgba(168,85,247,0.3)]",
    description: "Milan Fashion Week 2026",
    isGenesis: false,
  },
  viral: {
    id: "viral",
    name: "Viral Scent",
    contractAddress: "0x55A3527C87190fa8456De46247b52214287e8688",
    badgeIcon: "🦠",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-300",
    borderColor: "border-fuchsia-500/40",
    glowColor: "shadow-[0_0_40px_rgba(217,70,239,0.3)]",
    description: "Viral Wallet Scent",
    isGenesis: false,
  },
  hybrid: {
    id: "hybrid",
    name: "Alchemy Hybrid",
    contractAddress: "0x388A5E0aF91eEEb4Efd6F38145a073B322e530A8",
    badgeIcon: "🧪",
    badgeColor: "bg-cyan-500/20 text-cyan-300",
    borderColor: "border-cyan-500/40",
    glowColor: "shadow-[0_0_40px_rgba(34,211,238,0.3)]",
    description: "Scent Alchemy Hybrid",
    isGenesis: false,
  },
};

export function getCollectionByAddress(address: string): CollectionConfig | undefined {
  return Object.values(COLLECTIONS).find(
    (col) => col.contractAddress.toLowerCase() === address.toLowerCase()
  );
}

export function getCollectionById(id: string): CollectionConfig | undefined {
  return COLLECTIONS[id];
}

export function getAllCollections(): CollectionConfig[] {
  return Object.values(COLLECTIONS);
}
