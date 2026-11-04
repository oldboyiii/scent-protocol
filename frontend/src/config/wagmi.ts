// frontend/src/config/wagmi.ts
import { createConfig, http, createStorage } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// Arc Network chain configuration
const arcMainnet = {
  id: 5042,
  name: "Arc Network",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.arc.io"] }, // Updated to correct Mainnet RPC
    public: { http: ["https://rpc.mainnet.arc.io"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://explorer.arc.io" },
  },
};

// SAFE STORAGE: Prevents "indexedDB is not defined" error during Next.js SSR build
const safeStorage = createStorage({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

// wagmi configuration with injected wallets and WalletConnect
export const config = createConfig({
  // Arc Network first — it becomes the default chain
  chains: [arcMainnet, mainnet, sepolia],
  connectors: [
    // Injected connector covers all browser wallets: MetaMask, Rabby, Trust, OKX, Coinbase Wallet extension
    injected(),
    // WalletConnect for mobile wallets via QR code (modal disabled to avoid double-modal issue)
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
      showQrModal: false,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arcMainnet.id]: http(),
  },
  // Explicitly assign safe storage and enable SSR
  storage: safeStorage,
  ssr: true, 
});
