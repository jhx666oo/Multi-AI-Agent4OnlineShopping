# 04｜工具调用统一规范（Envelope / 错误码 / 幂等 / TTL / Evidence）

> 本文是全平台“工具层”统一标准。**先定这个**，否则后面所有工具都会各自为政，审计也无法回放。

## 4.1 统一请求 Envelope（所有工具必须支持）

```json
{
  "request_id": "uuid",
  "actor": { "type": "user|agent|system", "id": "..." },
  "user_id": "u_123",
  "session_id": "s_123",
  "locale": "en-US",
  "currency": "USD",
  "timezone": "America/Los_Angeles",
  "client": { "app": "web|ios|android", "version": "..." },
  "dry_run": false,
  "idempotency_key": "optional-for-write-ops",
  "trace": { "span_id": "...", "parent_span_id": "..." }
}
```

### 强制要求
- `request_id`：全链路唯一，用于审计与重放。
- `actor`：必须明确是谁触发（用户/agent/system），用于责任界定。
- `dry_run`：写操作必须支持 dry_run（至少支持“校验”）。
- `idempotency_key`：所有写操作必须支持，且以“用户维度”隔离（防重复下单/重复加购）。
- `trace`：工具实现必须把 trace 继续向下游传播（OTel）。

## 4.2 统一响应 Envelope（所有工具必须支持）

```json
{
  "ok": true,
  "data": {},
  "warnings": [],
  "error": { "code": "...", "message": "...", "details": {} },
  "ttl_seconds": 60,
  "evidence": {
    "snapshot_id": "ev_...",
    "sources": [{ "type": "tool", "name": "...", "hash": "...", "ts": "..." }]
  }
}
```

### 关键语义
- `ttl_seconds`：工具结果的新鲜度窗口（报价、库存、线路等必须有 TTL）。
- `evidence.snapshot_id`：每个关键工具调用都应能落 Evidence（至少对 Draft Order 关键路径）。
- `sources[].hash`：建议对 `data` 做 canonical JSON → hash，便于回放一致性校验。

## 4.3 必备错误码（跨服务统一）
- `INVALID_ARGUMENT`
- `UNAUTHORIZED` / `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`（版本冲突、库存锁冲突）
- `RATE_LIMITED`
- `TIMEOUT` / `UPSTREAM_ERROR`
- `NEEDS_USER_CONFIRMATION`（支付/敏感操作必须抛这个）
- `COMPLIANCE_BLOCKED`
- `PRICE_CHANGED` / `OUT_OF_STOCK`
- `ADDRESS_INVALID`

### 错误码约束（强制）
- 工具实现不得返回“自定义字符串错误码”。新增错误码必须走 RFC 流程（文档 + contracts）。
- 上游错误必须映射为上述错误码之一，`details` 可携带上游码与诊断信息。

## 4.4 证据（Evidence）与回放（Replay）
### 哪些调用必须落 evidence（MVP 最小集）
- `pricing.get_realtime_quote`
- `shipping.quote_options`
- `tax.estimate_duties_and_taxes`
- `compliance.check_item`
- `checkout.compute_total`
- `checkout.create_draft_order`
- `knowledge.search`（如果输出引用）

### evidence 的最小内容
- 工具名 + 版本（build hash）
- 输入摘要（脱敏）
- 输出 hash（或输出全量，取决于合规/隐私）
- 依赖规则版本（例如 `compliance.policy_ruleset_version`）

## 4.5 幂等（Idempotency）规则（写操作必须遵守）
- 幂等 key 作用域：`(user_id, tool_name, idempotency_key)`
- 重试语义：
  - 若首次成功，重复请求返回同一结果（同一 draft_order_id / cart_id）
  - 若首次处理中，返回 `CONFLICT` 或提供“处理中”状态（实现取舍）
- 幂等记录最少保留：建议 >= Draft Order 有效期 + 缓冲（例如 24h）

## 4.6 PII 脱敏与最小化
- 工具侧不得在日志中记录原始地址/证件号；必须哈希或字段级脱敏。
- Evidence Snapshot 可存原文但必须加密 + 权限控制 + 审计访问日志（见 `doc/13_security_risk.md`）。


