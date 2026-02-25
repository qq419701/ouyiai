import { CoinSymbol, TradeAction, RiskLevel, ModelTier } from '../../utils/types';

export interface AIOutput {
  ai_id: string;
  model: string;
  coin: CoinSymbol;
  latency_ms: number;
  tokens_used: number;
  estimated_cost: number;
  analysis: {
    action: TradeAction;
    confidence: number;
    risk_level: RiskLevel;
    recommended_size_pct: number;
    entry_price_range: [number, number];
    stop_loss: number;
    take_profit: number[];
    whale_influence: string;
    key_factors: string[];
  };
}

export interface ArbitrationResult {
  coin: CoinSymbol;
  final_action: TradeAction;
  final_confidence: number;
  risk_level: RiskLevel;
  vote_breakdown: Record<string, TradeAction>;
  consensus_type: '3_unanimous' | '2_majority' | 'diverged';
  whale_override: boolean;
  model_tier: ModelTier;
  analysis_id: string;
  analysed_at: Date;
  ai_outputs: AIOutput[];
}

export interface ModelConfig {
  provider: string;
  model: string;
  costPer1kTokens: number;
}

export interface ModelTierConfig {
  cheap: ModelConfig;
  premium: ModelConfig;
}
