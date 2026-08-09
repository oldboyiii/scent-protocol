# ScentProtocol — AI-Парфюмерный Дом

ScentProtocol — цифровой парфюмерный дом, где пользователь за USDC создаёт уникальный аромат, а блокчейн гарантирует подлинность рецептуры. Built on Arc.

## Архитектура (без собственной ноды)

| Компонент | Технология | Где |
|-----------|-----------|-----|
| Смарт-контракт | Solidity 0.8.20 | Arc Testnet |
| Фронтенд | Next.js 14 + Tailwind + TypeScript | Vercel |
| ИИ-описание | OpenAI GPT-4o-mini | Vercel Serverless Function |
| Блокчейн-RPC | Публичный endpoint Arc | Через ethers.js в браузере |
| Кошелёк | MetaMask / Rabby | Пользователь |

## Деплой контракта (уже сделан)

Контракт задеплоен на Arc Testnet:
- **ScentProtocol**: `0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1`
- **USDC (Arc)**: `0x3600000000000000000000000000000000000000`

## Быстрый старт (фронтенд)

```bash
cd frontend
npm install
npm run dev
```

## Деплой на Vercel

1. Запушь репозиторий на GitHub
2. Импортируй проект на [vercel.com](https://vercel.com)
3. Укажи `frontend` как Root Directory
4. Добавь Environment Variables из `.env.local`
5. Нажми Deploy

## Переменные окружения

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_CHAIN_ID=5042002
OPENAI_API_KEY=sk-...
```

## Особенности Arc

- **USDC = gas token** — комиссии в долларах, предсказуемые
- **6 decimals** у USDC (не 18!) — важно для approve и mintPrice
- **Sub-second finality** — транзакции финализируются мгновенно
- **EVM-совместимость** — деплой из Remix работает без изменений

## Лицензия

MIT
