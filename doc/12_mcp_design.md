# 12｜MCP 设计：多 MCP Server + 权限边界 + 可审计工具定义

> 这里的 MCP 指 Model Context Protocol：为模型/Agent 提供工具与资源的协议与工具服务器。

## 为什么要拆多个 MCP Server
跨境交易里，**权限边界就是风控边界**：
- checkout/payment 属于高敏写操作：必须最小权限 + 强审计 + 必须用户确认
- compliance/tax 属于门禁：必须可回放规则版本
- knowledge/evidence 属于证据：必须可引用、可回放

## 推荐 MCP Server 拆分
- `catalog-mcp`：供给与 AROC
- `pricing-mcp`：实时报价/活动
- `logistics-mcp`：地址/线路/追踪
- `compliance-mcp`：合规门禁 + 税费估算（或拆为 tax-mcp）
- `checkout-mcp`：购物车/草稿订单/支付意图（最高敏感）
- `knowledge-mcp`：RAG 检索 + chunk 获取
- `evidence-mcp`：snapshot/attach（也可合并到 knowledge-mcp）
- `support-mcp`：售后/仲裁

## Tool Gateway（建议存在于 MCP 前）
Gateway 统一做：
- Envelope 校验（`doc/04_tooling_spec.md`）
- 鉴权/Scope
- 幂等（idempotency_key）
- 限流
- 统一错误码映射
- 审计（工具输入输出 hash + trace）

## 工具定义模板（Contract First）
每个工具必须在 contracts 中定义：
- 输入 Schema（含 Envelope 与业务字段）
- 输出 Schema（含 ttl_seconds/evidence）
- 错误码集合
- policy（scopes_required / requires_user / rate_limit / audit）

示例（概念模板）：
```json
{
  "name": "checkout.create_draft_order",
  "inputSchema": { "type": "object", "required": ["request_id", "user_id", "cart_id"] },
  "outputSchema": { "type": "object", "required": ["draft_order_id", "expires_at"] },
  "policy": {
    "scopes_required": ["checkout:write"],
    "requires_user": true,
    "rate_limit": { "per_user_per_min": 10 },
    "audit": { "log_request": true, "log_response_hash": true }
  }
}
```

## 支付工具的硬约束（必须）
- `payment.create_payment_intent` 必须返回：
  - `requires_user_action: true`
  - `payment_url` 或 `checkout_session_token`
- 后端工具层不得提供可被 Agent 直接调用的 `payment.capture/confirm`（或永远返回 `NEEDS_USER_CONFIRMATION`）

## 资源（Resources）与引用（可选）
MCP 可以提供只读资源，供 UI/调试使用，例如：
- `resource://aroc/{offer_id}`
- `resource://evidence/{snapshot_id}`
- `resource://chunk/{chunk_id}`
资源访问同样需要权限与审计日志。


