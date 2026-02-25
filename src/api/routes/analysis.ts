// AI 分析结果路由
// 功能：提供最新分析结果、历史记录查询（分页）
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

export function registerAnalysisRoutes(fastify: FastifyInstance, prisma: PrismaClient): void {
  fastify.get<{ Querystring: { coin?: string; limit?: string } }>(
    '/api/analysis',
    { preHandler: authMiddleware },
    async (request) => {
      const { coin, limit } = request.query;
      return prisma.analysisResult.findMany({
        where: coin ? { coin } : undefined,
        orderBy: { analysedAt: 'desc' },
        take: parseInt(limit || '20', 10),
      });
    },
  );

  fastify.get<{ Params: { id: string } }>(
    '/api/analysis/:id',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const result = await prisma.analysisResult.findUnique({ where: { id: request.params.id } });
      if (!result) return reply.code(404).send({ error: 'Not found' });
      return result;
    },
  );

  // 最新分析结果（每币种最新一条，包含 AI outputs）
  fastify.get<{ Querystring: { coin?: string } }>(
    '/api/analysis/latest',
    { preHandler: authMiddleware },
    async (request) => {
      const coins = request.query.coin
        ? [request.query.coin]
        : ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'];
      const results = await Promise.all(
        coins.map(coin =>
          prisma.analysisResult.findFirst({
            where: { coin },
            orderBy: { analysedAt: 'desc' },
          }),
        ),
      );
      return results.filter(Boolean);
    },
  );

  // 历史分析记录（分页）
  fastify.get<{ Querystring: { coin?: string; page?: string; pageSize?: string } }>(
    '/api/analysis/history',
    { preHandler: authMiddleware },
    async (request) => {
      const { coin, page = '1', pageSize = '20' } = request.query;
      const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
      const take = parseInt(pageSize, 10);
      const where = coin ? { coin } : undefined;
      const [items, total] = await Promise.all([
        prisma.analysisResult.findMany({
          where,
          orderBy: { analysedAt: 'desc' },
          skip,
          take,
        }),
        prisma.analysisResult.count({ where }),
      ]);
      return { items, total, page: parseInt(page, 10), pageSize: take, totalPages: Math.ceil(total / take) };
    },
  );
}
