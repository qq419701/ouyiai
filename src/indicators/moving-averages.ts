export function calcSMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function calcEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calcEMASlope(prices: number[], period: number): number {
  if (prices.length < period + 5) return 0;
  const ema1 = calcEMA(prices, period);
  const ema2 = calcEMA(prices.slice(0, -5), period);
  return (ema1 - ema2) / 5;
}

export function calcMAAlignmentScore(prices: number[]): number {
  const ema8 = calcEMA(prices, 8);
  const ema21 = calcEMA(prices, 21);
  const ema55 = calcEMA(prices, 55);
  const ema144 = calcEMA(prices, 144);
  const ema200 = calcEMA(prices, 200);

  let score = 0;
  const emas = [ema8, ema21, ema55, ema144, ema200];
  let bullishCount = 0;
  let bearishCount = 0;

  for (let i = 0; i < emas.length - 1; i++) {
    if (emas[i] > emas[i + 1]) bullishCount++;
    else bearishCount++;
  }

  score = ((bullishCount - bearishCount) / 4) * 100;
  return Math.round(score);
}

export function calcAllMAs(prices: number[]) {
  return {
    SMA_20: calcSMA(prices, 20),
    SMA_60: calcSMA(prices, 60),
    SMA_200: calcSMA(prices, 200),
    EMA_8: calcEMA(prices, 8),
    EMA_21: calcEMA(prices, 21),
    EMA_55: calcEMA(prices, 55),
    EMA_144: calcEMA(prices, 144),
    EMA_200: calcEMA(prices, 200),
    EMA_slope: calcEMASlope(prices, 21),
    MA_alignment_score: calcMAAlignmentScore(prices),
  };
}
