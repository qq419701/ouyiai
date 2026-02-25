import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { OKXRestClient } from '../L1-data/okx-rest';
import { OrderParams, OrderResult, BatchOrderResult } from './types';
import { OrderStateMachine } from './order-state-machine';
import { buildBatchOrders } from './split-strategy';
import { withRetry } from './retry-handler';
import { logger } from '../../utils/logger';

export class OrderEngine {
  constructor(
    private prisma: PrismaClient,
    private restClient: OKXRestClient,
  ) {}

  private buildClOrdId(accountId: string, coin: string): string {
    const ts = Date.now();
    const nonce = uuidv4().replace(/-/g, '').substring(0, 8);
    return `${accountId.substring(0, 8)}_${coin}_${ts}_${nonce}`;
  }

  async executeOrder(params: OrderParams): Promise<BatchOrderResult> {
    const batches = buildBatchOrders(params);
    const results: OrderResult[] = [];

    for (const batch of batches) {
      if (batch.delayMs > 0) {
        await new Promise(r => setTimeout(r, batch.delayMs));
      }

      const clOrdId = this.buildClOrdId(params.accountId, params.coin);
      const sm = new OrderStateMachine(clOrdId);

      // Save pending order
      await this.prisma.order.create({
        data: {
          accountId: params.accountId,
          clOrdId,
          coin: params.coin,
          side: params.side,
          size: batch.sizeUSDT,
          status: 'pending',
          riskLevel: params.riskLevel,
          analysisId: params.analysisId,
          batchIndex: batch.batchIndex,
          totalBatches: batch.totalBatches,
        },
      });

      try {
        sm.transition('submitted');
        await this.prisma.order.update({
          where: { clOrdId },
          data: { status: 'submitted' },
        });

        const orderResult = await withRetry(
          () => this.restClient.placeOrder({
            instId: `${params.coin}-USDT`,
            tdMode: 'cash',
            side: params.side,
            ordType: 'market',
            sz: String(batch.sizeUSDT),
            clOrdId,
          }),
          3,
          `order_${clOrdId}`,
        ) as { ordId?: string };

        sm.transition('accepted');
        await this.prisma.order.update({
          where: { clOrdId },
          data: { status: 'accepted' },
        });

        results.push({
          clOrdId,
          orderId: orderResult?.ordId,
          status: 'accepted',
        });
      } catch (err) {
        sm.transition('failed');
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        await this.prisma.order.update({
          where: { clOrdId },
          data: { status: 'failed', errorMessage },
        });
        results.push({ clOrdId, status: 'failed', errorMessage });
        logger.error({ clOrdId, err }, 'Order failed');
      }
    }

    const filled = results.filter(r => r.status === 'accepted' || r.status === 'filled');
    const success = filled.length > 0;
    const totalFilled = filled.reduce((s, r) => s + (r.filledSize || 0), 0);
    const avgPrice = filled.length > 0
      ? filled.reduce((s, r) => s + (r.avgFillPrice || 0), 0) / filled.length
      : 0;

    return { allResults: results, totalFilled, avgPrice, success };
  }
}
