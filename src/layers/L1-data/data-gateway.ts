import { OKXWebSocket } from './okx-ws';
import { OKXRestClient } from './okx-rest';
import { OKXTicker, OKXOrderBook, OKXTrade } from './types';
import { logger } from '../../utils/logger';
import { CoinSymbol } from '../../utils/types';

export class DataGateway {
  private tickerCache: Map<string, OKXTicker> = new Map();
  private orderBookCache: Map<string, OKXOrderBook> = new Map();
  private tradeCache: Map<string, OKXTrade[]> = new Map();
  private wsLastUpdate: Map<string, number> = new Map();
  private failoverThresholdMs = 5000;

  constructor(
    private ws: OKXWebSocket,
    private rest: OKXRestClient,
    private coins: CoinSymbol[],
  ) {
    this.setupWsListeners();
  }

  private setupWsListeners(): void {
    this.ws.on('data', (msg: { arg?: { channel: string; instId: string }; data?: unknown[] }) => {
      if (!msg.arg || !msg.data) return;
      const { channel, instId } = msg.arg;
      const coin = instId.replace('-USDT', '') as CoinSymbol;
      this.wsLastUpdate.set(`${channel}:${coin}`, Date.now());

      if (channel === 'tickers' && msg.data[0]) {
        this.tickerCache.set(coin, msg.data[0] as OKXTicker);
      } else if (channel === 'books' && msg.data[0]) {
        this.orderBookCache.set(coin, msg.data[0] as OKXOrderBook);
      } else if (channel === 'trades') {
        const existing = this.tradeCache.get(coin) || [];
        const newTrades = msg.data as OKXTrade[];
        this.tradeCache.set(coin, [...newTrades, ...existing].slice(0, 500));
      }
    });
  }

  subscribeAll(): void {
    const args = this.coins.flatMap(coin => [
      { channel: 'tickers', instId: `${coin}-USDT` },
      { channel: 'books', instId: `${coin}-USDT` },
      { channel: 'trades', instId: `${coin}-USDT` },
    ]);
    this.ws.subscribe(args);
  }

  private isWsFresh(channel: string, coin: string): boolean {
    const lastUpdate = this.wsLastUpdate.get(`${channel}:${coin}`);
    if (!lastUpdate) return false;
    return Date.now() - lastUpdate < this.failoverThresholdMs;
  }

  async getTicker(coin: CoinSymbol): Promise<OKXTicker> {
    if (this.isWsFresh('tickers', coin) && this.tickerCache.has(coin)) {
      return this.tickerCache.get(coin)!;
    }
    logger.debug({ coin }, 'WS stale, falling back to REST for ticker');
    const ticker = await this.rest.getTicker(`${coin}-USDT`);
    this.tickerCache.set(coin, ticker);
    return ticker;
  }

  async getOrderBook(coin: CoinSymbol): Promise<OKXOrderBook> {
    if (this.isWsFresh('books', coin) && this.orderBookCache.has(coin)) {
      return this.orderBookCache.get(coin)!;
    }
    logger.debug({ coin }, 'WS stale, falling back to REST for orderbook');
    const ob = await this.rest.getOrderBook(`${coin}-USDT`);
    this.orderBookCache.set(coin, ob);
    return ob;
  }

  getTrades(coin: CoinSymbol): OKXTrade[] {
    return this.tradeCache.get(coin) || [];
  }
}
