// ChatGPT（OpenAI）AI 提供者
// 功能：调用 OpenAI GPT 模型进行现货交易分析
// API文档：https://api.openai.com/v1/chat/completions
import OpenAI from 'openai';
import { env } from '../../../config/env';
import { AIOutput } from '../types';
import { CoinSymbol, TradeAction, RiskLevel } from '../../../utils/types';

// OpenAI 客户端单例
let client: OpenAI | null = null;

/**
 * 获取 OpenAI 客户端（懒加载）
 */
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

/**
 * 调用 ChatGPT（OpenAI）进行市场分析
 * @param prompt 分析提示词
 * @param model 模型名称（如 gpt-4o-mini）
 * @param coin 交易币种
 */
export async function callChatGPT(
  prompt: string,
  model: string,
  coin: CoinSymbol,
): Promise<AIOutput> {
  const start = Date.now();
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const latency = Date.now() - start;
  const content = response.choices[0]?.message?.content || '{}';
  const tokens = response.usage?.total_tokens || 0;
  // gpt-4o-mini: $0.00015/千tokens，gpt-4o: $0.005/千tokens
  const costPer1k = model.includes('gpt-4o-mini') ? 0.00015 : 0.005;

  let analysis;
  try {
    analysis = JSON.parse(content);
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
