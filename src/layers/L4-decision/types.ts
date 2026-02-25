import { CoinSymbol, RiskLevel, TradeAction, PermissionMode } from '../../utils/types';

export interface RiskAction {
  maxPositionPct: number;
  batchCount: number;
  batchIntervalSec: number;
  cooldownSec: number;
  maxSlippagePct: number;
  notifyAllChannels: boolean;
  canOverrideCooldown: boolean;
}

export interface PermissionCheck {
  accountId: string;
  coin: CoinSymbol;
  action: TradeAction;
  orderSizeUSDT: number;
  slippageEstimate: number;
  systemHealthScore: number;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  effectiveMode: PermissionMode;
}

export interface CooldownState {
  accountId: string;
  coin: CoinSymbol;
  expiresAt: Date;
  riskLevel: RiskLevel;
}
