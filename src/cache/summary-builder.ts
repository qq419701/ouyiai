import { PrismaClient } from '@prisma/client';
import { CoinSymbol } from '../utils/types';
import { MarketSummary } from '../layers/L3-analysis/prompt-builder';
import { calcAllMAs } from '../indicators/moving-averages';
import { calcAllMomentum } from '../indicators/momentum';
import { calcATR, calcVolatilityRegime } from '../indicators/volatility';
import { calcVolumeRatio } from '../indicators/volume';
import { detectStructureBreak, determineTrend } from '../indicators/structure';
import { detectFlashMove } from '../indicators/risk-signals';
import { calcBTCTrendScore } from '../indicators/intermarket';
import { calcVolumeProfile } from '../indicators/profile';
import { logger } from '../utils/logger';

export class SummaryBuilder {
  constructor(private prisma: PrismaClient) {}

  async buildSummary(
    coin: CoinSymbol,
    whaleScore: number,
    whaleBias: string,
    currentPrice: number,
    spreadPercent: number,
    slippageMedium: number,
    orderbookImbalance: number,
    netFlow5s: number,
    takerBuyRatio5s: number,
  ): Promise<MarketSummary> {
    // Fetch 1h klines for 365 days
    const klines1h = await this.prisma.klineData.findMany({
      where: { coin, interval: '1h' },
      orderBy: { openTime: 'asc' },
      take: 365 * 24,
    });

    const klines5m = await this.prisma.klineData.findMany({
      where: { coin, interval: '5m' },
      orderBy: { openTime: 'asc' },
      take: 300,
    });

    const closes1h = klines1h.map(k => k.close);
    const closes5m = klines5m.map(k => k.close);
    const highs5m = klines5m.map(k => k.high);
    const lows5m = klines5m.map(k => k.low);
    const volumes5m = klines5m.map(k => k.volume);

    const yearHigh = klines1h.length > 0 ? Math.max(...klines1h.map(k => k.high)) : currentPrice;
    const yearLow = klines1h.length > 0 ? Math.min(...klines1h.map(k => k.low)) : currentPrice;
    const pricePosition = yearHigh > yearLow
      ? ((currentPrice - yearLow) / (yearHigh - yearLow)) * 100
      : 50;

    const change24h = closes1h.length >= 24
      ? ((currentPrice - closes1h[closes1h.length - 24]) / closes1h[closes1h.length - 24]) * 100
      : 0;
    const change7d = closes1h.length >= 168
      ? ((currentPrice - closes1h[closes1h.length - 168]) / closes1h[closes1h.length - 168]) * 100
      : 0;
    const change30d = closes1h.length >= 720
      ? ((currentPrice - closes1h[closes1h.length - 720]) / closes1h[closes1h.length - 720]) * 100
      : 0;

    const mas = calcAllMAs(closes1h);
    const momentum = calcAllMomentum(closes1h, klines1h.map(k => k.high), klines1h.map(k => k.low));
    const atr5m = calcATR(highs5m, lows5m, closes5m, 14);
    const atr1h = calcATR(klines1h.map(k => k.high), klines1h.map(k => k.low), closes1h, 14);
    const avgATR = closes1h.length > 30
      ? closes1h.slice(-30).reduce((s, _, i) => s + calcATR(klines1h.slice(-30).map(k => k.high), klines1h.slice(-30).map(k => k.low), closes1h.slice(-30), 1), 0) / 30
      : atr1h;
    const volatilityRegime = calcVolatilityRegime(atr1h, avgATR);

    const volumeRatio5m = calcVolumeRatio(volumes5m, 20);
    const trendDirection = determineTrend(closes5m);
    const breakStructure5m = detectStructureBreak(closes5m, 5);
    const flashMove = detectFlashMove(closes5m, 5, 0.03);

    const profile = calcVolumeProfile(
      klines5m.map(k => ({ price: k.close, size: k.volume })),
    );

    // BTC trend for cross-market (use SOL's own closes as proxy if coin is BTC)
    const btcTrend = calcBTCTrendScore(closes1h);

    const summary: MarketSummary = {
      coin,
      current_price: currentPrice,
      change_24h_pct: change24h,
      change_7d_pct: change7d,
      change_30d_pct: change30d,
      year_high: yearHigh,
      year_low: yearLow,
      price_position_pct: pricePosition,
      rsi_14: momentum.RSI_14,
      macd_histogram: momentum.MACD_histogram,
      adx_value: momentum.ADX_value,
      bb_width: momentum.BB_width,
      ema_8: mas.EMA_8,
      ema_21: mas.EMA_21,
      ema_55: mas.EMA_55,
      ema_200: mas.EMA_200,
      ma_alignment_score: mas.MA_alignment_score,
      atr_5m: atr5m,
      atr_1h: atr1h,
      volatility_regime: volatilityRegime,
      regime_shift_flag: volatilityRegime === 'extreme' || volatilityRegime === 'high',
      volume_ratio_5m: volumeRatio5m,
      orderbook_imbalance: orderbookImbalance,
      net_flow_5s: netFlow5s,
      taker_buy_ratio_5s: takerBuyRatio5s,
      whale_score: whaleScore,
      whale_bias: whaleBias,
      trend_direction: trendDirection,
      break_structure_5m: breakStructure5m,
      flash_move_flag: flashMove,
      poc: profile.POC,
      spread_percent: spreadPercent,
      slippage_medium: slippageMedium,
      btc_trend_score: btcTrend,
    };

    return summary;
  }
}
