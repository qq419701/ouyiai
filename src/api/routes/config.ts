import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { COINS } from '../../config/coins';
import riskRules from '../../config/risk-rules.json';

export function registerConfigRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/config/coins', { preHandler: authMiddleware }, async () => {
    return COINS;
  });

  fastify.get('/api/config/risk-rules', { preHandler: authMiddleware }, async () => {
    return riskRules;
  });
}
