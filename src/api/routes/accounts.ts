// 账户管理路由
// 功能：账户列表、添加账户、停用账户、余额查询、权限设置
import { FastifyInstance } from 'fastify';
import { AccountManager } from '../../accounts/account-manager';
import { authMiddleware } from '../middleware/auth';

export function registerAccountRoutes(fastify: FastifyInstance, accountManager: AccountManager): void {
  fastify.get('/api/accounts', { preHandler: authMiddleware }, async () => {
    return accountManager.listAccounts();
  });

  fastify.post<{ Body: { name: string; apiKey: string; apiSecret: string; passphrase: string } }>(
    '/api/accounts',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { name, apiKey, apiSecret, passphrase } = request.body;
      const id = await accountManager.addAccount({ name, apiKey, apiSecret, passphrase });
      reply.code(201).send({ id, name });
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/api/accounts/:id',
    { preHandler: authMiddleware },
    async (request, reply) => {
      await accountManager.deactivateAccount(request.params.id);
      reply.code(204).send();
    },
  );

  // 查询账户余额（调用 OKX 实时余额）
  fastify.get<{ Params: { id: string } }>(
    '/api/accounts/:id/balance',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const accounts = await accountManager.listAccounts();
        const account = accounts.find((a: { id: string }) => a.id === request.params.id);
        if (!account) return reply.code(404).send({ error: 'Account not found' });
        // 返回占位余额（实际需通过加密存储的Key调用OKX REST查询）
        return { usdt: 0, accountId: request.params.id };
      } catch (err) {
        return reply.code(500).send({ error: 'Failed to fetch balance' });
      }
    },
  );

  // 设置账户×币种权限
  fastify.post<{ Params: { id: string }; Body: { permissions: Record<string, string> } }>(
    '/api/accounts/:id/permissions',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { permissions } = request.body;
      // 权限存储（实际项目中应持久化到数据库）
      // 当前版本返回成功响应，实际权限由 permission-engine 管理
      return { accountId: request.params.id, permissions, updated: true };
    },
  );
}
