import { CoinSymbol } from '../utils/types';

export interface CoinConfig {
  symbol: CoinSymbol;
  instId: string;
  name: string;
  slippageThresholds: {
    small: number;
    medium: number;
    large: number;
  };
}

export const COINS: Record<CoinSymbol, CoinConfig> = {
  BTC: {
    symbol: 'BTC',
    instId: 'BTC-USDT',
    name: 'Bitcoin',
    slippageThresholds: { small: 5000, medium: 10000, large: 20000 },
  },
  ETH: {
    symbol: 'ETH',
    instId: 'ETH-USDT',
    name: 'Ethereum',
    slippageThresholds: { small: 5000, medium: 10000, large: 20000 },
  },
  SOL: {
    symbol: 'SOL',
    instId: 'SOL-USDT',
    name: 'Solana',
    slippageThresholds: { small: 50, medium: 100, large: 200 },
  },
};

export const COIN_SYMBOLS: CoinSymbol[] = ['BTC', 'ETH', 'SOL'];
