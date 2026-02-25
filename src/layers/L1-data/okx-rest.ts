import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { OKXRestResponse, OKXTicker, OKXOrderBook, OKXTrade, OKXCandle } from './types';

const BASE_URL = 'https://www.okx.com';

export class OKXRestClient {
  private client: AxiosInstance;
  private requestQueue: Array<() => void> = [];
  private lastRequestTime = 0;
  private minRequestInterval = 100; // 10 req/s limit

  constructor(
    private apiKey?: string,
    private apiSecret?: string,
    private passphrase?: string,
  ) {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private sign(timestamp: string, method: string, path: string, body = ''): string {
    const message = `${timestamp}${method}${path}${body}`;
    return crypto.createHmac('sha256', this.apiSecret || '').update(message).digest('base64');
  }

  private authHeaders(method: string, path: string, body = ''): Record<string, string> {
    if (!this.apiKey) return {};
    const timestamp = new Date().toISOString();
    return {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': this.sign(timestamp, method, path, body),
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase || '',
    };
  }

  private async rateLimitedRequest<T>(config: AxiosRequestConfig): Promise<T> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      await new Promise(r => setTimeout(r, this.minRequestInterval - elapsed));
    }
    this.lastRequestTime = Date.now();

    let attempt = 0;
    const maxAttempts = 3;
    const delays = [500, 1000, 2000];

    while (attempt < maxAttempts) {
      try {
        const res = await this.client.request<OKXRestResponse<T>>(config);
        if (res.data.code !== '0') {
          throw new Error(`OKX API error: ${res.data.code} - ${res.data.msg}`);
        }
        return res.data.data as unknown as T;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 429 && attempt < maxAttempts - 1) {
          logger.warn({ attempt }, 'Rate limited, retrying...');
          await new Promise(r => setTimeout(r, delays[attempt]));
          attempt++;
        } else {
          throw err;
        }
      }
    }
    throw new Error('Max retry attempts exceeded');
  }

  async getTicker(instId: string): Promise<OKXTicker> {
    const path = `/api/v5/market/ticker?instId=${instId}`;
    const data = await this.rateLimitedRequest<OKXTicker[]>({ method: 'GET', url: path });
    return data[0];
  }

  async getOrderBook(instId: string, depth = 20): Promise<OKXOrderBook> {
    const path = `/api/v5/market/books?instId=${instId}&sz=${depth}`;
    const data = await this.rateLimitedRequest<OKXOrderBook[]>({ method: 'GET', url: path });
    return data[0];
  }

  async getTrades(instId: string, limit = 100): Promise<OKXTrade[]> {
    const path = `/api/v5/market/trades?instId=${instId}&limit=${limit}`;
    return this.rateLimitedRequest<OKXTrade[]>({ method: 'GET', url: path });
  }

  async getCandles(instId: string, bar: string, limit = 300): Promise<OKXCandle[]> {
    const path = `/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`;
    return this.rateLimitedRequest<OKXCandle[]>({ method: 'GET', url: path });
  }

  async getAccountBalance(): Promise<unknown> {
    const path = '/api/v5/account/balance';
    const headers = this.authHeaders('GET', path);
    return this.rateLimitedRequest({ method: 'GET', url: path, headers });
  }

  async placeOrder(params: {
    instId: string; tdMode: string; side: string; ordType: string;
    sz: string; px?: string; clOrdId: string;
  }): Promise<unknown> {
    const path = '/api/v5/trade/order';
    const body = JSON.stringify(params);
    const headers = this.authHeaders('POST', path, body);
    return this.rateLimitedRequest({ method: 'POST', url: path, data: params, headers });
  }

  async cancelOrder(instId: string, ordId?: string, clOrdId?: string): Promise<unknown> {
    const path = '/api/v5/trade/cancel-order';
    const params = { instId, ...(ordId ? { ordId } : {}), ...(clOrdId ? { clOrdId } : {}) };
    const body = JSON.stringify(params);
    const headers = this.authHeaders('POST', path, body);
    return this.rateLimitedRequest({ method: 'POST', url: path, data: params, headers });
  }

  async getSystemStatus(): Promise<unknown> {
    return this.rateLimitedRequest({ method: 'GET', url: '/api/v5/system/status' });
  }
}
