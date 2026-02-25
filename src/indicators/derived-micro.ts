import { Trade } from '../utils/types';

export function calcNetFlow(trades: Trade[], windowMs: number): number {
  const cutoff = Date.now() - windowMs;
  return trades
    .filter(t => t.timestamp_ms > cutoff)
    .reduce((sum, t) => sum + (t.side === 'buy' ? t.size * t.price : -(t.size * t.price)), 0);
}

export function calcTakerBuyRatio(trades: Trade[], windowMs: number): number {
  const cutoff = Date.now() - windowMs;
  const recent = trades.filter(t => t.timestamp_ms > cutoff);
  if (recent.length === 0) return 0.5;
  const buyVol = recent.filter(t => t.side === 'buy').reduce((s, t) => s + t.size, 0);
  const totalVol = recent.reduce((s, t) => s + t.size, 0);
  return totalVol > 0 ? buyVol / totalVol : 0.5;
}

export function calcCumulativeDelta(trades: Trade[]): number {
  return trades.reduce((sum, t) => sum + (t.side === 'buy' ? t.size : -t.size), 0);
}

export function calcFlowVelocity(trades: Trade[], windowMs: number): number {
  const netFlow = calcNetFlow(trades, windowMs);
  return netFlow / (windowMs / 1000);
}

export function calcFlowAcceleration(trades: Trade[]): number {
  const flow5s = calcNetFlow(trades, 5000);
  const flow10s = calcNetFlow(trades, 10000);
  const flow0_5s = flow5s - calcNetFlow(trades.filter(t => t.timestamp_ms > Date.now() - 5000), 0);
  return (flow5s - (flow10s - flow5s)) / 5;
}

export function calcAllDerivedMicro(trades: Trade[]) {
  return {
    net_flow_1s: calcNetFlow(trades, 1000),
    net_flow_3s: calcNetFlow(trades, 3000),
    net_flow_5s: calcNetFlow(trades, 5000),
    net_flow_10s: calcNetFlow(trades, 10000),
    taker_buy_ratio_5s: calcTakerBuyRatio(trades, 5000),
    cumulative_delta: calcCumulativeDelta(trades),
    flow_velocity: calcFlowVelocity(trades, 5000),
    flow_acceleration: calcFlowAcceleration(trades),
  };
}
