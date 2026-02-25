import { FastifyInstance } from 'fastify';
import { HealthChecker } from '../../layers/L1-data/health-checker';
import { calculateHealthScore } from '../../monitoring/health-scorer';

export function registerHealthRoutes(fastify: FastifyInstance, healthChecker: HealthChecker): void {
  fastify.get('/api/health', async () => {
    const results = healthChecker.getAllResults();
    const wsResult = healthChecker.getResult('ticker');
    const restResult = healthChecker.getResult('orderbook');

    const healthScore = calculateHealthScore({
      ws_latency: wsResult?.latencyP50 || 0,
      rest_api_latency: restResult?.latencyP50 || 0,
      error_rate: wsResult?.errorRate || 0,
      ai_latency: 0,
      whale_data_freshness: 0,
      order_success_rate: 100,
    });

    return {
      score: healthScore.overall,
      mode: healthScore.system_mode,
      endpoints: results,
      timestamp: new Date().toISOString(),
    };
  });
}
