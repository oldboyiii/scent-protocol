# ScentProtocol — Digital Perfume House 🧪

ScentProtocol is a digital perfume house where users create unique, AI-generated fragrances. Every formula is minted as an NFT certificate of ownership on the Arc blockchain. Built on Arc.

🔗 **Live dApp:** [scent-protocol-pi.vercel.app](https://scent-protocol-pi.vercel.app)

---

## 📖 The Concept

ScentProtocol is the world's first digital perfume house on the blockchain. Every fragrance is a unique NFT — a digital certificate of ownership for an AI-generated formula. No two scents are ever the same.

**How It Works:**
1. Choose gender and perfume type (Parfum, EDP, EDT, EDC)
2. Pay 10 USDC — the smart contract generates a unique formula on-chain
3. AI writes a poetic description — your NFT is ready

---

## 🔗 Live Links

| Resource | Link |
|----------|------|
| **Live dApp** | [scent-protocol-pi.vercel.app](https://scent-protocol-pi.vercel.app) |
| **Contract (Arc Testnet)** | [`0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1`](https://testnet.arcscan.app/address/0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1) |
| **USDC (Arc)** | [`0x3600000000000000000000000000000000000000`](https://testnet.arcscan.app/address/0x3600000000000000000000000000000000000000) |
| **Arc Explorer** | [testnet.arcscan.app](https://testnet.arcscan.app) |

---

## 🏗️ Architecture

| Component | Technology | Where |
|-----------|-----------|-------|
| Smart Contract | Solidity 0.8.20 | Arc Testnet |
| Frontend | Next.js 14 + Tailwind + TypeScript | Vercel |
| AI Description | OpenAI GPT-4o-mini | Vercel Serverless Function |
| Blockchain RPC | Public Arc endpoint | Via ethers.js in browser |
| Wallet | MetaMask / Rabby | User |

---

## 📦 Contract Deployment

| Contract | Address | Purpose |
|----------|---------|---------|
| **ScentProtocol** | `0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1` | Main perfume creation & NFT minting logic |
| **USDC (Arc)** | `0x3600000000000000000000000000000000000000` | Native USDC token on Arc Testnet |

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
| 7 | **ScentMarketplace** | `0x23d2F6655F23D245348ce6Db11e07eab823E6D66` | NFT / asset marketplace for Arc builders |
| 8 | **ARBounty** | `0x5e3b652F8Ef29d50F32Ae2D69920651d10D0227b` | Bounty / task management |
| 9 | **ArcAttest** | `0x743d7c6d558bFa735ca9f87059e662CC03452335` | Attestation / verification system |
| 10 | **ArcInvoice** | `0x62E44bf079Ce2996E933174d7BaC591Da8ade190` | On‑chain invoicing |
| 11 | **ArcBuilderFactory** | `0x2DBC1e505Ed008AAbC9B52733100078c42a05aF1` | SBT credentials for Arc builders |

> **Note:** All contracts are deployed and verified on [Arc Explorer](https://testnet.arcscan.app).  
> Source code is available via the Explorer's **Contract** tab.

---

## ⚡ Arc Network Features

- **USDC = gas token** — fees in dollars, predictable
- **6 decimals** for USDC (not 18!) — important for `approve()` and `mintPrice`
- **Sub-second finality** — transactions finalize instantly
- **EVM-compatible** — deploy from Remix works out of the box

---

## 🗺️ Roadmap

### Phase 1 — Live ✅
- [x] On-chain perfume generation with unique formulas
- [x] ERC-721 NFT minting with USDC gas
- [x] AI-generated poetic descriptions
- [x] Collection & Gallery pages

### Phase 2 — AI Agent Integration
- [ ] Personal AI advisor for scent recommendations
- [ ] Auto-minting based on mood & context
- [ ] Session keys for gasless experience
- [ ] Natural language → fragrance pipeline

### Phase 3 — Nanopayments & Samples
- [ ] $0.01 scent previews (no NFT)
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

```bash
cd frontend
npm install
npm run dev

Open http://localhost:3000 to see the app.
🔧 Deploy to Vercel

    Push repository to GitHub

    Import project on vercel.com

    Set frontend as Root Directory

    Add Environment Variables from .env.local

    Click Deploy

🔐 Environment Variables
text

NEXT_PUBLIC_CONTRACT_ADDRESS=0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_CHAIN_ID=5042002
OPENAI_API_KEY=sk-...

📁 Repository Structure
text

ScentProtocol/
├── frontend/
│   ├── app/                  # Next.js App Router
│   ├── components/           # React components
│   ├── lib/                  # Contract ABI & utils
│   └── .env.local.example
├── contracts/
│   └── ScentProtocol.sol     # Main contract
├── README.md
└── LICENSE

🤝 Contributing

Contributions are welcome!
Feel free to open issues or submit PRs.
📄 License

MIT

    Built on Arc — fast, cheap, USDC‑powered.
    Every fragrance is a formula, every formula is on‑chain.
