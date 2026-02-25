# 完整200字段说明文档

## 1. Market_Raw — 市场原始数据

### Trade（逐笔成交）
| 字段 | 类型 | 说明 |
|------|------|------|
| trade_id | string | 成交ID |
| price | number | 成交价格 |
| size | number | 成交数量 |
| side | 'buy'\|'sell' | 买卖方向 |
| timestamp_ms | number | 成交时间毫秒 |

### OrderBook（盘口）
| 字段 | 类型 | 说明 |
|------|------|------|
| bid_price_1 | number | 买一价 |
| bid_size_1 | number | 买一量 |
| ask_price_1 | number | 卖一价 |
| ask_size_1 | number | 卖一量 |
| bid_depth_top5 | number | 前5档买盘总量 |
| ask_depth_top5 | number | 前5档卖盘总量 |
| bid_depth_top20 | number | 前20档买盘总量 |
| ask_depth_top20 | number | 前20档卖盘总量 |

### Ticker（行情）
| 字段 | 类型 | 说明 |
|------|------|------|
| last_price | number | 最新价 |
| best_bid | number | 最优买价 |
| best_ask | number | 最优卖价 |
| spread | number | 买卖价差 |
| spread_percent | number | 价差百分比 |

## 2. Derived_Micro — 微观衍生指标

### Flow（资金流）
| 字段 | 类型 | 说明 |
|------|------|------|
| net_flow_1s | number | 1秒净资金流 |
| net_flow_3s | number | 3秒净资金流 |
| net_flow_5s | number | 5秒净资金流 |
| net_flow_10s | number | 10秒净资金流 |
| taker_buy_ratio_5s | number | 5秒主动买比例 |
| cumulative_delta | number | 累计delta |
| flow_velocity | number | 资金流速度 |
| flow_acceleration | number | 资金流加速度 |

### Liquidity（流动性）
| 字段 | 类型 | 说明 |
|------|------|------|
| orderbook_imbalance | number | 盘口不平衡比 (-1 to 1) |
| top3_bid_drop_percent | number | 前3档买盘减少比例 |
| top3_ask_drop_percent | number | 前3档卖盘减少比例 |
| liquidity_pull_signal | boolean | 流动性抽走信号 |
| orderbook_thinness_score | number | 盘口稀薄度 |

## 3. Execution — 执行评估

### Slippage（滑点模型）
| 字段 | 类型 | 说明 |
|------|------|------|
| slippage_small | number | 小额滑点 |
| slippage_medium | number | 中额滑点 |
| slippage_large | number | 大额滑点 |
| slippage_change_rate | number | 滑点变化率 |
| impact_cost | number | 冲击成本 |

## 4. Kline — 多周期K线

| 字段 | 类型 | 说明 |
|------|------|------|
| open_1m | number | 1分钟开盘 |
| high_1m | number | 1分钟最高 |
| low_1m | number | 1分钟最低 |
| close_1m | number | 1分钟收盘 |
| volume_1m | number | 1分钟成交量 |
| open_5m | number | 5分钟开盘 |
| high_5m | number | 5分钟最高 |
| low_5m | number | 5分钟最低 |
| close_5m | number | 5分钟收盘 |
| volume_5m | number | 5分钟成交量 |
| close_15m | number | 15分钟收盘 |
| close_1h | number | 1小时收盘 |

## 5. Structure — 结构判断

| 字段 | 类型 | 说明 |
|------|------|------|
| break_structure_5m | boolean | 5分钟结构突破 |
| break_structure_15m | boolean | 15分钟结构突破 |
| higher_high_flag | boolean | 是否创新高 |
| higher_low_flag | boolean | 是否抬高低点 |
| trend_direction | 'up'\|'down'\|'sideways' | 趋势方向 |

## 6. Volatility — 波动率

| 字段 | 类型 | 说明 |
|------|------|------|
| ATR_5m | number | 5分钟ATR |
| ATR_15m | number | 15分钟ATR |
| ATR_1h | number | 1小时ATR |
| range_percent_1h | number | 1小时振幅 |
| volatility_regime | 'low'\|'normal'\|'high'\|'extreme' | 波动状态 |
| regime_shift_flag | boolean | 状态切换信号 |

## 7. Volume — 量能

| 字段 | 类型 | 说明 |
|------|------|------|
| volume_ratio_5m | number | 5分钟量能倍数 |
| volume_ratio_15m | number | 15分钟量能倍数 |
| volume_acceleration | number | 量能加速度 |

## 8. MA — 均线体系

| 字段 | 类型 | 说明 |
|------|------|------|
| SMA_20 | number | 20周期SMA |
| SMA_60 | number | 60周期SMA |
| SMA_200 | number | 200周期SMA |
| EMA_8 | number | EMA8 |
| EMA_21 | number | EMA21 |
| EMA_55 | number | EMA55 |
| EMA_144 | number | EMA144 |
| EMA_200 | number | EMA200 |
| EMA_slope | number | EMA斜率 |
| MA_alignment_score | number | 均线排列评分 (-100 to +100) |

## 9. Momentum — 动量指标

| 字段 | 类型 | 说明 |
|------|------|------|
| MACD_line | number | MACD线 |
| MACD_signal | number | 信号线 |
| MACD_histogram | number | 柱状图 |
| RSI_14 | number | RSI14 |
| ADX_value | number | ADX趋势强度 |
| BB_width | number | 布林带宽度 |

## 10. Profile — 成交分布

| 字段 | 类型 | 说明 |
|------|------|------|
| POC | number | 最大成交价 |
| value_area_high | number | 成交密集区上沿 |
| value_area_low | number | 成交密集区下沿 |

## 11. Intermarket — 跨市场联动

| 字段 | 类型 | 说明 |
|------|------|------|
| BTC_close_5m | number | BTC 5分钟收盘 |
| BTC_trend_score | number | BTC趋势评分 |
| sol_btc_correlation | number | SOL/BTC相关性 |

## 12. Risk — 风险检测

| 字段 | 类型 | 说明 |
|------|------|------|
| flash_move_flag | boolean | 闪崩/暴拉信号 |
| abnormal_spread_flag | boolean | 异常价差信号 |

## 13. Account — 账户管理

| 字段 | 类型 | 说明 |
|------|------|------|
| total_balance | number | 总资产 |
| available_balance | number | 可用余额 |
| total_USDT | number | 总USDT |
| unrealized_pnl | number | 未实现盈亏 |
| today_delta | number | 今日增加量 |

## 14. Strategy — 策略状态

| 字段 | 类型 | 说明 |
|------|------|------|
| system_mode | 'active'\|'degraded'\|'paused'\|'emergency' | 系统状态 |
| trend_lock_flag | boolean | 趋势锁定 |
| cooldown_timer | number | 冷却剩余秒数 |
| last_action | string | 上次动作 |
| action_confidence | number | 动作置信度 |

## 15. System — 系统健康

| 字段 | 类型 | 说明 |
|------|------|------|
| ws_latency | number | WebSocket延迟(ms) |
| api_latency | number | API延迟(ms) |
| order_submit_latency | number | 下单延迟(ms) |
| error_rate | number | 错误率(%) |
