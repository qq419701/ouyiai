import dotenv from 'dotenv';
dotenv.config();

function require_env(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return val;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '6000', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://ouyiai:password@localhost:5432/ouyiai',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'change_me_in_production_min_32_chars_secret',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'change_me_32_byte_key_placeholder',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  WEBHOOK_URL: process.env.WEBHOOK_URL || '',
  ARKHAM_API_KEY: process.env.ARKHAM_API_KEY || '',
  GLASSNODE_API_KEY: process.env.GLASSNODE_API_KEY || '',
  WHALE_ALERT_API_KEY: process.env.WHALE_ALERT_API_KEY || '',
  DUNE_API_KEY: process.env.DUNE_API_KEY || '',
  WHALE_SCORE_P0_THRESHOLD: parseInt(process.env.WHALE_SCORE_P0_THRESHOLD || '85', 10),
  WHALE_SCORE_P1_THRESHOLD: parseInt(process.env.WHALE_SCORE_P1_THRESHOLD || '60', 10),
  VOLATILITY_RATIO_UPGRADE: parseFloat(process.env.VOLATILITY_RATIO_UPGRADE || '1.5'),
  HEALTH_SCORE_PAUSE: parseInt(process.env.HEALTH_SCORE_PAUSE || '50', 10),
  HEALTH_SCORE_WARN: parseInt(process.env.HEALTH_SCORE_WARN || '80', 10),
};
