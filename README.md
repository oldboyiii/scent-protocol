
# ScentProtocol — AI Perfume House 🧪

ScentProtocol is a digital perfume house where users create unique fragrances with USDC. The blockchain guarantees the authenticity of every formula. Built on Arc.

---

## 🔗 Live Links

| Resource | Link |
|----------|------|
| **Live dApp** | [scentprotocol.vercel.app](https://scentprotocol.vercel.app) |
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
| **ScentProtocol** | `0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1` | Main perfume creation & trading logic |
| **USDC (Arc)** | `0x3600000000000000000000000000000000000000` | Native USDC token on Arc Testnet |

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

⚡ Arc Network Features

    USDC = gas token — fees in dollars, predictable

    6 decimals for USDC (not 18!) — important for approve() and mintPrice

    Sub-second finality — transactions finalize instantly

    EVM-compatible — deploy from Remix works out of the box

🌐 Ecosystem Contracts

ScentProtocol is part of a broader Arc Network builder toolset.
Below are additional contracts deployed on Arc Testnet that complement the ecosystem:
Contract	Address	Purpose
Escrow	0x96297fEc887bCA75b16d5cF57fad0a7127D5E3D7	Generic escrow for secure peer-to-peer transactions
ArcSplit	0xF9A083cB22dFC271740727f0C90c1181727739D9	Multi‑signature / split payments and revenue sharing
ArcLend	0xA06a76a433C03798C26D0DC5e89ca59B99C97751	Lending / borrowing primitives
ArcVote	0xA3cbE323e108fcF2727E3bf0d5E238aE7b6d0869	Governance / voting logic
ArcLock	0x69C545fE8A8D65e7D187FF57127EA432F2C22d3e	Token vesting & time‑locks
FXBlitzScore	0x50e206F15556f06B374acDa943a7655602AF6494	Scoring / gamification engine
ScentMarketplace	0x23d2F6655F23D245348ce6Db11e07eab823E6D66	NFT / asset marketplace for Arc builders
ARBounty	0x5e3b652F8Ef29d50F32Ae2D69920651d10D0227b	Bounty / task management
ArcAttest	0x743d7c6d558bFa735ca9f87059e662CC03452335	Attestation / verification system
ArcInvoice	0x62E44bf079Ce2996E933174d7BaC591Da8ade190	On‑chain invoicing
ArcBuilderFactory	0x2DBC1e505Ed008AAbC9B52733100078c42a05aF1	SBT credentials for Arc builders

    Note: All contracts are deployed and verified on Arc Explorer.
    Source code is available via the Explorer's Contract tab.

🗺️ Roadmap

    ☑

    Core perfume creation with USDC payments
    ☑

    AI‑generated descriptions via GPT-4o-mini
    ☑

    Frontend with wallet connection
    □

    ArcBuilderFactory integration — SBT holders get exclusive perfume drops
    □

    ArcVote integration — community voting on new scents
    □

    ScentMarketplace — trade limited‑edition fragrances
    □

    ArcInvoice — auto‑generate invoices for custom orders

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

