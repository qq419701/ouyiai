import axios from 'axios';
import { env } from '../../../config/env';
import { AIOutput } from '../types';
import { CoinSymbol, TradeAction, RiskLevel } from '../../../utils/types';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

export async function callDeepSeek(
  prompt: string,
  model: string,
  coin: CoinSymbol,
): Promise<AIOutput> {
  const start = Date.now();

  const response = await axios.post(
    `${DEEPSEEK_BASE_URL}/chat/completions`,
    {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    },
    {
      headers: {
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    },
  );

  const latency = Date.now() - start;
  const content = response.data.choices[0]?.message?.content || '{}';
  const tokens = response.data.usage?.total_tokens || 0;

  let analysis;
  try {
    analysis = JSON.parse(content);
  } catch {
    analysis = { action: 'hold', confidence: 0.5, risk_level: 'P2', recommended_size_pct: 0, entry_price_range: [0, 0], stop_loss: 0, take_profit: [], whale_influence: 'unknown', key_factors: ['parse_error'] };
  }

  return {
    ai_id: 'AI-1',
    model,
    coin,
    latency_ms: latency,
    tokens_used: tokens,
    estimated_cost: (tokens / 1000) * 0.0001,
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
