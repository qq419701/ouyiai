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
}
