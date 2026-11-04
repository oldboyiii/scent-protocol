import { 
  COLLECTIONS, 
  getCollectionByAddress, 
  getCollectionById, 
  getAllCollections,
  type CollectionConfig 
} from "@/config/collections";

// Re-export collection utilities for convenient access from a single file
export { COLLECTIONS, getCollectionByAddress, getCollectionById, getAllCollections };

export interface NFTWithCollection {
  tokenId: number;
  contractAddress: string;
  collection: CollectionConfig | undefined;
  metadata?: any;
}

/**
 * Detects the collection config based on the contract address.
 */
export function detectCollection(contractAddress: string): CollectionConfig | undefined {
  return getCollectionByAddress(contractAddress);
}

/**
 * Formats the collection name with its corresponding badge icon.
 */
export function formatCollectionName(collection: CollectionConfig | undefined): string {
  if (!collection) return "Unknown Collection";
  return `${collection.badgeIcon} ${collection.name}`.trim();
}

/**
 * Helper to check if a given contract address matches a specific collection ID.
 * Useful for conditional rendering (e.g., isHybrid, isViral).
 */
export function isSpecificCollection(contractAddress: string, collectionId: string): boolean {
  const collection = getCollectionByAddress(contractAddress);
  return collection?.id === collectionId;
}
