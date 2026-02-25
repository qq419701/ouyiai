import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../../config/env';
import { AIOutput } from '../types';
import { CoinSymbol, TradeAction, RiskLevel } from '../../../utils/types';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function callClaude(
  prompt: string,
  model: string,
  coin: CoinSymbol,
): Promise<AIOutput> {
  const start = Date.now();
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });

  const latency = Date.now() - start;
  const content = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  const tokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  const costPer1k = model.includes('haiku') ? 0.0001 : 0.003;

  let analysis;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    analysis = { action: 'hold', confidence: 0.5, risk_level: 'P2', recommended_size_pct: 0, entry_price_range: [0, 0], stop_loss: 0, take_profit: [], whale_influence: 'unknown', key_factors: ['parse_error'] };
  }

  return {
    ai_id: 'AI-3',
    model,
    coin,
    latency_ms: latency,
    tokens_used: tokens,
    estimated_cost: (tokens / 1000) * costPer1k,
    analysis: {
      action: (analysis.action || 'hold') as TradeAction,
      confidence: Math.min(1, Math.max(0, analysis.confidence || 0.5)),
      risk_level: (analysis.risk_level || 'P2') as RiskLevel,
      recommended_size_pct: analysis.recommended_size_pct || 0,
      entry_price_range: analysis.entry_price_range || [0, 0],
      stop_loss: analysis.stop_loss || 0,
      take_profit: analysis.take_profit || [],
      whale_influence: analysis.whale_influence || 'neutral',
      key_factors: analysis.key_factors || [],
    },
  };
}
