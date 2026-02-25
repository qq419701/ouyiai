export interface OrderBookLevel {
  price: number;
  size: number;
}

export function calcOrderbookImbalance(bids: OrderBookLevel[], asks: OrderBookLevel[]): number {
  const bidVol = bids.slice(0, 5).reduce((s, b) => s + b.size, 0);
  const askVol = asks.slice(0, 5).reduce((s, a) => s + a.size, 0);
  const total = bidVol + askVol;
  return total > 0 ? (bidVol - askVol) / total : 0;
}

export function calcTop3DropPercent(current: OrderBookLevel[], previous: OrderBookLevel[]): number {
  const currentVol = current.slice(0, 3).reduce((s, b) => s + b.size, 0);
  const prevVol = previous.slice(0, 3).reduce((s, b) => s + b.size, 0);
  if (prevVol === 0) return 0;
  return ((prevVol - currentVol) / prevVol) * 100;
}

export function calcLiquidityThinness(bids: OrderBookLevel[], asks: OrderBookLevel[]): number {
  const bidVol = bids.slice(0, 20).reduce((s, b) => s + b.size, 0);
  const askVol = asks.slice(0, 20).reduce((s, a) => s + a.size, 0);
  const avgVol = (bidVol + askVol) / 2;
  return avgVol > 0 ? 1 / avgVol : 100;
}
