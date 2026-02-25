import { RiskLevel, TradeAction } from '../../utils/types';
import { RiskAction } from './types';
import riskRules from '../../config/risk-rules.json';
import { logger } from '../../utils/logger';

interface RiskTriggerParams {
  priceChange5minPct: number;
  orderbookDepthDropPct: number;
  whaleScore: number;
  flashMoveFlag: boolean;
  structureBreakout: boolean;
  atrMultiplier: number;
  regimeShiftFlag: boolean;
}

export class RiskEngine {
  determineRiskLevel(params: RiskTriggerParams): RiskLevel {
    const p0 = riskRules.P0.triggers;
    if (
      params.priceChange5minPct > p0.priceChange5min ||
      params.orderbookDepthDropPct > p0.orderbookDepthDrop ||
      params.whaleScore > p0.whaleScoreThreshold ||
      params.flashMoveFlag
    ) {
      return 'P0';
    }

    const p1 = riskRules.P1.triggers;
    if (
      params.structureBreakout ||
      params.atrMultiplier > p1.atrMultiplier ||
      (params.whaleScore >= p1.whaleScoreMin && params.whaleScore <= p1.whaleScoreMax) ||
      params.regimeShiftFlag
    ) {
      return 'P1';
    }

    return 'P2';
  }

  getRiskActions(level: RiskLevel): RiskAction {
    const rules = riskRules[level].actions;
    return {
      maxPositionPct: rules.maxPositionPct,
      batchCount: rules.batchCount,
      batchIntervalSec: rules.batchIntervalSec,
      cooldownSec: rules.cooldownSec,
      maxSlippagePct: rules.maxSlippagePct,
      notifyAllChannels: rules.notifyAllChannels,
      canOverrideCooldown: rules.canOverrideCooldown,
    };
  }

  validateRisk(action: TradeAction, confidence: number, riskLevel: RiskLevel): boolean {
    if (action === 'hold') return true;
    const riskActions = this.getRiskActions(riskLevel);
    if (confidence < 0.6) {
      logger.warn({ confidence, riskLevel }, 'Confidence too low for execution');
      return false;
    }
    return true;
  }
}
