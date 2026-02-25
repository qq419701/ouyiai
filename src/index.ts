import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

import { env } from './config/env';
import { logger } from './utils/logger';

import { OKXRestClient } from './layers/L1-data/okx-rest';
import { OKXWebSocket } from './layers/L1-data/okx-ws';
import { DataGateway } from './layers/L1-data/data-gateway';
import { HealthChecker } from './layers/L1-data/health-checker';

import { WhaleProviderChain } from './layers/L2-intel/whale-provider';
import { SnapshotAggregator } from './layers/L2-intel/snapshot-aggregator';

import { CacheManager } from './cache/cache-manager';

import { AccountManager } from './accounts/account-manager';
import { AuditLogger } from './layers/L6-audit/audit-logger';
import { AuditQueryService } from './layers/L6-audit/query-service';
import { DegradationManager } from './monitoring/degradation-manager';
import { Alerter } from './monitoring/alerter';

import { registerRateLimit } from './api/middleware/rate-limit';
import { registerAccountRoutes } from './api/routes/accounts';
import { registerAnalysisRoutes } from './api/routes/analysis';
import { registerOrderRoutes } from './api/routes/orders';
import { registerAuditRoutes } from './api/routes/audit';
import { registerHealthRoutes } from './api/routes/health';
import { registerConfigRoutes } from './api/routes/config';

import { COIN_SYMBOLS } from './config/coins';

async function bootstrap() {
  const fastify = Fastify({
    logger: false, // Using pino separately
  });

  // Plugins
  await fastify.register(cors, { origin: true });
  await fastify.register(jwt, { secret: env.JWT_SECRET });
  await registerRateLimit(fastify);

  // Database
  const prisma = new PrismaClient();
  const redis = new Redis(env.REDIS_URL);

  // Infrastructure
  const publicWs = new OKXWebSocket();
  const restClient = new OKXRestClient();
  const dataGateway = new DataGateway(publicWs, restClient, COIN_SYMBOLS);
  const healthChecker = new HealthChecker(restClient);

  // Cache
  const cacheManager = new CacheManager(redis, prisma, restClient);

  // Whale Intel
  const whaleProviderChain = new WhaleProviderChain();
  const snapshotAggregator = new SnapshotAggregator(whaleProviderChain);

  // Accounts
  const accountManager = new AccountManager(prisma);

  // Audit
  const auditLogger = new AuditLogger(prisma);
  const auditQueryService = new AuditQueryService(prisma);

  // Monitoring
  const degradationManager = new DegradationManager();
  const alerter = new Alerter();

  degradationManager.onModeChange(async (mode) => {
    await alerter.sendAlert(`System mode: ${mode}`, mode === 'emergency' ? 'critical' : 'warn');
  });

  // Auth route
  fastify.post<{ Body: { password: string } }>('/api/auth/login', async (request, reply) => {
    const { password } = request.body;
    // In production, validate password against stored hash
    if (!password) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    const token = fastify.jwt.sign({ role: 'admin' }, { expiresIn: '30m' });
    return { token };
  });

  // Routes
  registerAccountRoutes(fastify, accountManager);
  registerAnalysisRoutes(fastify, prisma);
  registerOrderRoutes(fastify, prisma);
  registerAuditRoutes(fastify, auditQueryService);
  registerHealthRoutes(fastify, healthChecker);
  registerConfigRoutes(fastify);

  // Root
  fastify.get('/', async () => ({
    name: 'OKX 现货 AI 分析系统',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  }));

  // Initialize
  try {
    await auditLogger.initialize();
    logger.info('Audit logger initialized');

    // Start WebSocket
    publicWs.connect();
    dataGateway.subscribeAll();
    logger.info('OKX WebSocket connected');

    // Start server
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info({ port: env.PORT }, 'Server started');

    // Start health checks (every 30s)
    setInterval(() => healthChecker.runAllChecks(), 30000);

  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await fastify.close();
    await prisma.$disconnect();
    redis.disconnect();
    publicWs.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
