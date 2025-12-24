# 06｜Evidence Snapshot（可审计与可回放的证据机制）

## 为什么 Evidence 是“跨境生死线”
跨境纠纷常见争议点：当时的价格/税费/时效/禁限运提示/退换条款是否清晰告知。没有可回放证据链，平台很难自证“AI 没瞎说”。

## 设计目标
- **可回放**：给定 `snapshot_id` 能重建当时的关键事实与引用来源（或至少校验一致性）。
- **不可抵赖**：对工具输出做 hash，记录工具版本/规则版本/时间戳。
- **可权限控制**：PII/证件信息/地址等敏感字段加密与访问审计。
- **可绑定交易对象**：snapshot 必须可挂载到 Draft Order / Order / Dispute。

## Evidence Snapshot 最小 Schema（建议 v0.1）
```json
{
  "snapshot_id": "ev_...",
  "created_at": "2025-12-24T00:00:00Z",
  "user_id": "u_123",
  "session_id": "s_123",
  "mission_id": "ms_...",
  "objects": {
    "offer_ids": ["of_1", "of_2"],
    "sku_ids": ["sku_1"]
  },
  "tool_calls": [
    {
      "tool": "pricing.get_realtime_quote",
      "tool_version": "build:abc123",
      "request_redacted": { "offer_id": "of_1", "qty": 1, "dest_country": "US" },
      "response_hash": "sha256:...",
      "response_ttl_seconds": 60,
      "ts": "2025-12-24T00:00:01Z"
    }
  ],
  "policy_versions": {
    "compliance_ruleset": "cr_2025_12_20",
    "return_policy": "rp_us_2025_10"
  },
  "citations": [
    { "chunk_id": "chunk_aa12", "doc_version_hash": "sha256:...", "offsets": [120, 260] }
  ],
  "derived": {
    "assumptions": ["tax estimate is medium confidence", "DDP applies"],
    "risk_notes": ["battery shipping restriction applies to option_3"]
  }
}
```

## Snapshot 生成策略（什么时候建、谁来建）
### 建议：两类 snapshot
- **Tool-level snapshot**：每次关键工具调用都可生成轻量快照（便于局部回放）
- **Decision-level snapshot**：生成 Draft Order 前，把“关键事实集合”固化为一个决策快照（强建议）

### MVP：只做 Decision-level 也可以
在 `checkout.create_draft_order` 前由 `evidence.create_snapshot` 统一固化：
- price quote（含 expire_at）
- shipping quote（线路+SLA+限制）
- tax estimate（方法+置信度）
- compliance check（allowed/blocked + 规则版本）
- return policy/warranty policy（结构化摘要 + 引用）
- 被引用 chunk（如说明书/政策条款）

## 存储与保留（Retention）
- 元数据（索引/查询）：Postgres
- 大字段（可选）：对象存储（S3/MinIO）
- 保留策略：
  - Draft Order：>= 90 天（或按业务/法律要求）
  - Dispute：>= 1–2 年（仲裁窗口期）
- 加密：敏感字段字段级加密（KMS），且所有读取都记录审计日志。

## 回放（Replay）与一致性校验
回放输出至少包含：
- 工具链路：工具名、版本、请求摘要、响应 hash、TTL、时间戳
- 规则版本：合规/退换/税费规则版本
- 引用证据：chunk_id + doc_version_hash + offsets

一致性校验：
- 若工具输出不可复算（例如实时价格已变），仍可使用 response_hash 自证“当时工具返回就是这样”
- 对“可复算”的工具（例如规则税费），可在回放时重算并比对差异（用于排查 bug）


