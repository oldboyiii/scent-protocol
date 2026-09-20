import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { tokenId, contractAddress, perfumeData } = await request.json();

    const isGenesis = contractAddress === "0x807dF79Ec16CF51C07e7B522175EB408D6dE247E";
    const rarityNames = ["Common", "Rare", "Epic", "Legendary"];
    const genderNames = ["Unisex", "Male", "Female", "Other"];
    const typeNames = ["Parfum", "EDP", "EDT", "EDC"];

    const metadata = {
      name: `${isGenesis ? "Genesis" : "Scent"} #${tokenId} - ${perfumeData.name}`,
      description: `A unique AI-generated fragrance formula. Top Notes: ${perfumeData.topNotes.join(", ")}. Heart Notes: ${perfumeData.heartNotes.join(", ")}. Base Notes: ${perfumeData.baseNotes.join(", ")}.`,
      image: "https://scent-protocol-pi.vercel.app/og-image.png",
      external_url: `https://scent-protocol-pi.vercel.app/nft/${tokenId}`,
      attributes: [
        { trait_type: "Rarity", value: rarityNames[perfumeData.rarity] || "Unknown" },
        { trait_type: "Gender", value: genderNames[perfumeData.gender] || "Unisex" },
        { trait_type: "Type", value: typeNames[perfumeData.pType] || "Unknown" },
        { trait_type: "Concentration", value: `${perfumeData.concentration}%` },
        { trait_type: "Collection", value: isGenesis ? "Genesis" : "Mainnet" }
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
        pinataMetadata: { name: `ScentProtocol_Token_${tokenId}` }
      })
    });

    const pinataData = await pinataResponse.json();

    if (!pinataResponse.ok) {
      throw new Error(pinataData.error || "Failed to pin to IPFS");
    }

    const ipfsUri = `ipfs://${pinataData.IpfsHash}`;

    return NextResponse.json({ success: true, ipfsUri, hash: pinataData.IpfsHash });
  } catch (error: any) {
    console.error("IPFS Pinning Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
