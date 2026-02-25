import axios from 'axios';
import { env } from '../config/env';
import { SystemMode } from '../utils/types';
import { logger } from '../utils/logger';

export class Alerter {
  async sendAlert(message: string, level: 'info' | 'warn' | 'critical' = 'info'): Promise<void> {
    const prefix = level === 'critical' ? '🚨' : level === 'warn' ? '⚠️' : 'ℹ️';
    const text = `${prefix} [OuyiAI] ${message}`;

    await Promise.allSettled([
      this.sendTelegram(text),
      this.sendWebhook({ message, level, timestamp: new Date().toISOString() }),
    ]);
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
    await this.sendAlert(`System mode changed: ${prev} → ${current}`, level);
  }
}
