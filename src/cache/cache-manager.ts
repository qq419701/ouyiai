import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { RealtimeCache } from './realtime-cache';
import { KlineCache } from './kline-cache';
import { OKXRestClient } from '../layers/L1-data/okx-rest';

export class CacheManager {
  public realtime: RealtimeCache;
  public klines: KlineCache;

  constructor(
    redis: Redis,
    prisma: PrismaClient,
    rest: OKXRestClient,
  ) {
    this.realtime = new RealtimeCache(redis);
    this.klines = new KlineCache(prisma, rest);
  }

  async initialize(): Promise<void> {
    await this.klines.initialize();
  }
}
