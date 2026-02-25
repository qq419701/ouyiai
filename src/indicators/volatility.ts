export function calcATR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (closes.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1]),
    );
    trs.push(tr);
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function calcVolatilityRegime(
  currentATR: number,
  avgATR: number,
): 'low' | 'normal' | 'high' | 'extreme' {
  const ratio = currentATR / (avgATR || 1);
  if (ratio < 0.5) return 'low';
  if (ratio < 1.5) return 'normal';
  if (ratio < 2.5) return 'high';
  return 'extreme';
}

export function calcRangePercent(highs: number[], lows: number[]): number {
  if (highs.length === 0) return 0;
  const h = Math.max(...highs);
  const l = Math.min(...lows);
  return l > 0 ? ((h - l) / l) * 100 : 0;
}
