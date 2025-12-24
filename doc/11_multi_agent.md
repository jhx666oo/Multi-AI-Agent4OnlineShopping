# 11｜多 Agent 体系：职责划分、编排与 Token 预算

## 为什么按“能力/职责”分 Agent
按店铺分 Agent 容易变成黑箱人格，且商家话术会污染推荐。正确姿势是：
- 平台掌权：核验/合规/组合优化/执行
- 店铺降级：可审计的能力合约（Contract）

## 核心 Agent（建议 v1 配齐）
- **Orchestrator（总控）**：澄清需求、拆解任务、预算编排、路由工具与 Agent
- **Intent & Preference Agent**：把口语需求变成强类型 Mission（硬/软约束 + 目标函数）
- **Candidate Generation Agent**：图谱约束 + 检索召回候选集
- **Verification/Critic Agent（反幻觉核心）**：对 TopN 调实时工具核验价格/库存/ETA/条款；检查“无证据陈述”
- **Cross-border Compliance Agent**：禁限运/证书/清关材料/税费模型与不确定性
- **Bundle & Negotiation Agent（可后置）**：跨店凑单、满减、替代品组合、协议式报价
- **Checkout/Execution Agent**：生成 Draft Order；严格遵守“支付需用户确认”
- **After-sales Agent（可后置）**：物流异常、退换、仲裁证据链

## 编排方式：状态机（强推荐）
见 `doc/07_draft_order.md` 的状态机。Orchestrator 负责推进状态，并对每个状态定义：
- 允许调用的工具白名单
- 必须产出的结构化输出（JSON）
- 失败重试/降级策略

## Token/算力预算策略（分段加码）
- 粗筛：规则 + 小模型（便宜，处理 200–1000 候选）
- 深度：中模型用于 Top 20–50 的解释与对比
- 打钉子：大模型用于 Top 10–50 的长上下文核验（说明书+条款+评价洞察），但每条“事实结论”仍需工具确认

## 反幻觉守门（必须机制）
- 任何包含数值/承诺/可执行性的陈述必须绑定 evidence：
  - 强事实：tool evidence
  - 弱事实：chunk citations
- Verifier 对最终答案做逐句检查：
  - “可验证事实无 tool/chunk 证据” → 退回重写或降级为“未知/需确认”


