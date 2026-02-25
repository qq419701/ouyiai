import { callDeepSeek } from './ai-providers/deepseek';
import { callOpenAI } from './ai-providers/openai';
import { callClaude } from './ai-providers/claude';
import { getModelConfig, selectModelTier, TierDecisionParams } from './model-selector';
import { AIOutput } from './types';
import { CoinSymbol, ModelTier } from '../../utils/types';
import { logger } from '../../utils/logger';

const AI_TIMEOUT_MS = 30000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
  );
  return Promise.race([promise, timeout]);
}

export class AIEngine {
  async analyze(
    prompt: string,
    coin: CoinSymbol,
    tierParams: TierDecisionParams,
  ): Promise<{ outputs: AIOutput[]; tier: ModelTier }> {
    const tier = selectModelTier(tierParams);

    const ai1Config = getModelConfig('AI-1', tier);
    const ai2Config = getModelConfig('AI-2', tier);
    const ai3Config = getModelConfig('AI-3', tier);

    const tasks = [
      withTimeout(callDeepSeek(prompt, ai1Config.model, coin), AI_TIMEOUT_MS, 'AI-1').catch(
        (err) => { logger.warn({ err }, 'AI-1 failed'); return null; },
      ),
      withTimeout(callOpenAI(prompt, ai2Config.model, coin), AI_TIMEOUT_MS, 'AI-2').catch(
        (err) => { logger.warn({ err }, 'AI-2 failed'); return null; },
      ),
      withTimeout(callClaude(prompt, ai3Config.model, coin), AI_TIMEOUT_MS, 'AI-3').catch(
        (err) => { logger.warn({ err }, 'AI-3 failed'); return null; },
      ),
    ];

    const results = await Promise.all(tasks);
    const outputs = results.filter((r): r is AIOutput => r !== null);

    logger.info({ coin, tier, aiCount: outputs.length }, 'AI analysis complete');
    return { outputs, tier };
  }
}
