import { Redis } from 'ioredis';
import { CoinSymbol } from '../utils/types';
import { logger } from '../utils/logger';

const TTL: Record<string, number> = {
  ticker: 3,
  orderbook: 3,
  recent_trades: 5,
  derived_micro: 5,
};

export class RealtimeCache {
  constructor(private redis: Redis) {}

  private key(type: string, coin: CoinSymbol): string {
    return `rt:${coin}:${type}`;
  }

  async set(type: string, coin: CoinSymbol, data: unknown): Promise<void> {
    const ttl = TTL[type] || 10;
    try {
      await this.redis.setex(this.key(type, coin), ttl, JSON.stringify(data));
    } catch (err) {
      logger.warn({ err, type, coin }, 'Redis set failed');
    }
  }

  async get<T>(type: string, coin: CoinSymbol): Promise<T | null> {
    try {
      const val = await this.redis.get(this.key(type, coin));
      return val ? JSON.parse(val) as T : null;
    } catch (err) {
      logger.warn({ err, type, coin }, 'Redis get failed');
      return null;
    }
  }

  async del(type: string, coin: CoinSymbol): Promise<void> {
    await this.redis.del(this.key(type, coin));
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
