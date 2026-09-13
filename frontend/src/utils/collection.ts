import { COLLECTIONS, getCollectionByAddress, getCollectionById, getAllCollections } from "@/config/collections";

export { COLLECTIONS, getCollectionByAddress, getCollectionById, getAllCollections };

export interface NFTWithCollection {
  tokenId: number;
  contractAddress: string;
  collection: ReturnType<typeof getCollectionByAddress>;
  metadata?: any;
}

export function detectCollection(contractAddress: string) {
  return getCollectionByAddress(contractAddress);
}

export function formatCollectionName(collection: ReturnType<typeof getCollectionByAddress>): string {
  if (!collection) return "Unknown";
  return `${collection.badgeIcon} ${collection.name}`.trim();
}
