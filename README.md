# ScentProtocol — Digital Perfume House 🧪

ScentProtocol is a digital perfume house where users create unique, AI-generated fragrances. Every formula is minted as an NFT certificate of ownership on the Arc Mainnet blockchain. Built on Arc.

🔗 **Live dApp:** [scent-protocol-pi.vercel.app](https://scent-protocol-pi.vercel.app)

---

## 📖 The Concept

ScentProtocol is the world's first digital perfume house on the blockchain. Every fragrance is a unique NFT — a digital certificate of ownership for an AI-generated formula. No two scents are ever the same.

**How It Works:**
1. Choose gender and perfume type (Parfum, EDP, EDT, EDC)
2. Pay 1 USDC — the smart contract generates a unique formula on-chain
3. AI writes a poetic description — your NFT is ready

---

## 🔗 Live Links (Mainnet)

| Resource | Link |
|----------|------|
| **Live dApp** | [scent-protocol-pi.vercel.app](https://scent-protocol-pi.vercel.app) |
| **Arc Mainnet Explorer** | [explorer.arc.io](https://explorer.arc.io) |

---

## 🏗️ Architecture

| Component | Technology | Where |
|-----------|-----------|-------|
| Smart Contracts | Solidity 0.8.20 | Arc Mainnet |
| Frontend | Next.js 14 + Tailwind + TypeScript | Vercel |
| AI Description | OpenAI GPT-4o-mini | Vercel Serverless Function |
| Blockchain RPC | Public Arc Mainnet endpoint | Via ethers.js in browser |
| Wallet | MetaMask / Rabby | User |

---

##  Contract Deployment (Mainnet Production)

| Contract | Address | Purpose |
|----------|---------|---------|
| **ScentProtocolMainnet** | [`0x8d456e033FF7220068CDc1C3F08D6BA6641D103e`](https://explorer.arc.io/address/0x8d456e033FF7220068CDc1C3F08D6BA6641D103e) | Main perfume creation & NFT minting logic |
| **ScentProtocolMainnetGenesis** | [`0x807dF79Ec16CF51C07e7B522175EB408D6dE247E`](https://explorer.arc.io/address/0x807dF79Ec16CF51C07e7B522175EB408D6dE247E) | Exclusive Genesis collection (100 supply, commit-reveal) |
| **ScentProtocolMarketplaceMainnet** | [`0x5CDC0DECc58cD19137fc2851b76A0a8Bc01a2B6c`](https://explorer.arc.io/address/0x5CDC0DECc58cD19137fc2851b76A0a8Bc01a2B6c) | Secondary marketplace for trading Scent NFTs |
| **USDC (Arc Mainnet)** | `0x3600000000000000000000000000000000000000` | Native USDC token on Arc *(verify exact mainnet address)* |

---

## 🌐 Full Ecosystem Contracts

ScentProtocol is part of a broader Arc Network builder toolset.  
All contracts below are deployed and verified on Arc Testnet:

| # | Contract | Address | Purpose |
|---|----------|---------|---------|
| 1 | **Escrow** | `0x96297fEc887bCA75b16d5cF57fad0a7127D5E3D7` | Generic escrow for secure peer-to-peer transactions |
| 2 | **ArcSplit** | `0xF9A083cB22dFC271740727f0C90c1181727739D9` | Multi‑signature / split payments and revenue sharing |
| 3 | **ArcLend** | `0xA06a76a433C03798C26D0DC5e89ca59B99C97751` | Lending / borrowing primitives |
| 4 | **ArcVote** | `0xA3cbE323e108fcF2727E3bf0d5E238aE7b6d0869` | Governance / voting logic |
| 5 | **ArcLock** | `0x69C545fE8A8D65e7D187FF57127EA432F2C22d3e` | Token vesting & time‑locks |
| 6 | **FXBlitzScore** | `0x50e206F15556f06B374acDa943a7655602AF6494` | Scoring / gamification engine |
| 7 | **ScentProtocol** | `0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1` | Base protocol for Scent ecosystem |
| 8 | **ScentMarketplace** | `0x23d2F6655F23D245348ce6Db11e07eab823E6D66` | NFT / asset marketplace for Arc builders |
| 9 | **ARBounty** | `0x5e3b652F8Ef29d50F32Ae2D69920651d10D0227b` | Bounty / task management |
| 10 | **ArcAttest** | `0x743d7c6d558bFa735ca9f87059e662CC03452335` | Attestation / verification system |
| 11 | **ArcInvoice** | `0x62E44bf079Ce2996E933174d7BaC591Da8ade190` | On‑chain invoicing |
| 12 | **ArcBuilderFactory** | `0x2DBC1e505Ed008AAbC9B52733100078c42a05aF1` | SBT credentials for Arc builders |

---

## 🧪 Testnet (Development Reference)

*The following addresses were used during development and testing on Arc Testnet. They are kept here for developer reference and auditing purposes.*

| Contract | Address | Purpose |
|----------|---------|---------|
| **ScentProtocol (Legacy)** | `0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1` | Original testnet deployment |
| **ScentProtocolV2** | `0x5a8EFf24A69200c9D7F7E80d6b72960c72024b63` | Upgraded protocol with optimizations |
| **ScentProtocolGenesis** | `0x32b8a68ba95F156FE902008c2f7d4692583Da4bf` | Genesis collection (testnet version) |
| **ScentMarketplaceV8.1** | `0xC9535FeA781028834fA566D5FDbA6292718d1167` | Marketplace v8.1 with latest features |
| **USDC (Arc Testnet)** | `0x3600000000000000000000000000000000000000` | Testnet USDC token |

> **Note:** All testnet contracts are deployed and verified on [Arc Testnet Explorer](https://testnet.arcscan.app). Source code is available via the Explorer's **Contract** tab.

---

## ⚡ Arc Network Features

- **USDC = gas token** — fees in dollars, highly predictable
- **6 decimals** for USDC (not 18!) — important for `approve()` and `mintPrice` calculations
- **Sub-second finality** — transactions finalize almost instantly
- **EVM-compatible** — seamless deployment from Remix and standard tooling

---

## 🗺️ Roadmap

### Phase 1 — Live Now ✅
- [x] On-chain perfume generation with unique formulas
- [x] ERC-721 NFT minting with USDC gas
- [x] AI-generated poetic descriptions
- [x] Collection & Gallery pages

### Phase 1.5 — Marketplace Launch ✅
- [x] Peer-to-peer NFT trading platform
- [x] Fixed price & auction listing types
- [x] Royalty enforcement on secondary sales
- [x] Rarity-based filtering & search

### Phase 2 — AI Agent & Mainnet 🔄
- [x] Personal AI advisor for scent recommendations
- [x] Successful Mainnet deployment
- [x] Limited Event Editions (Special Occasion Drops)
- [ ] Auto-minting based on mood & context
- [ ] Session keys for gasless experience
- [ ] Natural language → fragrance pipeline

### Phase 3 — Nanopayments & Samples
- [ ] $0.01 scent previews (no NFT required)
- [ ] $0.05 note merging & blending
- [ ] $0.001 governance voting
- [ ] Subscription 'Scent of the Month'

### Phase 4 — Metaverse & Beyond
- [ ] Avatar scent status in virtual worlds
- [ ] Wearable fragrance as social signal
- [ ] Cross-platform NFT interoperability
- [ ] Physical redemption partnerships

---

## 🚀 Quick Start (Frontend)

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 🔧 Deploy to Vercel
1. Push repository to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set `frontend` as Root Directory
4. Add Environment Variables (see below)
5. Click Deploy

### 🔐 Environment Variables (`.env.local`)
*Note: These are configured for **Arc Mainnet**.*

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x8d456e033FF7220068CDc1C3F08D6BA6641D103e
NEXT_PUBLIC_GENESIS_ADDRESS=0x807dF79Ec16CF51C07e7B522175EB408D6dE247E
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x5CDC0DECc58cD19137fc2851b76A0a8Bc01a2B6c
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_RPC_URL=https://rpc.mainnet.arc.io
NEXT_PUBLIC_CHAIN_ID=5042
OPENAI_API_KEY=sk-...

ScentProtocol/
── frontend/
│   ├── app/                  # Next.js App Router
│   ├── components/           # React components
│   ├── context/              # Wallet & Global state
│   ├── utils/                # Contract ABI & ethers.js utils
│   ── .env.local.example
├── contracts/
│   ├── ScentProtocolMainnet.sol      # Main creation logic
│   ├── ScentProtocolMainnetGenesis.sol # Genesis collection
│   ── ScentProtocolMarketplace.sol  # Marketplace logic
├── README.md
└── LICENSE

📄 License
MIT

    Built on Arc — fast, cheap, USDC‑powered.
    Every fragrance is a formula, every formula is on‑chain.
