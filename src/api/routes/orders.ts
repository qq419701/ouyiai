// 订单路由
// 功能：查询订单列表（支持分页/筛选）、订单详情、订单统计
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

export function registerOrderRoutes(fastify: FastifyInstance, prisma: PrismaClient): void {
  fastify.get<{ Querystring: { accountId?: string; coin?: string; status?: string; limit?: string; page?: string; pageSize?: string } }>(
    '/api/orders',
    { preHandler: authMiddleware },
    async (request) => {
      const { accountId, coin, status, limit, page = '1', pageSize = '20' } = request.query;
      const where = {
        ...(accountId ? { accountId } : {}),
        ...(coin ? { coin } : {}),
        ...(status ? { status } : {}),
      };
      // 支持分页
      if (page || pageSize) {
        const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
        const take = parseInt(pageSize, 10);
        const [items, total] = await Promise.all([
          prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
          prisma.order.count({ where }),
        ]);
        return { items, total, page: parseInt(page, 10), pageSize: take, totalPages: Math.ceil(total / take) };
      }
      return prisma.order.findMany({
        where,
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

  // 订单统计
  fastify.get(
    '/api/orders/stats',
    { preHandler: authMiddleware },
    async () => {
      const [total, filled, cancelled, failed] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'filled' } }),
        prisma.order.count({ where: { status: 'cancelled' } }),
        prisma.order.count({ where: { status: 'failed' } }),
      ]);
      return { total, filled, cancelled, failed };
    },
  );
}
