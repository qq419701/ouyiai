// 通知测试路由
// 功能：测试钉钉/Telegram 通知发送是否正常
import { FastifyInstance } from 'fastify';
import { Alerter } from '../../monitoring/alerter';
import { authMiddleware } from '../middleware/auth';

export function registerNotifyRoutes(fastify: FastifyInstance, alerter: Alerter): void {
  // 测试通知发送
  fastify.post<{ Body: { channel: string } }>(
    '/api/notify/test',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { channel } = request.body;
      const message = `🔔 [测试] OKX AI 分析系统通知测试 - ${new Date().toLocaleString('zh-CN')}`;

      if (channel === 'dingtalk' || channel === 'telegram' || channel === 'all') {
        await alerter.sendAlert(message, 'info');
        return { success: true, channel, message: '测试消息已发送' };
      }

      return reply.code(400).send({ error: '不支持的通知渠道，支持: dingtalk, telegram, all' });
    },
  );
}
