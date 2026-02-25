export interface OKXWsMessage {
  event?: string;
  arg?: { channel: string; instId: string };
  data?: unknown[];
  code?: string;
  msg?: string;
}

export interface OKXRestResponse<T = unknown> {
  code: string;
  msg: string;
  data: T[];
}

export interface OKXTicker {
  instId: string;
  last: string;
  bidPx: string;
  askPx: string;
  open24h: string;
  high24h: string;
  low24h: string;
  vol24h: string;
  ts: string;
}

export interface OKXOrderBook {
  asks: string[][];
  bids: string[][];
  ts: string;
}

export interface OKXTrade {
  instId: string;
  tradeId: string;
  px: string;
  sz: string;
  side: string;
  ts: string;
}

export interface OKXCandle {
  ts: string;
  open: string;
  high: string;
  low: string;
  close: string;
  vol: string;
}

export interface DataGatewayConfig {
  coin: string;
  wsUrl: string;
  restUrl: string;
  failoverThresholdMs: number;
}

export interface HealthCheckResult {
  endpoint: string;
  available: boolean;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  rateLimitThreshold?: number;
  lastChecked: Date;
}
