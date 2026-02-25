// 环境变量配置模块
// 功能：统一管理所有环境变量，提供类型安全的配置访问
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
  NODE_ENV: process.env.NODE_ENV || 'development',                    // 运行环境: development | production
  PORT: parseInt(process.env.PORT || '6000', 10),                     // 服务端口
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',                         // 日志级别: debug | info | warn | error
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://ouyiai:password@localhost:5432/ouyiai',  // PostgreSQL连接地址
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',       // Redis连接地址
  JWT_SECRET: process.env.JWT_SECRET || 'change_me_in_production_min_32_chars_secret',  // JWT签名密钥
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'change_me_32_byte_key_placeholder',    // AES-256加密密钥
  // AI-1: 豆包（字节跳动火山引擎）
  DOUBAO_API_KEY: process.env.DOUBAO_API_KEY || '',                   // 火山引擎API密钥
  DOUBAO_ENDPOINT_ID: process.env.DOUBAO_ENDPOINT_ID || '',           // 豆包模型推理接入点ID
  // AI-2: Google Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',                   // Google AI Studio API密钥
  // AI-3: ChatGPT（OpenAI）
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',                   // OpenAI API密钥
  // 通知配置
  DINGTALK_WEBHOOK_URL: process.env.DINGTALK_WEBHOOK_URL || '',       // 钉钉机器人Webhook地址
  DINGTALK_SECRET: process.env.DINGTALK_SECRET || '',                 // 钉钉机器人加签密钥
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',          // Telegram机器人Token
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',              // Telegram聊天ID
  WEBHOOK_URL: process.env.WEBHOOK_URL || '',                         // 自定义Webhook地址
  // 巨鲸数据源
  ARKHAM_API_KEY: process.env.ARKHAM_API_KEY || '',                   // Arkham Intelligence密钥
  GLASSNODE_API_KEY: process.env.GLASSNODE_API_KEY || '',             // Glassnode密钥
  WHALE_ALERT_API_KEY: process.env.WHALE_ALERT_API_KEY || '',         // Whale Alert密钥
  DUNE_API_KEY: process.env.DUNE_API_KEY || '',                       // Dune Analytics密钥
  // 风控阈值
  WHALE_SCORE_P0_THRESHOLD: parseInt(process.env.WHALE_SCORE_P0_THRESHOLD || '85', 10),  // P0紧急触发巨鲸评分阈值
  WHALE_SCORE_P1_THRESHOLD: parseInt(process.env.WHALE_SCORE_P1_THRESHOLD || '60', 10),  // P1升级触发巨鲸评分阈值
  VOLATILITY_RATIO_UPGRADE: parseFloat(process.env.VOLATILITY_RATIO_UPGRADE || '1.5'),   // AI升级触发波动率倍数
  HEALTH_SCORE_PAUSE: parseInt(process.env.HEALTH_SCORE_PAUSE || '50', 10),               // 系统暂停阈值（低于此值暂停交易）
  HEALTH_SCORE_WARN: parseInt(process.env.HEALTH_SCORE_WARN || '80', 10),                 // 系统警告阈值（低于此值发送告警）
};
