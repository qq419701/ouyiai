import { OrderBookLevel } from './liquidity';

export function calcSlippage(
  orders: OrderBookLevel[],
  orderSizeUSDT: number,
  currentPrice: number,
): number {
  let remaining = orderSizeUSDT;
  let totalCost = 0;
  for (const level of orders) {
    const levelUSDT = level.size * level.price;
    if (remaining <= 0) break;
    const take = Math.min(remaining, levelUSDT);
    totalCost += take;
    remaining -= take;
  }
  if (totalCost === 0) return 0;
  const avgExecPrice = totalCost / ((orderSizeUSDT - remaining) / currentPrice);
  return Math.abs(avgExecPrice - currentPrice) / currentPrice;
}

export function calcSlippageChangeRate(current: number, previous: number): number {
  return previous > 0 ? (current - previous) / previous : 0;
}

export function calcImpactCost(slippagePct: number, orderSizeUSDT: number): number {
  return slippagePct * orderSizeUSDT;
}
