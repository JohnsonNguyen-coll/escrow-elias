# Escrow USDC Frontend

React frontend for the Escrow USDC DApp on Arc Testnet.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` and add:
- `VITE_ESCROW_CONTRACT_ADDRESS`: Your deployed contract address
- `VITE_ARC_RPC_URL`: Arc Testnet RPC URL

3. Run development server:
```bash
npm run dev
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Features

- Wallet connection (MetaMask, injected wallets)
- Create escrow contracts
- View and manage escrows
- Admin panel for dispute resolution
- Responsive design with Tailwind CSS

## Tech Stack

- React 18
- Vite
- Wagmi v2 (Web3 React hooks)
- Viem (Ethereum library)
- Tailwind CSS


