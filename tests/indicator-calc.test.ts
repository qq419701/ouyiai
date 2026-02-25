import { calcSMA, calcEMA, calcMAAlignmentScore, calcAllMAs } from '../src/indicators/moving-averages';
import { calcRSI, calcMACD, calcBollingerWidth } from '../src/indicators/momentum';
import { calcATR, calcVolatilityRegime } from '../src/indicators/volatility';
import { calcVolumeRatio, calcVolumeAcceleration } from '../src/indicators/volume';
import { detectStructureBreak, determineTrend } from '../src/indicators/structure';
import { calcNetFlow, calcTakerBuyRatio, calcCumulativeDelta } from '../src/indicators/derived-micro';
import { calcOrderbookImbalance } from '../src/indicators/liquidity';
import { calcCorrelation, calcBTCTrendScore } from '../src/indicators/intermarket';
import { detectFlashMove, detectAbnormalSpread } from '../src/indicators/risk-signals';
import { calcVolumeProfile } from '../src/indicators/profile';
import { Trade } from '../src/utils/types';

describe('Moving Averages', () => {
  const prices = Array.from({ length: 250 }, (_, i) => 100 + Math.sin(i / 10) * 10);

  test('calcSMA returns correct average', () => {
    const sma = calcSMA([10, 20, 30, 40, 50], 5);
    expect(sma).toBeCloseTo(30, 1);
  });

  test('calcSMA returns 0 when insufficient data', () => {
    expect(calcSMA([1, 2], 5)).toBe(0);
  });

  test('calcEMA responds to price changes', () => {
    const ema = calcEMA([...prices, 200], 21);
    expect(ema).toBeGreaterThan(0);
  });

  test('calcAllMAs returns all fields', () => {
    const result = calcAllMAs(prices);
    expect(result).toHaveProperty('SMA_20');
    expect(result).toHaveProperty('SMA_60');
    expect(result).toHaveProperty('SMA_200');
    expect(result).toHaveProperty('EMA_8');
    expect(result).toHaveProperty('EMA_21');
    expect(result).toHaveProperty('EMA_55');
    expect(result).toHaveProperty('EMA_144');
    expect(result).toHaveProperty('EMA_200');
    expect(result).toHaveProperty('EMA_slope');
    expect(result).toHaveProperty('MA_alignment_score');
  });

  test('MA_alignment_score is between -100 and 100', () => {
    const score = calcMAAlignmentScore(prices);
    expect(score).toBeGreaterThanOrEqual(-100);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('Momentum Indicators', () => {
  const prices = Array.from({ length: 100 }, (_, i) => 100 + i * 0.5);

  test('RSI is between 0 and 100', () => {
    const rsi = calcRSI(prices);
    expect(rsi).toBeGreaterThanOrEqual(0);
    expect(rsi).toBeLessThanOrEqual(100);
  });

  test('RSI returns 50 on insufficient data', () => {
    expect(calcRSI([100, 101], 14)).toBe(50);
  });

  test('MACD returns correct fields', () => {
    const macd = calcMACD(prices);
    expect(macd).toHaveProperty('MACD_line');
    expect(macd).toHaveProperty('MACD_signal');
    expect(macd).toHaveProperty('MACD_histogram');
  });

  test('Bollinger Width is positive', () => {
    const mixed = Array.from({ length: 30 }, (_, i) => 100 + Math.random() * 10);
    expect(calcBollingerWidth(mixed)).toBeGreaterThan(0);
  });

  test('RSI trending up market is above 50', () => {
    const bullishPrices = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
    const rsi = calcRSI(bullishPrices);
    expect(rsi).toBeGreaterThan(50);
  });
});

describe('Volatility', () => {
  const highs = Array.from({ length: 20 }, (_, i) => 105 + i);
  const lows = Array.from({ length: 20 }, (_, i) => 95 + i);
  const closes = Array.from({ length: 20 }, (_, i) => 100 + i);

  test('ATR is positive', () => {
    const atr = calcATR(highs, lows, closes, 14);
    expect(atr).toBeGreaterThan(0);
  });

  test('Volatility regime classification', () => {
    expect(calcVolatilityRegime(1, 1)).toBe('normal');
    expect(calcVolatilityRegime(0.2, 1)).toBe('low');
    expect(calcVolatilityRegime(2, 1)).toBe('high');
    expect(calcVolatilityRegime(3, 1)).toBe('extreme');
  });
});

describe('Volume', () => {
  const volumes = [100, 110, 90, 105, 95, 115, 85, 120, 80, 125];

  test('Volume ratio is positive', () => {
    expect(calcVolumeRatio(volumes, 5)).toBeGreaterThan(0);
  });

  test('Volume acceleration reflects recent change', () => {
    const acc = calcVolumeAcceleration([100, 110, 130]);
    expect(typeof acc).toBe('number');
  });
});

describe('Structure', () => {
  test('Detect uptrend', () => {
    const uptrend = Array.from({ length: 25 }, (_, i) => 100 + i * 2);
    expect(determineTrend(uptrend)).toBe('up');
  });

  test('Detect downtrend', () => {
    const downtrend = Array.from({ length: 25 }, (_, i) => 200 - i * 2);
    expect(determineTrend(downtrend)).toBe('down');
  });

  test('Detect sideways', () => {
    const sideways = Array.from({ length: 25 }, (_, i) => 100 + Math.sin(i) * 0.1);
    expect(determineTrend(sideways)).toBe('sideways');
  });

  test('Structure break detection', () => {
    const prices = [100, 101, 102, 103, 104, 115, 116, 117, 118, 119];
    expect(detectStructureBreak(prices, 5)).toBe(true);
  });
});

describe('Derived Micro', () => {
  const now = Date.now();
  const trades: Trade[] = [
    { trade_id: '1', price: 100, size: 1, side: 'buy', timestamp_ms: now - 2000 },
    { trade_id: '2', price: 100, size: 2, side: 'sell', timestamp_ms: now - 3000 },
    { trade_id: '3', price: 100, size: 0.5, side: 'buy', timestamp_ms: now - 1000 },
  ];

  test('Net flow calculation', () => {
    const flow = calcNetFlow(trades, 10000);
    expect(typeof flow).toBe('number');
  });

  test('Taker buy ratio is between 0 and 1', () => {
    const ratio = calcTakerBuyRatio(trades, 10000);
    expect(ratio).toBeGreaterThanOrEqual(0);
    expect(ratio).toBeLessThanOrEqual(1);
  });

  test('Cumulative delta is computed', () => {
    const delta = calcCumulativeDelta(trades);
    expect(typeof delta).toBe('number');
  });
});

describe('Liquidity', () => {
  test('Orderbook imbalance between -1 and 1', () => {
    const bids = [{ price: 99, size: 10 }, { price: 98, size: 5 }];
    const asks = [{ price: 101, size: 3 }, { price: 102, size: 2 }];
    const imbalance = calcOrderbookImbalance(bids, asks);
    expect(imbalance).toBeGreaterThanOrEqual(-1);
    expect(imbalance).toBeLessThanOrEqual(1);
  });

  test('Positive imbalance when bids > asks', () => {
    const bids = [{ price: 99, size: 100 }];
    const asks = [{ price: 101, size: 1 }];
    expect(calcOrderbookImbalance(bids, asks)).toBeGreaterThan(0);
  });
});

describe('Intermarket', () => {
  test('Correlation between -1 and 1', () => {
    const s1 = [1, 2, 3, 4, 5];
    const s2 = [2, 4, 6, 8, 10];
    const corr = calcCorrelation(s1, s2);
    expect(corr).toBeCloseTo(1, 5);
  });

  test('Negative correlation', () => {
    const s1 = [1, 2, 3, 4, 5];
    const s2 = [5, 4, 3, 2, 1];
    const corr = calcCorrelation(s1, s2);
    expect(corr).toBeCloseTo(-1, 5);
  });

  test('BTC trend score within range', () => {
    const btcCloses = Array.from({ length: 25 }, (_, i) => 50000 + i * 100);
    const score = calcBTCTrendScore(btcCloses);
    expect(score).toBeGreaterThanOrEqual(-100);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('Risk Signals', () => {
  test('Flash move detected on large price spike', () => {
    const prices = [100, 100, 100, 100, 100, 140];
    expect(detectFlashMove(prices, 5, 0.03)).toBe(true);
  });

  test('No flash move on normal price', () => {
    const prices = [100, 101, 100, 102, 101, 101];
    expect(detectFlashMove(prices, 5, 0.03)).toBe(false);
  });

  test('Abnormal spread detected', () => {
    expect(detectAbnormalSpread(30, 5, 3)).toBe(true);
    expect(detectAbnormalSpread(10, 5, 3)).toBe(false);
  });
});

describe('Volume Profile', () => {
  test('Volume profile returns valid structure', () => {
    const trades = Array.from({ length: 100 }, (_, i) => ({
      price: 100 + (i % 10),
      size: Math.random() * 10,
    }));
    const profile = calcVolumeProfile(trades);
    expect(profile).toHaveProperty('POC');
    expect(profile).toHaveProperty('value_area_high');
    expect(profile).toHaveProperty('value_area_low');
    expect(profile.POC).toBeGreaterThan(0);
    expect(profile.value_area_high).toBeGreaterThanOrEqual(profile.value_area_low);
  });

  test('Empty trades returns zeros', () => {
    const profile = calcVolumeProfile([]);
    expect(profile.POC).toBe(0);
  });
});
