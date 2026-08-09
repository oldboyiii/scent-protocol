# ScentProtocol — AI Perfume House

ScentProtocol is a digital perfume house where users create unique fragrances with USDC. The blockchain guarantees the authenticity of every formula. Built on Arc.

## Architecture (no own node)

| Component | Technology | Where |
|-----------|-----------|-------|
| Smart Contract | Solidity 0.8.20 | Arc Testnet |
| Frontend | Next.js 14 + Tailwind + TypeScript | Vercel |
| AI Description | OpenAI GPT-4o-mini | Vercel Serverless Function |
| Blockchain RPC | Public Arc endpoint | Via ethers.js in browser |
| Wallet | MetaMask / Rabby | User |

## Contract Deployment (done)

Contract deployed on Arc Testnet:
- **ScentProtocol**: `0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1`
- **USDC (Arc)**: `0x3600000000000000000000000000000000000000`

## Quick Start (Frontend)

```bash
cd frontend
npm install
npm run dev
```

## Deploy to Vercel

1. Push repository to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set `frontend` as Root Directory
4. Add Environment Variables from `.env.local`
5. Click Deploy

## Environment Variables

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_CHAIN_ID=5042002
OPENAI_API_KEY=sk-...
```

## Arc Features

- **USDC = gas token** — fees in dollars, predictable
- **6 decimals** for USDC (not 18!) — important for approve and mintPrice
- **Sub-second finality** — transactions finalize instantly
- **EVM-compatible** — deploy from Remix works out of the box

## License

MIT
