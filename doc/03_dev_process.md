# 03｜开发流程（从 0 到可用：按“工具+审计”驱动）

## 总原则
- **先定工具统一规范（Envelope/错误码/审计）再写业务**：否则后期联调失控、证据不可回放。
- **Contract First + Mock First**：每个工具先出 schema 与 mock，再接真实服务。
- **写操作必须幂等**：Agent 重试与超时不可避免。
- **先闭环 Draft Order**：先能“生成草稿订单 + 证据快照”，再做更复杂的优化/议价/售后。

## 里程碑建议（8–12 周）
### M0（第 1 周）：协议与骨架
- 定义 `Tool Envelope`、错误码、trace、evidence 格式（见 `doc/04_tooling_spec.md`）
- 定义 Mission/DraftOrder/Evidence/AROC 的 JSON Schema（contracts）
- 建立 tool-gateway（鉴权/幂等/限流/审计）骨架与 mock MCP servers

### M1（第 2–3 周）：MVP 工具闭环
- catalog：search + offer_card（最小字段）
- pricing：realtime_quote
- shipping：quote_options + validate_address
- tax：estimate（先 rule-based 简化）
- compliance：check_item（先规则白名单/黑名单）
- checkout：cart + compute_total + create_draft_order
- evidence：create_snapshot + attach_to_draft_order
验收：给定 Mission，产出 Draft Order Summary，且每条强事实都有 evidence。

### M2（第 4–6 周）：GraphRAG + AROC 扩充
- AROC v0.1 完整化（变体/政策摘要/风险标签/证据指针）
- Evidence Store：说明书/条款/QA 的 chunking 与可引用
- knowledge.search：Graph Filter + Hybrid Retrieve + Re-rank
验收：解释性答案能引用 chunk；强事实仍以工具为准。

### M3（第 7–9 周）：多 Agent + 深度核验 + 组合优化（可选）
- Verification/Critic Agent 强化：PRICE_CHANGED/OUT_OF_STOCK 等异常处理
- promotion.optimize：凑单/满减策略
- 风险画像：评价聚类 → risk_profile 输入排序

### M4（第 10–12 周）：售后/仲裁与保证（平台壁垒）
- order.open_dispute + Evidence 回放控制台
- 合规/到手价保证（SLA）产品化（可选）

## 开发工作流（日常）
- 分支：trunk-based 或 GitFlow 均可；强建议 **每个工具一个 PR**
- 必跑检查：
  - contract-check：schema 变更必须通过兼容性检查
  - unit test：工具 handler 的输入校验与错误码映射
  - integration test：mock → 真实服务替换的回归

## 联调策略（避免“工具实现与文档漂移”）
- 工具返回必须包含 `ttl_seconds` 与 `evidence.snapshot_id`
- 写操作必须验证 `idempotency_key`
- 所有工具必须在 Gateway 做统一错误码映射（上游错误不得直接透传）

## 验收清单（MVP 必须）
- 任意 Draft Order 都能“回放”出：
  - 当时 price quote（含过期时间）
  - 当时 shipping quote（线路 + SLA + 限制）
  - 当时 tax estimate（方法 + 置信度）
  - 当时 compliance 规则版本
  - 引用到的条款/说明书 chunk（如果有）


