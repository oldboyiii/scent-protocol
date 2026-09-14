// ... (imports и константы те же)

useEffect(() => {
  async function fetchCollection() {
    if (!walletReady) return;

    let currentAddress = address;
    if (!currentAddress) {
      const w = window as any;
      if (w.ethereum) {
        try {
          const accounts = await w.ethereum.request({ method: 'eth_accounts' });
          currentAddress = accounts?.[0];
        } catch {}
      }
    }

    if (!currentAddress) {
      setLoading(false);
      return;
    }

    try {
      const w = window as any;
      const provider = w.ethereum ? new ethers.BrowserProvider(w.ethereum) : new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
      const results: StoredScent[] = [];

      // PART 1: Fetch ScentProtocol NFTs
      try {
        let contract;
        if (w.ethereum) {
          contract = getContract(new ethers.BrowserProvider(w.ethereum));
        } else {
          contract = getContract(new ethers.JsonRpcProvider("https://rpc.testnet.arc.network"));
        }

        const balance = await contract.balanceOf(currentAddress);
        const balanceNum = Number(balance);
        console.log("ScentProtocol balance:", balanceNum);

        if (balanceNum > 0) {
          let foundCount = 0;
          const maxId = 100;

          for (let tokenId = 1; tokenId <= maxId && foundCount < balanceNum; tokenId++) {
            try {
              const owner = await contract.ownerOf(tokenId);
              if (owner.toLowerCase() === currentAddress.toLowerCase()) {
                const perfume = await contract.getPerfume(tokenId);
                
                // Check listing status with error handling
                let isListed = false;
                try {
                  const listing = await marketplace.listings(tokenId);
                  isListed = listing && listing.active;
                } catch (e) {
                  console.warn(`Failed to check listing status for token ${tokenId}:`, e);
                }

                results.push({
                  tokenId,
                  contractAddress: NFT_CONTRACT_ADDRESS,
                  name: perfume.name,
                  rarity: Number(perfume.rarity),
                  timestamp: Number(perfume.createdAt) * 1000,
                  isListed,
                  perfume: {
                    name: perfume.name,
                    gender: Number(perfume.gender),
                    pType: Number(perfume.pType),
                    topNotes: Array.from(perfume.topNotes || []) as string[],
                    heartNotes: Array.from(perfume.heartNotes || []) as string[],
                    baseNotes: Array.from(perfume.baseNotes || []) as string[],
                    concentration: Number(perfume.concentration),
                    rarity: Number(perfume.rarity),
                    createdAt: Number(perfume.createdAt),
                    creator: perfume.creator,
                  },
                  description: undefined,
                });
                foundCount++;
              }
            } catch (e) {
              console.warn(`Error fetching token ${tokenId}:`, e);
            }
            // Add delay to avoid RPC rate limiting
            await new Promise(r => setTimeout(r, 100));
          }
        }
      } catch (e) {
        console.error("ScentProtocol fetch error:", e);
      }

      // PART 2: Fetch Genesis NFTs
      try {
        const genesisContract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider);
        const genesisBalance = await genesisContract.balanceOf(currentAddress);
        const genesisBalanceNum = Number(genesisBalance);
        console.log("Genesis balance:", genesisBalanceNum);

        if (genesisBalanceNum > 0) {
          let foundCount = 0;
          const maxId = 100;

          for (let tokenId = 1; tokenId <= maxId && foundCount < genesisBalanceNum; tokenId++) {
            try {
              const owner = await genesisContract.ownerOf(tokenId);
              if (owner.toLowerCase() === currentAddress.toLowerCase()) {
                const data = await genesisContract.getPerfume(tokenId);
                
                // Check listing status with error handling
                let isListed = false;
                try {
                  const listing = await marketplace.listings(tokenId);
                  isListed = listing && listing.active;
                } catch (e) {
                  console.warn(`Failed to check listing status for Genesis token ${tokenId}:`, e);
                }

                results.push({
                  tokenId,
                  contractAddress: GENESIS_CONTRACT_ADDRESS,
                  name: data.name,
                  rarity: Number(data.rarity),
                  timestamp: Number(data.createdAt) * 1000,
                  isListed,
                  perfume: {
                    name: data.name,
                    gender: Number(data.gender),
                    pType: Number(data.pType),
                    topNotes: Array.from(data.topNotes || []) as string[],
                    heartNotes: Array.from(data.heartNotes || []) as string[],
                    baseNotes: Array.from(data.baseNotes || []) as string[],
                    concentration: Number(data.concentration),
                    rarity: Number(data.rarity),
                    createdAt: Number(data.createdAt),
                    creator: data.creator,
                  },
                  description: undefined,
                });
                foundCount++;
              }
            } catch (e) {
              console.warn(`Error fetching Genesis token ${tokenId}:`, e);
            }
            // Add delay to avoid RPC rate limiting
            await new Promise(r => setTimeout(r, 100));
          }
        }
      } catch (e) {
        console.error("Genesis fetch error:", e);
      }

      console.log("Total collection:", results.length);
      setScents(results);
    } catch (e) {
      console.error("Collection fetch error:", e);
    } finally {
      setLoading(false);
    }
  }
  fetchCollection();
}, [walletReady, address]);
