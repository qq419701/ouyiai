// 系统告警模块
// 功能：集成钉钉、Telegram、Webhook 多渠道通知
// 支持：买卖信号通知、系统状态变更通知、P0紧急告警
import axios from 'axios';
import crypto from 'crypto';
import { env } from '../config/env';
import { SystemMode } from '../utils/types';
import { logger } from '../utils/logger';

export class Alerter {
  /**
   * 发送系统告警（通用）
   * @param message 告警消息
   * @param level 告警级别
   */
  async sendAlert(message: string, level: 'info' | 'warn' | 'critical' = 'info'): Promise<void> {
    const prefix = level === 'critical' ? '🚨' : level === 'warn' ? '⚠️' : 'ℹ️';
    const text = `${prefix} [OuyiAI] ${message}`;

    await Promise.allSettled([
      this.sendDingTalk(text),
      this.sendTelegram(text),
      this.sendWebhook({ message, level, timestamp: new Date().toISOString() }),
    ]);
  }

  /**
   * 发送买卖信号通知（钉钉格式化消息）
   * @param signal 交易信号详情
   */
  async sendTradeSignal(signal: {
    action: 'buy' | 'sell' | 'hold';
    coin: string;
    confidence: number;
    ai1: { action: string; confidence: number };
    ai2: { action: string; confidence: number };
    ai3: { action: string; confidence: number };
    consensusType: string;
    recommendedSizePct: number;
    entryPriceRange: [number, number];
    stopLoss: number;
    takeProfit: number[];
    whaleScore: number;
    riskLevel: string;
  }): Promise<void> {
    const actionEmoji = signal.action === 'buy' ? '🟢' : signal.action === 'sell' ? '🔴' : '🟡';
    const actionText = signal.action === 'buy' ? '买入' : signal.action === 'sell' ? '卖出' : '持有';
    const consensusText = signal.consensusType === '3_unanimous' ? '3票一致' :
      signal.consensusType === '2_majority' ? '2票多数' : '意见分歧';
    const riskText = signal.riskLevel === 'P0' ? 'P0 紧急' :
      signal.riskLevel === 'P1' ? 'P1 高风险' : 'P2 常规';
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    const text = `${actionEmoji} ${actionText}信号 | ${signal.coin}
━━━━━━━━━━━━━━━━━━
📊 三AI仲裁结果: ${actionText}
🤖 豆包: ${signal.ai1.action === 'buy' ? '买入' : signal.ai1.action === 'sell' ? '卖出' : '持有'} (置信度 ${Math.round(signal.ai1.confidence * 100)}%)
🤖 Gemini: ${signal.ai2.action === 'buy' ? '买入' : signal.ai2.action === 'sell' ? '卖出' : '持有'} (置信度 ${Math.round(signal.ai2.confidence * 100)}%)
🤖 ChatGPT: ${signal.ai3.action === 'buy' ? '买入' : signal.ai3.action === 'sell' ? '卖出' : '持有'} (置信度 ${Math.round(signal.ai3.confidence * 100)}%)
📈 共识类型: ${consensusText}
💰 建议仓位: ${signal.recommendedSizePct}%
🎯 入场价格: ${signal.entryPriceRange[0].toLocaleString()} - ${signal.entryPriceRange[1].toLocaleString()}
🛑 止损价格: ${signal.stopLoss.toLocaleString()}
🎯 止盈目标: ${signal.takeProfit.map(p => p.toLocaleString()).join(' / ')}
🐋 巨鲸评分: ${signal.whaleScore} (${signal.whaleScore > 70 ? '偏多' : signal.whaleScore > 50 ? '中性' : '偏空'})
⚠️ 风控等级: ${riskText}
⏰ 时间: ${now}`;

    await Promise.allSettled([
      this.sendDingTalk(text),
      this.sendTelegram(text),
    ]);
  }

  /**
   * 发送钉钉机器人通知（支持加签验证）
   * @param text 消息文本
   */
  private async sendDingTalk(text: string): Promise<void> {
    if (!env.DINGTALK_WEBHOOK_URL) return;
    try {
      let url = env.DINGTALK_WEBHOOK_URL;

      // 加签验证（如果配置了 DINGTALK_SECRET）
      if (env.DINGTALK_SECRET) {
        const timestamp = Date.now();
        const stringToSign = `${timestamp}\n${env.DINGTALK_SECRET}`;
        const sign = crypto
          .createHmac('sha256', env.DINGTALK_SECRET)
          .update(stringToSign)
          .digest('base64');
        url += `&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
      }

      await axios.post(
        url,
        {
          msgtype: 'text',
          text: { content: text },
        },
        { timeout: 5000 },
      );
    } catch (err) {
      logger.warn({ err }, '钉钉通知发送失败');
    }
  }

  private async sendTelegram(text: string): Promise<void> {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
    try {
      await axios.post(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        { chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' },
        { timeout: 5000 },
      );
    } catch (err) {
      logger.warn({ err }, 'Failed to send Telegram alert');
    }
  }

  private async sendWebhook(data: unknown): Promise<void> {
    if (!env.WEBHOOK_URL) return;
    try {
      await axios.post(env.WEBHOOK_URL, data, { timeout: 5000 });
    } catch (err) {
      logger.warn({ err }, 'Failed to send webhook alert');
    }
  }

  async notifyModeChange(prev: SystemMode, current: SystemMode): Promise<void> {
    const level = current === 'emergency' ? 'critical' : current === 'degraded' ? 'warn' : 'info';
    await this.sendAlert(`系统模式变更: ${prev} → ${current}`, level);
  }
}
