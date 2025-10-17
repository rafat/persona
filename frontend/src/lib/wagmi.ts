import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { somnia } from './somnia'

export const config = createConfig({
  chains: [mainnet, sepolia, somnia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [somnia.id]: http(),
  },
})
