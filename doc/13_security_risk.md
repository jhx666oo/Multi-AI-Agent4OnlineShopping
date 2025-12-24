# 13｜安全、风控与合规：让“可执行”不会变成“可事故”

## 13.1 权限与最小化（Least Privilege）
- 按工具域划分 scope：`catalog:read`、`pricing:read`、`checkout:write` 等
- 按 Agent 绑定白名单：
  - Candidate/Verifier：只读工具为主
  - Execution：可调用 cart/checkout（写）
  - Payment：只能创建 payment intent，不可确认扣款
- 所有高敏写操作必须要求 `actor.type=user` 或者具备“已获得用户授权”的凭证（建议短期 token）

## 13.2 支付确认（必须由用户完成）
硬规则：
- 后端不得暴露“确认扣款/确认支付”的可调用工具给 Agent
- 任何支付相关工具必须能抛 `NEEDS_USER_CONFIRMATION`
- 前端必须在 UI 显示 Draft Order Summary + confirmation_items 后才允许跳转收银台

## 13.3 PII 与敏感信息
- 地址、电话、证件号、税号：字段级加密 + 脱敏日志
- Evidence Snapshot：
  - 默认只存 request/response 的 hash + 摘要
  - 如需存原文（仲裁需要）：必须加密、授权访问、审计访问记录

## 13.4 合规门禁（Fail Closed）
- `compliance.check_item` 超时/异常时策略建议：**默认拒绝** 或 “需要人工复核/稍后重试”
- 合规规则必须版本化，并写入 Evidence

## 13.5 防 Prompt Injection（商家/内容侧）
- Shop Capability 必须是结构化合约输出，禁止商家自由文本影响排序/合规
- RAG chunk 必须带来源等级；低等级来源不得推翻平台规则/商家协议
- Agent 输出必须经 Verifier 检查证据绑定

## 13.6 风控（欺诈/拒付/异常地址）
建议引入：
- `risk.assess_order`：对 Draft Order/Order 做欺诈评分与动作建议
- 高风险动作：
  - 降低自动化权限（只允许推荐，不允许自动生成 Draft Order）
  - 强制更多确认项（KYC/地址验证）

## 13.7 审计与合规要求（组织层面）
- 所有工具调用写入 `obs.log_event` 与 OTel trace
- Evidence 访问同样要审计（谁在什么时间看了哪个 snapshot）
- 建议建立“工具 RFC”流程：新增工具/错误码/字段变更必须评审


