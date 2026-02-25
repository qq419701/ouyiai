# 巨鲸数据源评估表

## 数据源对比

| 数据源 | 优先级 | 更新延迟 | 币种支持 | 定价 | 可靠性 |
|--------|--------|---------|---------|------|--------|
| Arkham Intelligence | 1 | <30s | BTC/ETH/SOL | 付费 | ⭐⭐⭐⭐⭐ |
| Glassnode | 2 | <60s | BTC/ETH | 付费 | ⭐⭐⭐⭐ |
| Whale Alert | 3 | <60s | BTC/ETH | 免费(限额) | ⭐⭐⭐ |
| Dune Analytics | 4 | <5min | ETH/SOL | 付费 | ⭐⭐⭐ |
| 中性降级 | 5 | - | 全部 | 免费 | N/A |

## Whale Score 计算

```
whale_score = (
  normalize(|netflow_1h|) * 0.35 +
  normalize(transfer_density_1h) * 0.25 +
  normalize(|holder_change_24h|) * 0.25 +
  normalize(dex_anomaly_1h) * 0.15
) * time_decay_factor
```

## 时间衰减因子

| 数据年龄 | 衰减因子 |
|---------|---------|
| <5分钟 | 1.0 |
| 5-15分钟 | 0.85 |
| 15-30分钟 | 0.6 |
| >30分钟 | 0.3 (stale) |

## 降级策略

当高优先级数据源失败时，系统自动降级到下一个：
1. 尝试 Arkham Intelligence
2. 失败 → 尝试 Glassnode
3. 失败 → 尝试 Whale Alert
4. 失败 → 尝试 Dune Analytics
5. 全部失败 → whale_score=50 (中性)

## Whale Bias 判断

- netflow_1h < 0（净流出交易所）→ bullish
- netflow_1h > 0（净流入交易所）→ bearish
- |netflow_1h| < threshold → neutral
