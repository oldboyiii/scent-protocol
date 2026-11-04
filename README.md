# ScentProtocol — Digital Perfume House 🧪

ScentProtocol is the world's first digital perfume house on the blockchain, where users create, own, and trade unique, AI-generated fragrances. Every formula is minted as an NFT certificate of ownership on the Arc Mainnet. 

🔗 **Live dApp:** [scent-protocol-pi.vercel.app](https://scent-protocol-pi.vercel.app)

---

## 📖 The Concept

ScentProtocol is a multi-layered ecosystem of digital fragrances. No two scents are ever the same.

**How It Works:**
1. **Explore Collections:** Choose from our core collections (V3, Genesis, MFW 2026, Viral) or use the AI Scent Advisor to find your perfect match.
2. **Mint or Blend:** Mint a new fragrance for a fixed USDC price (or claim free exclusive drops), or use **Scent Alchemy** to burn 2 existing NFTs and forge a mutated Hybrid with a chance for rarity upgrades.
3. **Own & Trade:** Your NFT includes a poetic AI-generated description, a unique generative ScentCrest logo, and can be traded on our built-in marketplace with escrowed offers and creator royalties.

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
| Smart Contracts | Solidity 0.8.20 + Foundry | Arc Mainnet |
| Frontend | Next.js 14 + Tailwind + TypeScript | Vercel |
| AI Description | OpenAI GPT-4o-mini | Vercel Serverless Function |
| Blockchain RPC | Public Arc Mainnet endpoint | Via ethers.js in browser |
| Wallet | MetaMask / Rabby / WalletConnect | User |

---

## 📜 Contract Deployment (Mainnet Production)

| Contract | Address | Purpose |
|----------|---------|---------|
| **ScentProtocol V3** | [`0x87950a56456Df786A249F484e9E56dF00fF207cb`](https://explorer.arc.io/address/0x87950a56456Df786A249F484e9E56dF00fF207cb) | Core perfume creation & NFT minting logic |
| **ScentProtocol Genesis** | [`0x37D6a1c730B8DdbB70aD765B39b1edc5Dad12EF6`](https://explorer.arc.io/address/0x37D6a1c730B8DdbB70aD765B39b1edc5Dad12EF6) | Exclusive Genesis collection (100 supply, commit-reveal) |
| **ScentProtocol MFW 2026** | [`0x2Eb16402a50EE92bc3012038A0059ac4e9f7dF20`](https://explorer.arc.io/address/0x2Eb16402a50EE92bc3012038A0059ac4e9f7dF20) | Milan Fashion Week 2026 exclusive drop (500 supply) |
| **ScentProtocol Viral** | [`0x55A3527C87190fa8456De46247b52214287e8688`](https://explorer.arc.io/address/0x55A3527C87190fa8456De46247b52214287e8688) | Viral "Wallet Scent" campaign (10k supply, free mint) |
| **Scent Alchemy** | [`0xd5c962b1dBaa6044E88B4c2bBe2dD5A257702e40`](https://explorer.arc.io/address/0xd5c962b1dBaa6044E88B4c2bBe2dD5A257702e40) | Deflationary blending: Burn 2 NFTs to forge 1 Hybrid |
| **ScentProtocol Marketplace** | [`0xe7Cc5d3e31AB0b2F8f1bFAc0A3FeB17b37333120`](https://explorer.arc.io/address/0xe7Cc5d3e31AB0b2F8f1bFAc0A3FeB17b37333120) | Secondary marketplace with escrowed offers & royalties |
| **USDC (Arc Mainnet)** | `0x3600000000000000000000000000000000000000` | Native USDC token on Arc |

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

### ✅ Phase 1: Live Now
- [x] On-chain perfume generation with unique formulas
- [x] ERC-721 NFT minting with USDC gas
- [x] AI-generated poetic descriptions
- [x] Collection & Gallery pages

### ✅ Phase 1.5: Marketplace Launch
- [x] Peer-to-peer NFT trading platform
- [x] Fixed price & auction listing types
- [x] Royalty enforcement on secondary sales
- [x] Rarity-based filtering & search

### ✅ Phase 2: AI Agent & Mainnet (Completed)
- [x] Personal AI advisor for scent recommendations
- [x] Successful Mainnet deployment
- [x] Limited Event Editions (Special Occasion Drops)
- [x] Auto-minting based on mood & context (Viral Wallet Scent)

### 🔄 Phase 3: Advanced On-Chain Mechanics (In Progress)
- [x] Scent Blending: Burn 2 NFTs to forge a unique hybrid fragrance
- [ ] Natural language → fragrance pipeline
- [ ] Evolving Scents: Dynamic metadata upgrades based on holding duration
- [ ] Subscription 'Scent of the Month' & micro-governance

### 🔮 Phase 4: Cross-Chain Expansion & Virtual Worlds
- [ ] CCTP (Cross-Chain Transfer Protocol) integration for seamless multi-chain onboarding
- [ ] Web2.5 creator onboarding from Ethereum, Base, and Arbitrum
- [ ] Unified liquidity across chains — zero fragmentation
- [ ] Dynamic Environment Scents: NFTs adapt to seasons via Oracles
- [ ] Avatar scent status & wearable fragrance in virtual worlds

### 🌍 Phase 5: Phygital Reality & Global Partnerships
- [ ] Partnerships with luxury perfume houses & fashion brands
- [ ] Physical Redemption: Top rarity holders claim real perfume samples
- [ ] Cross-platform NFT interoperability for real-world utility
- [ ] Global logistics & compliant distribution for physical claims

---

## 🚀 Quick Start (Frontend)

```bash
# Install dependencies
npm install

# Run development server
npm run dev
