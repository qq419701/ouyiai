import { PrismaClient } from '@prisma/client';
import { PermissionCheck, PermissionResult } from './types';
import { TradeAction } from '../../utils/types';
import { logger } from '../../utils/logger';

export class PermissionEngine {
  constructor(private prisma: PrismaClient) {}

  async checkPermission(params: PermissionCheck): Promise<PermissionResult> {
    const perm = await this.prisma.accountPermission.findUnique({
      where: { accountId_coin: { accountId: params.accountId, coin: params.coin } },
    });

    if (!perm) {
      return { allowed: false, reason: 'No permission record found', effectiveMode: 'observe' };
    }

    const mode = perm.mode as import('../../utils/types').PermissionMode;

    if (mode === 'observe') {
      return { allowed: false, reason: 'Account in observe mode', effectiveMode: mode };
    }

    if (mode === 'notify_only') {
      return { allowed: false, reason: 'Account in notify_only mode', effectiveMode: mode };
    }

    if (params.action === 'buy' && mode === 'auto_sell') {
      return { allowed: false, reason: 'Mode does not allow buy', effectiveMode: mode };
    }

    if (params.action === 'sell' && mode === 'auto_buy') {
      return { allowed: false, reason: 'Mode does not allow sell', effectiveMode: mode };
    }

    if (params.systemHealthScore < 50) {
      return { allowed: false, reason: 'System health critical', effectiveMode: mode };
    }

    if (perm.dailyLimit > 0 && perm.currentDailyVolume + params.orderSizeUSDT > perm.dailyLimit) {
      return { allowed: false, reason: 'Daily limit exceeded', effectiveMode: mode };
    }

    if (perm.singleOrderMax > 0 && params.orderSizeUSDT > perm.singleOrderMax) {
      return { allowed: false, reason: 'Single order limit exceeded', effectiveMode: mode };
    }

    if (params.slippageEstimate > 0.5) {
      return { allowed: false, reason: 'Slippage estimate too high', effectiveMode: mode };
    }

    return { allowed: true, effectiveMode: mode };
  }

  async updateDailyStats(accountId: string, coin: string, volume: number): Promise<void> {
    await this.prisma.accountPermission.updateMany({
      where: { accountId, coin },
      data: {
        currentDailyVolume: { increment: volume },
        currentDailyTrades: { increment: 1 },
      },
    });
  }
}
