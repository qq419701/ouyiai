export interface Coin {
  symbol: string;
  instId: string;
  name: string;
}

export type CoinSymbol = 'BTC' | 'ETH' | 'SOL';
export type TrendDirection = 'up' | 'down' | 'sideways';
export type VolatilityRegime = 'low' | 'normal' | 'high' | 'extreme';
export type SystemMode = 'active' | 'degraded' | 'paused' | 'emergency';
export type RiskLevel = 'P0' | 'P1' | 'P2';
export type TradeAction = 'buy' | 'sell' | 'hold';
export type WhaleBias = 'bullish' | 'bearish' | 'neutral';
export type PermissionMode = 'observe' | 'notify_only' | 'auto_buy' | 'auto_sell' | 'auto_both';
export type OrderStatus = 'pending' | 'submitted' | 'accepted' | 'partial_fill' | 'filled' | 'cancelled' | 'failed';
export type DataQuality = 'fresh' | 'stale' | 'degraded';
export type ModelTier = 'cheap' | 'premium';

export interface Trade {
  trade_id: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp_ms: number;
}

export interface OrderBook {
  bid_price_1: number;
  bid_size_1: number;
  ask_price_1: number;
  ask_size_1: number;
  bid_depth_top5: number;
  ask_depth_top5: number;
  bid_depth_top20: number;
  ask_depth_top20: number;
}

export interface Ticker {
  last_price: number;
  best_bid: number;
  best_ask: number;
  spread: number;
  spread_percent: number;
}

export interface DerivedMicro {
  net_flow_1s: number;
  net_flow_3s: number;
  net_flow_5s: number;
  net_flow_10s: number;
  taker_buy_ratio_5s: number;
  cumulative_delta: number;
  flow_velocity: number;
  flow_acceleration: number;
}

export interface Liquidity {
  orderbook_imbalance: number;
  top3_bid_drop_percent: number;
  top3_ask_drop_percent: number;
  liquidity_pull_signal: boolean;
  orderbook_thinness_score: number;
}

export interface Slippage {
  slippage_small: number;
  slippage_medium: number;
  slippage_large: number;
  slippage_change_rate: number;
  impact_cost: number;
}

export interface KlineBar {
  open_1m: number; high_1m: number; low_1m: number; close_1m: number; volume_1m: number;
  open_5m: number; high_5m: number; low_5m: number; close_5m: number; volume_5m: number;
  close_15m: number;
  close_1h: number;
}

export interface Structure {
  break_structure_5m: boolean;
  break_structure_15m: boolean;
  higher_high_flag: boolean;
  higher_low_flag: boolean;
  trend_direction: TrendDirection;
}

export interface Volatility {
  ATR_5m: number;
  ATR_15m: number;
  ATR_1h: number;
  range_percent_1h: number;
  volatility_regime: VolatilityRegime;
  regime_shift_flag: boolean;
}

export interface Volume {
  volume_ratio_5m: number;
  volume_ratio_15m: number;
  volume_acceleration: number;
}

export interface MovingAverages {
  SMA_20: number; SMA_60: number; SMA_200: number;
  EMA_8: number; EMA_21: number; EMA_55: number; EMA_144: number; EMA_200: number;
  EMA_slope: number;
  MA_alignment_score: number;
}

export interface Momentum {
  MACD_line: number;
  MACD_signal: number;
  MACD_histogram: number;
  RSI_14: number;
  ADX_value: number;
  BB_width: number;
}

export interface Profile {
  POC: number;
  value_area_high: number;
  value_area_low: number;
}

export interface Intermarket {
  BTC_close_5m: number;
  BTC_trend_score: number;
  sol_btc_correlation: number;
}

export interface RiskSignals {
  flash_move_flag: boolean;
  abnormal_spread_flag: boolean;
}

export interface AccountInfo {
  total_balance: number;
  available_balance: number;
  total_USDT: number;
  unrealized_pnl: number;
  today_delta: number;
}

export interface StrategyState {
  system_mode: SystemMode;
  trend_lock_flag: boolean;
  cooldown_timer: number;
  last_action: string;
  action_confidence: number;
}

export interface SystemHealthMetrics {
  ws_latency: number;
  api_latency: number;
  order_submit_latency: number;
  error_rate: number;
}

export interface MarketSnapshot {
  coin: CoinSymbol;
  timestamp: number;
  trade?: Trade;
  orderBook?: OrderBook;
  ticker?: Ticker;
}

export interface FullDataSnapshot {
  coin: CoinSymbol;
  timestamp: number;
  ticker: Ticker;
  orderBook: OrderBook;
  derivedMicro: DerivedMicro;
  liquidity: Liquidity;
  slippage: Slippage;
  kline: KlineBar;
  structure: Structure;
  volatility: Volatility;
  volume: Volume;
  ma: MovingAverages;
  momentum: Momentum;
  profile: Profile;
  intermarket: Intermarket;
  riskSignals: RiskSignals;
}
