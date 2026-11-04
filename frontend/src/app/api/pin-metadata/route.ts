import { NextResponse } from "next/server";

// Updated to new deployed contract addresses
const CONTRACT_MAP: Record<string, string> = {
  "0x87950a56456df786a249f484e9e56df00ff207cb": "ScentProtocol V3",
  "0x37d6a1c730b8ddbb70ad765b39b1edc5dad12ef6": "Genesis",
  "0x55a3527c87190fa8456de46247b52214287e8688": "Viral",
  "0x2eb16402a50ee92bc3012038a0059ac4e9f7df20": "MFW 2026",
  "0xd5c962b1dbaa6044e88b4c2bbe2dd5a257702e40": "Alchemy Hybrids",
};

const RARITY_NAMES = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_NAMES = ["Unisex", "Male", "Female", "Other"];
const TYPE_NAMES = ["Parfum", "EDP", "EDT", "EDC"];

export async function POST(request: Request) {
  try {
    const { tokenId, contractAddress, perfumeData } = await request.json();

    if (!tokenId || !contractAddress || !perfumeData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedAddress = contractAddress.toLowerCase();
    const collectionName = CONTRACT_MAP[normalizedAddress];

    if (!collectionName) {
      return NextResponse.json(
        { success: false, error: "Unknown contract address" },
        { status: 400 }
      );
    }

    const rarityValue = Number(perfumeData.rarity);
    const genderValue = Number(perfumeData.gender);
    const pTypeValue = Number(perfumeData.pType);
    const concentrationValue = Number(perfumeData.concentration);

    const topNotes = Array.isArray(perfumeData.topNotes)
      ? perfumeData.topNotes.map((n: any) => String(n))
      : [];
    const heartNotes = Array.isArray(perfumeData.heartNotes)
      ? perfumeData.heartNotes.map((n: any) => String(n))
      : [];
    const baseNotes = Array.isArray(perfumeData.baseNotes)
      ? perfumeData.baseNotes.map((n: any) => String(n))
      : [];

    const description = [
      `A unique AI-generated ${collectionName} fragrance formula.`,
      `Top Notes: ${topNotes.join(", ") || "N/A"}.`,
      `Heart Notes: ${heartNotes.join(", ") || "N/A"}.`,
      `Base Notes: ${baseNotes.join(", ") || "N/A"}.`,
      `Concentration: ${concentrationValue}%. Type: ${TYPE_NAMES[pTypeValue] || "Unknown"}.`
    ].join(" ");

    const metadata = {
      name: `${collectionName} #${tokenId} - ${perfumeData.name}`,
      description,
      image: "https://scent-protocol-pi.vercel.app/og-image.png",
      external_url: `https://scent-protocol-pi.vercel.app/nft/${tokenId}`,
      attributes: [
        { trait_type: "Collection", value: collectionName },
        { trait_type: "Rarity", value: RARITY_NAMES[rarityValue] || "Unknown" },
        { trait_type: "Gender", value: GENDER_NAMES[genderValue] || "Unisex" },
        { trait_type: "Type", value: TYPE_NAMES[pTypeValue] || "Unknown" },
        { trait_type: "Concentration", value: `${concentrationValue}%` },
        { trait_type: "Top Notes", value: topNotes.join(", ") },
        { trait_type: "Heart Notes", value: heartNotes.join(", ") },
        { trait_type: "Base Notes", value: baseNotes.join(", ") }
      ]
    };

    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "pinata_api_key": process.env.PINATA_API_KEY!,
        "pinata_secret_api_key": process.env.PINATA_SECRET_KEY!,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `ScentProtocol_${collectionName.replace(/\s+/g, '_')}_Token_${tokenId}`,
          keyvalues: {
            contract: contractAddress,
            tokenId: String(tokenId),
            collection: collectionName
          }
        }
      })
    });

    const pinataData = await pinataResponse.json();

    if (!pinataResponse.ok) {
      throw new Error(pinataData.error || "Failed to pin to IPFS");
    }

    const ipfsUri = `ipfs://${pinataData.IpfsHash}`;
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`;

    return NextResponse.json({
      success: true,
      ipfsUri,
      gatewayUrl,
      hash: pinataData.IpfsHash,
      collection: collectionName
    });
  } catch (error: any) {
    console.error("IPFS Pinning Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
