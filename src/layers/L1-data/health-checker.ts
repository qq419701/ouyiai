import { OKXRestClient } from './okx-rest';
import { HealthCheckResult } from './types';
import { logger } from '../../utils/logger';

const PERCENTILE_WINDOW = 5 * 60 * 1000; // 5 minutes

export class HealthChecker {
  private latencies: Map<string, number[]> = new Map();
  private errors: Map<string, number[]> = new Map();
  private results: Map<string, HealthCheckResult> = new Map();

  constructor(private restClient: OKXRestClient) {}

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  private recordLatency(endpoint: string, ms: number): void {
    if (!this.latencies.has(endpoint)) this.latencies.set(endpoint, []);
    this.latencies.get(endpoint)!.push(ms);
    // Keep only last 1000 samples
    const arr = this.latencies.get(endpoint)!;
    if (arr.length > 1000) arr.shift();
  }

  private recordError(endpoint: string): void {
    if (!this.errors.has(endpoint)) this.errors.set(endpoint, []);
    this.errors.get(endpoint)!.push(Date.now());
    // Keep only last 5min window
    const cutoff = Date.now() - PERCENTILE_WINDOW;
    const arr = this.errors.get(endpoint)!.filter(t => t > cutoff);
    this.errors.set(endpoint, arr);
  }

  async checkEndpoint(endpoint: string, fn: () => Promise<unknown>): Promise<HealthCheckResult> {
    const start = Date.now();
    let available = false;

    try {
      await fn();
      available = true;
    } catch (err) {
      this.recordError(endpoint);
      logger.warn({ endpoint, err }, 'Health check failed');
    }

    const elapsed = Date.now() - start;
    this.recordLatency(endpoint, elapsed);

    const lats = this.latencies.get(endpoint) || [];
    const errs = this.errors.get(endpoint) || [];
    const totalRequests = lats.length;
    const errorRate = totalRequests > 0 ? (errs.length / totalRequests) * 100 : 0;

    const result: HealthCheckResult = {
      endpoint,
      available,
      latencyP50: this.percentile(lats, 50),
      latencyP95: this.percentile(lats, 95),
      latencyP99: this.percentile(lats, 99),
      errorRate,
      lastChecked: new Date(),
    };

    this.results.set(endpoint, result);
    return result;
  }

  async runAllChecks(): Promise<HealthCheckResult[]> {
    const checks = [
      () => this.checkEndpoint('ticker', () => this.restClient.getTicker('BTC-USDT')),
      () => this.checkEndpoint('orderbook', () => this.restClient.getOrderBook('BTC-USDT')),
      () => this.checkEndpoint('trades', () => this.restClient.getTrades('BTC-USDT', 10)),
      () => this.checkEndpoint('system_status', () => this.restClient.getSystemStatus()),
    ];

    const results = await Promise.allSettled(checks.map(c => c()));
    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<HealthCheckResult>).value);
  }

  getResult(endpoint: string): HealthCheckResult | undefined {
    return this.results.get(endpoint);
  }

  getAllResults(): HealthCheckResult[] {
    return Array.from(this.results.values());
  }
}
