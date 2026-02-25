import { PrismaClient } from '@prisma/client';
import { OKXRestClient } from '../layers/L1-data/okx-rest';
import { COIN_SYMBOLS } from '../config/coins';
import { CoinSymbol } from '../utils/types';
import { logger } from '../utils/logger';

const INTERVALS = ['1m', '5m', '15m', '1H'] as const;
type Interval = typeof INTERVALS[number];

const HISTORY_BARS: Record<Interval, number> = {
  '1m': 7 * 24 * 60,      // 7 days
  '5m': 30 * 24 * 12,     // 30 days
  '15m': 90 * 24 * 4,     // 90 days
  '1H': 365 * 24,          // 365 days
};

export class KlineCache {
  private initialized = false;

  constructor(
    private prisma: PrismaClient,
    private rest: OKXRestClient,
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    logger.info('Initializing K-line cache (full history pull)...');

    for (const coin of COIN_SYMBOLS) {
      for (const interval of INTERVALS) {
        await this.fetchAndStore(coin, interval, HISTORY_BARS[interval]);
      }
    }

    this.initialized = true;
    logger.info('K-line cache initialization complete');
  }

  private async fetchAndStore(coin: CoinSymbol, interval: Interval, limit: number): Promise<void> {
    try {
      const candles = await this.rest.getCandles(`${coin}-USDT`, interval, Math.min(limit, 300));
      const dbInterval = interval === '1H' ? '1h' : interval;

      const data = candles.map(c => ({
        coin,
        interval: dbInterval,
        openTime: new Date(parseInt(c.ts)),
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        volume: parseFloat(c.vol),
      }));

      // Upsert in batches
      for (const item of data) {
        await this.prisma.klineData.upsert({
          where: { coin_interval_openTime: { coin: item.coin, interval: item.interval, openTime: item.openTime } },
          create: item,
          update: { open: item.open, high: item.high, low: item.low, close: item.close, volume: item.volume },
        });
      }

      logger.debug({ coin, interval, count: data.length }, 'K-lines stored');
    } catch (err) {
      logger.error({ coin, interval, err }, 'Failed to fetch/store K-lines');
    }
  }

  async getDailyIncrement(): Promise<void> {
    logger.info('Running daily K-line increment update...');
    for (const coin of COIN_SYMBOLS) {
      for (const interval of INTERVALS) {
        await this.fetchAndStore(coin, interval, 2);
      }
    }
  }

  async getKlines(coin: CoinSymbol, interval: string, limit = 300) {
    const dbInterval = interval === '1H' ? '1h' : interval;
    return this.prisma.klineData.findMany({
      where: { coin, interval: dbInterval },
      orderBy: { openTime: 'desc' },
      take: limit,
    });
  }
}
