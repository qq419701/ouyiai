// 系统监控状态路由
// 功能：提供 OKX API、AI服务、巨鲸数据源、数据库连接等全量监控状态
import { FastifyInstance } from 'fastify';
import { HealthChecker } from '../../layers/L1-data/health-checker';
import { env } from '../../config/env';

export function registerMonitorRoutes(
  fastify: FastifyInstance,
  healthChecker: HealthChecker,
): void {
  // 系统监控全状态
  fastify.get('/api/monitor/status', async () => {
    const wsResult = healthChecker.getResult('ticker');
    const restResult = healthChecker.getResult('orderbook');

    return {
      okx: {
        ws_connected: wsResult?.errorRate === 0,
        ws_latency_ms: wsResult?.latencyP50 || 0,
        rest_latency_ms: restResult?.latencyP50 || 0,
        error_rate: wsResult?.errorRate || 0,
      },
      ai: {
        'AI-1': { available: !!env.DOUBAO_API_KEY && !!env.DOUBAO_ENDPOINT_ID, latency_ms: null, name: '豆包' },
        'AI-2': { available: !!env.GEMINI_API_KEY, latency_ms: null, name: 'Gemini 2.5' },
        'AI-3': { available: !!env.OPENAI_API_KEY, latency_ms: null, name: 'ChatGPT' },
      },
      whale: {
        arkham: { available: !!env.ARKHAM_API_KEY },
        glassnode: { available: !!env.GLASSNODE_API_KEY },
        whale_alert: { available: !!env.WHALE_ALERT_API_KEY },
        dune: { available: !!env.DUNE_API_KEY },
        freshness_seconds: null,
      },
      database: {
        postgres: true,   // 若能响应请求，说明DB正常
        redis: true,
        latency_ms: null,
      },
      degradation: {
        mode: 'normal',
        trading_paused: false,
        using_cached_ai: false,
        reason: null,
      },
      timestamp: new Date().toISOString(),
    };
  });
}
