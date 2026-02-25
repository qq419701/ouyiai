// Google Gemini AI 提供者
// 功能：调用 Google Gemini 模型进行现货交易分析
// API文档：https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
import axios from 'axios';
import { env } from '../../../config/env';
import { AIOutput } from '../types';
import { CoinSymbol, TradeAction, RiskLevel } from '../../../utils/types';

// Gemini API 基础地址
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * 调用 Google Gemini AI 进行市场分析
 * @param prompt 分析提示词
 * @param model 模型名称（如 gemini-2.0-flash）
 * @param coin 交易币种
 */
export async function callGemini(
  prompt: string,
  model: string,
  coin: CoinSymbol,
): Promise<AIOutput> {
  const start = Date.now();

  // Gemini 使用 API Key 查询参数认证
  const response = await axios.post(
    `${GEMINI_BASE_URL}/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
      },
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    },
  );

  const latency = Date.now() - start;
  const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  // Gemini token 统计
  const tokens = (response.data.usageMetadata?.promptTokenCount || 0) +
    (response.data.usageMetadata?.candidatesTokenCount || 0);
  // gemini-2.5-flash: $0.30/百万input tokens，gemini-2.5-flash-lite: $0.05/百万input tokens
  const costPer1k = model.includes('lite') ? 0.00005 : 0.0003;

  let analysis;
  try {
    // 提取 JSON 内容（可能包含 markdown 代码块）
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    analysis = { action: 'hold', confidence: 0.5, risk_level: 'P2', recommended_size_pct: 0, entry_price_range: [0, 0], stop_loss: 0, take_profit: [], whale_influence: 'unknown', key_factors: ['parse_error'] };
  }

  return {
    ai_id: 'AI-2',
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
