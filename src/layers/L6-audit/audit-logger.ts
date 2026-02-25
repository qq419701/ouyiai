import { PrismaClient } from '@prisma/client';
import { computeHash } from './hash-chain';
import { logger } from '../../utils/logger';

export class AuditLogger {
  private sequenceNum = 0;
  private lastHash: string | null = null;

  constructor(private prisma: PrismaClient) {}

  async initialize(): Promise<void> {
    const last = await this.prisma.auditLog.findFirst({
      orderBy: { sequenceNum: 'desc' },
    });
    if (last) {
      this.sequenceNum = last.sequenceNum;
      this.lastHash = last.hash;
    }
  }

  async log(params: {
    accountId?: string;
    eventType: string;
    coin?: string;
    orderId?: string;
    analysisId?: string;
    data: unknown;
  }): Promise<void> {
    this.sequenceNum++;
    const hash = computeHash(params.data, this.lastHash);
    this.lastHash = hash;

    try {
      await this.prisma.auditLog.create({
        data: {
          accountId: params.accountId,
          eventType: params.eventType,
          coin: params.coin,
          orderId: params.orderId,
          analysisId: params.analysisId,
          data: params.data as import('@prisma/client').Prisma.InputJsonValue,
          previousHash: this.lastHash,
          hash,
          sequenceNum: this.sequenceNum,
        },
      });
    } catch (err) {
      logger.error({ err, eventType: params.eventType }, 'Failed to write audit log');
    }
  }
}
