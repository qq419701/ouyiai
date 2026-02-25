// 豆包 AI 提供者（字节跳动火山引擎）
// 功能：调用豆包大模型进行现货交易分析
// API文档：https://ark.cn-beijing.volces.com/api/v3/chat/completions
import axios from 'axios';
import { env } from '../../../config/env';
import { AIOutput } from '../types';
import { CoinSymbol, TradeAction, RiskLevel } from '../../../utils/types';

// 豆包 API 基础地址（火山引擎）
const DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

/**
 * 调用豆包 AI 进行市场分析
 * @param prompt 分析提示词
 * @param model 模型名称（如 doubao-pro-32k）
 * @param coin 交易币种
 */
export async function callDoubao(
  prompt: string,
  model: string,
  coin: CoinSymbol,
): Promise<AIOutput> {
  const start = Date.now();

  // 如果传入的 model 不是 endpoint 格式（ep-xxx），则使用环境变量中的 endpoint ID
  const actualModel = model.startsWith('ep-') ? model : (env.DOUBAO_ENDPOINT_ID || model);

  const response = await axios.post(
    `${DOUBAO_BASE_URL}/chat/completions`,
    {
      model: actualModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    },
    {
      headers: {
        Authorization: `Bearer ${env.DOUBAO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    },
  );

  const latency = Date.now() - start;
  const content = response.data.choices[0]?.message?.content || '{}';
  const tokens = response.data.usage?.total_tokens || 0;
  // 豆包定价：pro-32k 约 ¥0.0008/千tokens
  const costPer1k = model.includes('256k') ? 0.0007 : 0.0001;

  let analysis;
  try {
    // 提取 JSON 内容
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
  } catch {
    analysis = { action: 'hold', confidence: 0.5, risk_level: 'P2', recommended_size_pct: 0, entry_price_range: [0, 0], stop_loss: 0, take_profit: [], whale_influence: 'unknown', key_factors: ['parse_error'] };
  }

  return {
    ai_id: 'AI-1',
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
