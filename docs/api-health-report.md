# API健康检测报告模板

## 检测时间：{DATE}

## OKX 公开接口

| 接口 | 可用性 | P50延迟 | P95延迟 | P99延迟 | 错误率 |
|------|--------|---------|---------|---------|--------|
| /market/ticker | {STATUS} | {P50}ms | {P95}ms | {P99}ms | {RATE}% |
| /market/books | {STATUS} | {P50}ms | {P95}ms | {P99}ms | {RATE}% |
| /market/trades | {STATUS} | {P50}ms | {P95}ms | {P99}ms | {RATE}% |
| /market/candles | {STATUS} | {P50}ms | {P95}ms | {P99}ms | {RATE}% |
| /system/status | {STATUS} | {P50}ms | {P95}ms | {P99}ms | {RATE}% |

## OKX 私有接口

| 接口 | 可用性 | P50延迟 | P95延迟 | 错误率 |
|------|--------|---------|---------|--------|
| /account/balance | {STATUS} | {P50}ms | {P95}ms | {RATE}% |
| /trade/order | {STATUS} | {P50}ms | {P95}ms | {RATE}% |
| /trade/cancel-order | {STATUS} | {P50}ms | {P95}ms | {RATE}% |

## WebSocket

| 通道 | 连接状态 | 延迟 | 丢包率 | 重连次数 |
|------|---------|------|--------|---------|
| tickers | {STATUS} | {LAT}ms | {LOSS}% | {COUNT} |
| books | {STATUS} | {LAT}ms | {LOSS}% | {COUNT} |
| trades | {STATUS} | {LAT}ms | {LOSS}% | {COUNT} |

## 异常记录

| 时间 | 接口 | 错误码 | 描述 |
|------|------|--------|------|
| - | - | - | - |

## 幂等验证

- 重复下单测试：{RESULT}
- 相同clOrdId 3次：{RESULT}

## 降级阈值触发

- 错误率 > 1%：{TRIGGERED}
- 延迟 > 800ms：{TRIGGERED}
- WS丢包 > 0.5%：{TRIGGERED}
