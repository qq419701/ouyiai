import { ModelTierConfig, ModelConfig } from './types';
import { ModelTier, RiskLevel } from '../../utils/types';

const AI_TIERS: Record<string, ModelTierConfig> = {
  'AI-1': {
    cheap: { provider: 'deepseek', model: 'deepseek-chat', costPer1kTokens: 0.0001 },
    premium: { provider: 'deepseek', model: 'deepseek-chat', costPer1kTokens: 0.0001 },
  },
  'AI-2': {
    cheap: { provider: 'openai', model: 'gpt-4o-mini', costPer1kTokens: 0.00015 },
    premium: { provider: 'openai', model: 'gpt-4o', costPer1kTokens: 0.005 },
  },
  'AI-3': {
    cheap: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022', costPer1kTokens: 0.0001 },
    premium: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', costPer1kTokens: 0.003 },
  },
};

export interface TierDecisionParams {
  whale_score: number;
  volatility_ratio: number;
  risk_level: RiskLevel;
  flash_move_flag: boolean;
  regime_shift_flag: boolean;
}

export function selectModelTier(params: TierDecisionParams): ModelTier {
  if (
    params.whale_score > 60 ||
    params.volatility_ratio > 1.5 ||
    params.risk_level === 'P0' ||
    params.risk_level === 'P1' ||
    params.flash_move_flag ||
    params.regime_shift_flag
  ) {
    return 'premium';
  }
  return 'cheap';
}

export function getModelConfig(aiId: string, tier: ModelTier): ModelConfig {
  const tierConfig = AI_TIERS[aiId];
  if (!tierConfig) throw new Error(`Unknown AI ID: ${aiId}`);
  return tierConfig[tier];
}

export function estimateCost(tokens: number, aiId: string, tier: ModelTier): number {
  const config = getModelConfig(aiId, tier);
  return (tokens / 1000) * config.costPer1kTokens;
}
