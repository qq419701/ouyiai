// 模型选择器：根据市场状态选择合适的 AI 模型档位
// AI-1: 豆包（字节跳动火山引擎）
// AI-2: Google Gemini
// AI-3: ChatGPT（OpenAI）
import { ModelTierConfig, ModelConfig } from './types';
import { ModelTier, RiskLevel } from '../../utils/types';

const AI_TIERS: Record<string, ModelTierConfig> = {
  'AI-1': {
    cheap: { provider: 'doubao', model: 'doubao-pro-32k', costPer1kTokens: 0.0001 },
    premium: { provider: 'doubao', model: 'doubao-pro-256k', costPer1kTokens: 0.0007 },
  },
  'AI-2': {
    cheap: { provider: 'gemini', model: 'gemini-2.0-flash', costPer1kTokens: 0.0001 },
    premium: { provider: 'gemini', model: 'gemini-2.0-pro', costPer1kTokens: 0.003 },
  },
  'AI-3': {
    cheap: { provider: 'openai', model: 'gpt-4o-mini', costPer1kTokens: 0.00015 },
    premium: { provider: 'openai', model: 'gpt-4o', costPer1kTokens: 0.005 },
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
