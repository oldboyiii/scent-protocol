interface MockListing {
  collection: string;
  tokenId: number;
  name: string;
  contractAddress: string;
  priceUsdc: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  description: string;
}

const MOCK_LISTINGS: MockListing[] = [
  {
    collection: "V3",
    tokenId: 42,
    name: "Midnight Rose",
    contractAddress: "0x87950a56456Df786A249F484e9E56dF00fF207cb",
    priceUsdc: "1.5",
    topNotes: ["Bergamot", "Rose"],
    heartNotes: ["Jasmine", "Peony"],
    baseNotes: ["Vanilla", "Musk"],
    description: "A romantic and elegant evening scent."
  },
  {
    collection: "Genesis",
    tokenId: 7,
    name: "Forest Rain",
    contractAddress: "0x37D6a1c730B8DdbB70aD765B39b1edc5Dad12EF6",
    priceUsdc: "2.0",
    topNotes: ["Pine", "Bergamot"],
    heartNotes: ["Lavender", "Cedar"],
    baseNotes: ["Vetiver", "Musk"],
    description: "Earthy, calm, and deeply woody."
  },
  {
    collection: "MFW",
    tokenId: 12,
    name: "Neon Club",
    contractAddress: "0x2Eb16402a50EE92bc3012038A0059ac4e9f7dF20",
    priceUsdc: "3.5",
    topNotes: ["Orange", "Spicy"],
    heartNotes: ["Leather", "Amber"],
    baseNotes: ["Oud", "Musk"],
    description: "Bold, intense, and perfect for the night."
  }
];

export async function loadMarketListings(): Promise<any[]> {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In the future, replace this with a real API call:
  // const res = await fetch('/api/marketplace/listings');
  // return res.json();
  
  return MOCK_LISTINGS;
}
