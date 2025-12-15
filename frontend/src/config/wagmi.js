// src/config/wagmi.ts
import { createConfig, http } from 'wagmi'
import { createPublicClient } from 'viem' // ← From viem
import { injected } from 'wagmi/connectors'
import { arcTestnet } from './chains'

// ❌ Remove this line: import { publicClient } from '../config/wagmi'

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.testnet.arc.network'),
})

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.testnet.arc.network'),
  },
})