// 配置管理路由
// 功能：展示系统配置（环境变量只读，密钥隐藏）、风控规则
import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { COINS } from '../../config/coins';
import { env } from '../../config/env';
import riskRules from '../../config/risk-rules.json';

function maskSecret(val: string): string {
  if (!val) return '（未配置）';
  if (val.length <= 8) return '***';
  return val.slice(0, 4) + '****' + val.slice(-4);
}

export function registerConfigRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/config/coins', { preHandler: authMiddleware }, async () => {
    return COINS;
  });

  fastify.get('/api/config/risk-rules', { preHandler: authMiddleware }, async () => {
    return riskRules;
  });

  // 前端配置管理页用：返回脱敏后的环境变量 + 风控规则
  fastify.get('/api/config', { preHandler: authMiddleware }, async () => {
    return {
      env: {
        NODE_ENV: env.NODE_ENV,
        PORT: String(env.PORT),
        LOG_LEVEL: env.LOG_LEVEL,
        DOUBAO_API_KEY: maskSecret(env.DOUBAO_API_KEY),
        GEMINI_API_KEY: maskSecret(env.GEMINI_API_KEY),
        OPENAI_API_KEY: maskSecret(env.OPENAI_API_KEY),
        DINGTALK_WEBHOOK: env.DINGTALK_WEBHOOK_URL ? '已配置 ✓' : '未配置',
        TELEGRAM: env.TELEGRAM_BOT_TOKEN ? '已配置 ✓' : '未配置',
        DATABASE_URL: maskSecret(env.DATABASE_URL),
        REDIS_URL: env.REDIS_URL,
        JWT_SECRET: maskSecret(env.JWT_SECRET),
      },
      risk: {
        whale_p0: env.WHALE_SCORE_P0_THRESHOLD,
        whale_p1: env.WHALE_SCORE_P1_THRESHOLD,
        volatility_ratio: env.VOLATILITY_RATIO_UPGRADE,
        health_pause: env.HEALTH_SCORE_PAUSE,
        health_warn: env.HEALTH_SCORE_WARN,
      },
    };
  });
}
