import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

export function registerOrderRoutes(fastify: FastifyInstance, prisma: PrismaClient): void {
  fastify.get<{ Querystring: { accountId?: string; coin?: string; status?: string; limit?: string } }>(
    '/api/orders',
    { preHandler: authMiddleware },
    async (request) => {
      const { accountId, coin, status, limit } = request.query;
      return prisma.order.findMany({
        where: {
          ...(accountId ? { accountId } : {}),
          ...(coin ? { coin } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit || '50', 10),
      });
    },
  );

  fastify.get<{ Params: { clOrdId: string } }>(
    '/api/orders/:clOrdId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const order = await prisma.order.findUnique({ where: { clOrdId: request.params.clOrdId } });
      if (!order) return reply.code(404).send({ error: 'Not found' });
      return order;
    },
  );
}
