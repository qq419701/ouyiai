import { FastifyInstance } from 'fastify';
import { AuditQueryService } from '../../layers/L6-audit/query-service';
import { authMiddleware } from '../middleware/auth';

export function registerAuditRoutes(fastify: FastifyInstance, auditService: AuditQueryService): void {
  fastify.get<{ Querystring: { accountId?: string; coin?: string; eventType?: string; limit?: string; offset?: string } }>(
    '/api/audit',
    { preHandler: authMiddleware },
    async (request) => {
      const { accountId, coin, eventType, limit, offset } = request.query;
      return auditService.queryLogs({
        accountId, coin, eventType,
        limit: parseInt(limit || '100', 10),
        offset: parseInt(offset || '0', 10),
      });
    },
  );

  fastify.get<{ Querystring: { startSeq?: string; endSeq?: string } }>(
    '/api/audit/verify',
    { preHandler: authMiddleware },
    async (request) => {
      const { startSeq, endSeq } = request.query;
      const valid = await auditService.verifyIntegrity(
        parseInt(startSeq || '1', 10),
        parseInt(endSeq || '1000', 10),
      );
      return { valid, startSeq, endSeq };
    },
  );
}
