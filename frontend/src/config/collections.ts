export interface CollectionConfig {
  id: string;
  name: string;
  contractAddress: string;
  badgeIcon: string; // emoji или SVG
  badgeColor: string; // tailwind class
  description: string;
  isGenesis: boolean;
}

export const COLLECTIONS: Record<string, CollectionConfig> = {
  genesis: {
    id: "genesis",
    name: "Genesis Collection",
    contractAddress: "0x32b8a68ba95F156FE902008c2f7d4692583Da4bf",
    badgeIcon: "🏆",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    description: "First 100 NFTs • Enhanced Legendary rate",
    isGenesis: true,
  },
  scentProtocol: {
    id: "scentProtocol",
    name: "ScentProtocol",
    contractAddress: "0x5a8EFf24A69200c9D7F7E80d6b72960c72024b63",
    badgeIcon: "",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "Main Collection • AI-generated fragrances",
    isGenesis: false,
  },
  // future collections...
};
