import { v4 as uuidv4 } from 'uuid';
import { AIOutput, ArbitrationResult } from '../L3-analysis/types';
import { CoinSymbol, TradeAction, RiskLevel, ModelTier } from '../../utils/types';
import { logger } from '../../utils/logger';

export class Arbiter {
  arbitrate(
    outputs: AIOutput[],
    coin: CoinSymbol,
    whaleScore: number,
    volatilityRatio: number,
    apiHealthDegraded: boolean,
    modelTier: ModelTier,
  ): ArbitrationResult {
    if (outputs.length === 0) {
      return this.holdResult(coin, outputs, modelTier, 'no_ai_outputs');
    }

    const votes = outputs.map(o => o.analysis.action);
    const voteBreakdown: Record<string, TradeAction> = {};
    outputs.forEach(o => { voteBreakdown[o.ai_id] = o.analysis.action; });

    const buys = votes.filter(v => v === 'buy').length;
    const sells = votes.filter(v => v === 'sell').length;
    const holds = votes.filter(v => v === 'hold').length;

    let action: TradeAction = 'hold';
    let consensusType: ArbitrationResult['consensus_type'] = 'diverged';
    let baseConfidence = 0;

    if (outputs.length >= 3 && (buys === 3 || sells === 3 || holds === 3)) {
      // 3 unanimous
      action = votes[0];
      consensusType = '3_unanimous';
      baseConfidence = outputs.reduce((s, o) => s + o.analysis.confidence, 0) / outputs.length * 1.1;
    } else if (buys >= 2 || sells >= 2) {
      // 2 majority
      action = buys >= 2 ? 'buy' : 'sell';
      consensusType = '2_majority';
      const majorityOutputs = outputs.filter(o => o.analysis.action === action);
      baseConfidence = majorityOutputs.reduce((s, o) => s + o.analysis.confidence, 0) / majorityOutputs.length * 0.9;
    } else {
      return this.holdResult(coin, outputs, modelTier, 'diverged');
    }

    // Whale adjustments
    let whaleOverride = false;
    let finalConfidence = Math.min(1, baseConfidence);
    let riskLevel: RiskLevel = outputs[0]?.analysis?.risk_level || 'P2';

    if (whaleScore > 85) {
      whaleOverride = true;
      finalConfidence = Math.min(1, finalConfidence + 0.1);
      riskLevel = 'P0';
    } else if (whaleScore > 75) {
      // Lower risk by one level
      if (riskLevel === 'P2') riskLevel = 'P1';
    }

    if (volatilityRatio > 2) {
      finalConfidence *= 0.7;
    }

    if (apiHealthDegraded) {
      finalConfidence *= 0.8;
    }

    return {
      coin,
      final_action: action,
      final_confidence: parseFloat(finalConfidence.toFixed(4)),
      risk_level: riskLevel,
      vote_breakdown: voteBreakdown,
      consensus_type: consensusType,
      whale_override: whaleOverride,
      model_tier: modelTier,
      analysis_id: uuidv4(),
      analysed_at: new Date(),
      ai_outputs: outputs,
    };
  }

  private holdResult(
    coin: CoinSymbol,
    outputs: AIOutput[],
    modelTier: ModelTier,
    reason: string,
  ): ArbitrationResult {
    logger.info({ coin, reason }, 'Arbiter: holding due to divergence or no outputs');
    return {
      coin,
      final_action: 'hold',
      final_confidence: 0,
      risk_level: 'P2',
      vote_breakdown: {},
      consensus_type: 'diverged',
      whale_override: false,
      model_tier: modelTier,
      analysis_id: uuidv4(),
      analysed_at: new Date(),
      ai_outputs: outputs,
    };
  }
}
