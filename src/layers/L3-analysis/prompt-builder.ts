import { CoinSymbol } from '../../utils/types';

export interface MarketSummary {
  coin: CoinSymbol;
  current_price: number;
  change_24h_pct: number;
  change_7d_pct: number;
  change_30d_pct: number;
  year_high: number;
  year_low: number;
  price_position_pct: number;
  rsi_14: number;
  macd_histogram: number;
  adx_value: number;
  bb_width: number;
  ema_8: number;
  ema_21: number;
  ema_55: number;
  ema_200: number;
  ma_alignment_score: number;
  atr_5m: number;
  atr_1h: number;
  volatility_regime: string;
  regime_shift_flag: boolean;
  volume_ratio_5m: number;
  orderbook_imbalance: number;
  net_flow_5s: number;
  taker_buy_ratio_5s: number;
  whale_score: number;
  whale_bias: string;
  trend_direction: string;
  break_structure_5m: boolean;
  flash_move_flag: boolean;
  poc: number;
  spread_percent: number;
  slippage_medium: number;
  btc_trend_score: number;
  sol_btc_correlation?: number;
}

export function buildAnalysisPrompt(summary: MarketSummary): string {
  return `You are a professional cryptocurrency trading analyst. Analyze the following ${summary.coin}/USDT market data and provide a trading recommendation.

## Market Data Summary (${new Date().toISOString()})

**Price**: $${summary.current_price.toLocaleString()}
**Changes**: 24h: ${summary.change_24h_pct.toFixed(2)}% | 7d: ${summary.change_7d_pct.toFixed(2)}% | 30d: ${summary.change_30d_pct.toFixed(2)}%
**Year Range**: $${summary.year_low.toLocaleString()} - $${summary.year_high.toLocaleString()} (Position: ${summary.price_position_pct.toFixed(1)}%)

**Technical Indicators**:
- RSI(14): ${summary.rsi_14.toFixed(2)}
- MACD Histogram: ${summary.macd_histogram.toFixed(4)}
- ADX: ${summary.adx_value.toFixed(2)}
- BB Width: ${summary.bb_width.toFixed(4)}
- MA Alignment Score: ${summary.ma_alignment_score.toFixed(0)}/100

**Moving Averages**: EMA8=${summary.ema_8.toFixed(2)}, EMA21=${summary.ema_21.toFixed(2)}, EMA55=${summary.ema_55.toFixed(2)}, EMA200=${summary.ema_200.toFixed(2)}

**Volatility**: ATR(5m)=${summary.atr_5m.toFixed(4)}, ATR(1h)=${summary.atr_1h.toFixed(4)}, Regime=${summary.volatility_regime}, RegimeShift=${summary.regime_shift_flag}

**Order Flow**: Taker Buy Ratio(5s)=${(summary.taker_buy_ratio_5s * 100).toFixed(1)}%, Net Flow(5s)=${summary.net_flow_5s.toFixed(2)}, OB Imbalance=${summary.orderbook_imbalance.toFixed(3)}

**Volume**: Volume Ratio(5m)=${summary.volume_ratio_5m.toFixed(2)}x

**Structure**: Trend=${summary.trend_direction}, StructureBreak(5m)=${summary.break_structure_5m}, FlashMove=${summary.flash_move_flag}

**Whale Intelligence**: Score=${summary.whale_score}/100, Bias=${summary.whale_bias}

**Execution**: Spread=${summary.spread_percent.toFixed(4)}%, Slippage(med)=${summary.slippage_medium.toFixed(4)}%

**Cross-Market**: BTC Trend Score=${summary.btc_trend_score.toFixed(1)}${summary.sol_btc_correlation !== undefined ? `, SOL/BTC Correlation=${summary.sol_btc_correlation.toFixed(3)}` : ''}

## Instructions
Respond ONLY with valid JSON in this exact format:
{
  "action": "buy|sell|hold",
  "confidence": 0.0-1.0,
  "risk_level": "P0|P1|P2",
  "recommended_size_pct": 1-8,
  "entry_price_range": [lower, upper],
  "stop_loss": price,
  "take_profit": [target1, target2],
  "whale_influence": "description",
  "key_factors": ["factor1", "factor2", "factor3"]
}`;
}
