const loadListings = async () => {
  try {
    setLoading(true);
    setError("");
    const signer = await getArcSigner();
    const provider = signer.provider;
    if (!provider) throw new Error("Provider not found");

    const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
    const nftContract = getContract(provider);
    const genesisContract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider);

    const usdcAddr = await marketplace.usdc();
    setUsdcAddress(usdcAddr);

    const results: ListingData[] = [];
    const maxTokenId = 50; // Reduce range to avoid RPC errors
    
    console.log("Scanning marketplace (limited to 50 tokens)...");
    
    for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
      try {
        const listing = await marketplace.listings(tokenId);
        
        if (!listing || !listing.active || listing.seller === "0x0000000000000000000000000000000000000000") {
          continue;
        }

        let perfume = null;
        let contractAddress = "";

        try {
          const data = await nftContract.getPerfume(tokenId);
          if (data && data.name) {
            perfume = {
              name: data.name,
              gender: Number(data.gender),
              pType: Number(data.pType),
              concentration: Number(data.concentration),
              rarity: Number(data.rarity),
              topNotes: Array.from(data.topNotes || []) as string[],
            };
            contractAddress = NFT_CONTRACT_ADDRESS;
          }
        } catch (e) {
          try {
            const data = await genesisContract.getPerfume(tokenId);
            if (data && data.name) {
              perfume = {
                name: data.name,
                gender: Number(data.gender),
                pType: Number(data.pType),
                concentration: Number(data.concentration),
                rarity: Number(data.rarity),
                topNotes: Array.from(data.topNotes || []) as string[],
              };
              contractAddress = GENESIS_CONTRACT_ADDRESS;
            }
          } catch (e2) {}
        }

        if (perfume) {
          results.push({
            tokenId,
            contractAddress,
            seller: listing.seller,
            price: listing.price,
            active: listing.active,
            name: perfume.name,
            rarity: perfume.rarity,
            gender: perfume.gender,
            pType: perfume.pType,
            concentration: perfume.concentration,
            topNotes: perfume.topNotes,
          });
        }
        
        // Add delay between requests
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        console.warn(`Error checking token ${tokenId}:`, e);
        // Continue to next token
      }
    }

    console.log("Marketplace listings found:", results.length);
    setListings(results);
  } catch (error: any) {
    console.error("Failed to fetch listings:", error);
    setError(error.message || "Failed to load marketplace");
  } finally {
    setLoading(false);
  }
};
