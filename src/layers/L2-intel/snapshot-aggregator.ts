import { WhaleProviderChain } from './whale-provider';
import { WhaleSnapshot } from './types';
import { CoinSymbol } from '../../utils/types';
import { logger } from '../../utils/logger';

export class SnapshotAggregator {
  private cache: Map<CoinSymbol, WhaleSnapshot> = new Map();
  private lastFetch: Map<CoinSymbol, number> = new Map();
  private cacheTtlMs = 5 * 60 * 1000; // 5 minutes

  constructor(private providerChain: WhaleProviderChain) {}

  async getSnapshot(coin: CoinSymbol): Promise<WhaleSnapshot> {
    const lastFetch = this.lastFetch.get(coin);
    if (lastFetch && Date.now() - lastFetch < this.cacheTtlMs && this.cache.has(coin)) {
      return this.cache.get(coin)!;
    }

    try {
      const snapshot = await this.providerChain.fetchSnapshot(coin);
      this.cache.set(coin, snapshot);
      this.lastFetch.set(coin, Date.now());
      return snapshot;
    } catch (err) {
      logger.error({ coin, err }, 'Failed to fetch whale snapshot');
      if (this.cache.has(coin)) return this.cache.get(coin)!;
      throw err;
    }
  }

  async getAllSnapshots(): Promise<Map<CoinSymbol, WhaleSnapshot>> {
    const coins: CoinSymbol[] = ['BTC', 'ETH', 'SOL'];
    await Promise.allSettled(coins.map(c => this.getSnapshot(c)));
    return this.cache;
  }
}
