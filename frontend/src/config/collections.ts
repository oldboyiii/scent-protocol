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
    contractAddress: "0x32b8a68ba95F156FE902008c2f7d4692583Da4bf",
    badgeIcon: "🏆",
    badgeColor: "bg-amber-500/20 text-amber-300",
    borderColor: "border-amber-500/40",
    glowColor: "shadow-[0_0_40px_rgba(245,158,11,0.3)]",
    description: "Genesis Collection",
    isGenesis: true,
  },
  scentProtocol: {
    id: "scentProtocol",
    name: "ScentProtocol",
    contractAddress: "0x5a8EFf24A69200c9D7F7E80d6b72960c72024b63",
    badgeIcon: "",
    badgeColor: "bg-purple-500/20 text-purple-300",
    borderColor: "border-purple-500/40",
    glowColor: "shadow-[0_0_40px_rgba(168,85,247,0.3)]",
    description: "Main Collection",
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
