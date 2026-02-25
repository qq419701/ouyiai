import { OrderParams } from './types';

export interface BatchOrder {
  batchIndex: number;
  totalBatches: number;
  sizeUSDT: number;
  delayMs: number;
}

export function buildBatchOrders(params: OrderParams): BatchOrder[] {
  const batchCount = Math.min(params.batchCount, 5);
  const baseSize = params.sizeUSDT / batchCount;
  const intervalMs = params.batchIntervalSec * 1000;

  return Array.from({ length: batchCount }, (_, i) => ({
    batchIndex: i,
    totalBatches: batchCount,
    sizeUSDT: i === batchCount - 1 ? params.sizeUSDT - baseSize * (batchCount - 1) : baseSize,
    delayMs: i * intervalMs,
  }));
}
