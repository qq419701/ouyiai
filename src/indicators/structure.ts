import { TrendDirection } from '../utils/types';

export function detectStructureBreak(closes: number[], lookback = 5): boolean {
  if (closes.length < lookback + 1) return false;
  const recent = closes.slice(-lookback);
  const prev = closes.slice(-(lookback * 2), -lookback);
  const recentHigh = Math.max(...recent);
  const prevHigh = Math.max(...prev);
  const recentLow = Math.min(...recent);
  const prevLow = Math.min(...prev);
  return recentHigh > prevHigh * 1.005 || recentLow < prevLow * 0.995;
}

export function detectHigherHigh(highs: number[]): boolean {
  if (highs.length < 2) return false;
  return highs[highs.length - 1] > highs[highs.length - 2];
}

export function detectHigherLow(lows: number[]): boolean {
  if (lows.length < 2) return false;
  return lows[lows.length - 1] > lows[lows.length - 2];
}

export function determineTrend(closes: number[], period = 20): TrendDirection {
  if (closes.length < period) return 'sideways';
  const recent = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const older = closes.slice(-period, -period + 5).reduce((a, b) => a + b, 0) / 5;
  const changePct = (recent - older) / older;
  if (changePct > 0.01) return 'up';
  if (changePct < -0.01) return 'down';
  return 'sideways';
}
