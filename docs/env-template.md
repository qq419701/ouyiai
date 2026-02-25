# 环境变量说明

## OKX API Keys（每个账号一组）

```bash
OKX_API_KEY_1=       # OKX API Key
OKX_API_SECRET_1=    # OKX API Secret
OKX_PASSPHRASE_1=    # OKX Passphrase
```

**注意：** 多账号请增加 _2, _3 后缀

## AI API Keys

```bash
DEEPSEEK_API_KEY=    # DeepSeek API Key（AI-1）
OPENAI_API_KEY=      # OpenAI API Key（AI-2）
ANTHROPIC_API_KEY=   # Anthropic API Key（AI-3）
```

## 数据库配置

```bash
DATABASE_URL=postgresql://user:pass@host:5432/ouyiai
REDIS_URL=redis://localhost:6379
```

## 安全配置

```bash
JWT_SECRET=          # JWT签名密钥，最少32字符
ENCRYPTION_KEY=      # AES-256密钥，32字节十六进制
```

## 通知配置（可选）

```bash
TELEGRAM_BOT_TOKEN=  # Telegram Bot Token
TELEGRAM_CHAT_ID=    # Telegram Chat ID
WEBHOOK_URL=         # Webhook通知URL
```

## 巨鲸数据源（可选，按需配置）

```bash
ARKHAM_API_KEY=      # Arkham Intelligence API Key
GLASSNODE_API_KEY=   # Glassnode API Key
WHALE_ALERT_API_KEY= # Whale Alert API Key
DUNE_API_KEY=        # Dune Analytics API Key
```

## 阈值配置（有默认值）

```bash
WHALE_SCORE_P0_THRESHOLD=85    # P0触发巨鲸评分阈值
WHALE_SCORE_P1_THRESHOLD=60    # P1触发巨鲸评分阈值
VOLATILITY_RATIO_UPGRADE=1.5   # 升级premium模型的波动率倍数
HEALTH_SCORE_PAUSE=50          # 系统暂停的健康评分阈值
HEALTH_SCORE_WARN=80           # 系统降级警告的健康评分阈值
```

## 应用配置

```bash
PORT=6000            # 服务端口（默认6000）
NODE_ENV=production  # 运行环境
LOG_LEVEL=info       # 日志级别: debug/info/warn/error
```
