// 仪表盘汇总数据路由
// 功能：聚合系统状态、行情、AI信号、告警等数据供前端首页使用
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { HealthChecker } from '../../layers/L1-data/health-checker';
import { calculateHealthScore } from '../../monitoring/health-scorer';

export function registerDashboardRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient,
  healthChecker: HealthChecker,
): void {
  // 仪表盘汇总数据
  fastify.get('/api/dashboard', async () => {
    // 健康状态
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

    // 今日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analysisToday = 0;
    let ordersToday = 0;
    let costToday = 0;

    try {
      analysisToday = await prisma.analysisResult.count({
        where: { analysedAt: { gte: today } },
      });

      ordersToday = await prisma.order.count({
        where: { createdAt: { gte: today } },
      });
    } catch {
      // 数据库未连接时使用默认值
    }

    // 最新分析信号（每币种最新一条）
    const signals: Record<string, unknown> = {};
    const coins = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'];
    for (const coin of coins) {
      try {
        const latest = await prisma.analysisResult.findFirst({
          where: { coin },
          orderBy: { analysedAt: 'desc' },
        });
        if (latest) {
          signals[coin] = {
            action: latest.finalAction,
            confidence: latest.finalConfidence,
            consensus_type: (latest.arbitrationResult as Record<string, unknown>)?.consensus_type || null,
          };
        }
      } catch {}
    }

    return {
      health: {
        score: healthScore.overall,
        mode: healthScore.system_mode,
      },
      stats: {
        analysisToday,
        ordersToday,
        costToday,
        orderSuccessRate: 1,
      },
      prices: {},        // 由前端直接从行情API获取或留空
      signals,
      alerts: [],        // 实际告警由告警模块管理
      whale: {},
      timestamp: new Date().toISOString(),
    };
  });
}
