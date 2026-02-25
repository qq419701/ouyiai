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
}
