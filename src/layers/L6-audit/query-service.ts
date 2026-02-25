import { PrismaClient } from '@prisma/client';
import { verifyChain } from './hash-chain';

export class AuditQueryService {
  constructor(private prisma: PrismaClient) {}

  async queryLogs(params: {
    accountId?: string;
    coin?: string;
    eventType?: string;
    orderId?: string;
    analysisId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (params.accountId) where.accountId = params.accountId;
    if (params.coin) where.coin = params.coin;
    if (params.eventType) where.eventType = params.eventType;
    if (params.orderId) where.orderId = params.orderId;
    if (params.analysisId) where.analysisId = params.analysisId;
    if (params.startDate || params.endDate) {
      where.createdAt = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { sequenceNum: 'asc' },
      take: params.limit || 100,
      skip: params.offset || 0,
    });
  }

  async verifyIntegrity(startSeq: number, endSeq: number): Promise<boolean> {
    const logs = await this.prisma.auditLog.findMany({
      where: { sequenceNum: { gte: startSeq, lte: endSeq } },
      orderBy: { sequenceNum: 'asc' },
    });

    const entries = logs.map(l => ({
      hash: l.hash,
      previousHash: l.previousHash,
      data: l.data,
    }));

    return verifyChain(entries);
  }
}
