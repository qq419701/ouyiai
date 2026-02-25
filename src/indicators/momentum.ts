import { calcEMA } from './moving-averages';

export function calcRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calcMACD(prices: number[]) {
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  const macdLine = ema12 - ema26;

  // Signal line: 9-period EMA of MACD
  const macdValues = prices.slice(-30).map((_, i) => {
    const slice = prices.slice(0, prices.length - 30 + i + 1);
    return calcEMA(slice, 12) - calcEMA(slice, 26);
  });
  const signal = calcEMA(macdValues, 9);

  return {
    MACD_line: macdLine,
    MACD_signal: signal,
    MACD_histogram: macdLine - signal,
  };
}

export function calcADX(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (closes.length < period + 1) return 0;

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const high = highs[i], low = lows[i], prevHigh = highs[i - 1];
    const prevLow = lows[i - 1], prevClose = closes[i - 1];
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    plusDM.push(high - prevHigh > prevLow - low && high - prevHigh > 0 ? high - prevHigh : 0);
    minusDM.push(prevLow - low > high - prevHigh && prevLow - low > 0 ? prevLow - low : 0);
  }

  const sumTR = tr.slice(-period).reduce((a, b) => a + b, 0);
  const sumPlusDM = plusDM.slice(-period).reduce((a, b) => a + b, 0);
  const sumMinusDM = minusDM.slice(-period).reduce((a, b) => a + b, 0);

  if (sumTR === 0) return 0;
  const plusDI = (sumPlusDM / sumTR) * 100;
  const minusDI = (sumMinusDM / sumTR) * 100;
  const diSum = plusDI + minusDI;
  if (diSum === 0) return 0;
  return (Math.abs(plusDI - minusDI) / diSum) * 100;
}

export function calcBollingerWidth(prices: number[], period = 20): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  return mean > 0 ? (4 * std) / mean : 0;
}

export function calcAllMomentum(closes: number[], highs: number[], lows: number[]) {
  return {
    ...calcMACD(closes),
    RSI_14: calcRSI(closes),
    ADX_value: calcADX(highs, lows, closes),
    BB_width: calcBollingerWidth(closes),
  };
}
