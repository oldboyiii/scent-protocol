// frontend/src/config/wagmi.ts
import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// Arc Network chain configuration
const arcMainnet = {
  id: 5042,
  name: "Arc Network",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.arc.network"] },
    public: { http: ["https://rpc.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://explorer.arc.network" },
  },
};

// wagmi configuration with injected wallets and WalletConnect
export const config = createConfig({
  chains: [mainnet, sepolia, arcMainnet],
  connectors: [
    // Injected connector covers all browser wallets: MetaMask, Rabby, Trust, OKX, Coinbase Wallet extension
    injected(),
    // WalletConnect for mobile wallets via QR code
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arcMainnet.id]: http(),
  },
});
