# QA测试清单

## 1. 系统启动测试
- [ ] npm run build 无错误
- [ ] npm start 在端口6000正常启动
- [ ] GET / 返回系统信息
- [ ] Prisma 数据库连接正常
- [ ] Redis 连接正常
- [ ] OKX WebSocket 连接正常

## 2. API测试
- [ ] POST /api/auth/login 返回JWT
- [ ] 所有受保护路由未带JWT返回401
- [ ] GET /api/accounts 返回账户列表
- [ ] POST /api/accounts 成功创建账户
- [ ] GET /api/health 返回健康评分

## 3. 数据层测试
- [ ] OKX REST API ticker获取正常
- [ ] OKX WebSocket 订阅成功
- [ ] WebSocket断线5s内重连
- [ ] REST备用降级正常工作

## 4. AI分析测试
- [ ] 豆包 API调用成功
- [ ] Gemini API调用成功
- [ ] ChatGPT API调用成功
- [ ] 三AI超时后不阻塞
- [ ] cheap/premium模型正确切换

## 5. 仲裁测试
- [ ] 3票一致正确计算置信度 (*1.1)
- [ ] 2票多数正确计算置信度 (*0.9)
- [ ] 三方分歧返回hold
- [ ] whale_score>85触发P0

## 6. 风控测试
- [ ] P0触发条件全部验证
- [ ] P1触发条件全部验证
- [ ] P2为默认风控级别
- [ ] 各级别仓位限制正确

## 7. 执行测试
- [ ] 订单状态机转换正确
- [ ] 分批下单间隔正确
- [ ] 重试逻辑有效
- [ ] 非重试错误直接失败

## 8. 审计测试
- [ ] 所有操作写入审计日志
- [ ] 哈希链验证通过
- [ ] 审计查询过滤正确
- [ ] 完整性验证API正常

## 9. 性能测试
- [ ] API响应p50 < 200ms
- [ ] AI分析 < 30s
- [ ] WebSocket延迟 < 100ms
- [ ] 系统健康评分准确

## 10. 安全测试
- [ ] API Key AES-256加密验证
- [ ] JWT 30分钟过期
- [ ] Rate limit 100 req/min生效
- [ ] 日志中无明文API Key
