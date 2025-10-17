import { defineChain } from 'viem'

export const somnia = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.somnia.network'],
    },
  },
  blockExplorers: {
    default: { name: 'Somniscan', url: 'https://testnet.somniscan.io' },
  },
})
