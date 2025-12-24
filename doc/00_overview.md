# 00｜项目概览：从“全站 RAG”到“事实图谱 + 实时工具 + 可审计多 Agent”

## 目标（What）
构建一个能够输出**可执行草稿订单（Draft Order）**的 AI Agent 平台：用户提交“采购委托（Purchase Mission）”，系统产出 2–3 个可执行方案，并在用户确认后进入支付/下单。

系统必须满足：
- **强事实只来自工具**：价格、库存、运费、税费、合规门禁、退换/保修条款等关键字段必须来自结构化源或实时工具结果。
- **全链路可审计**：每个关键决策点必须产出 Evidence Snapshot，可回放当时的工具结果、规则版本与被引用证据片段。
- **RAG 只做证据补全**：说明书/QA/评价洞察等弱事实只作为“可引用证据”，不能替代强事实。

## 三层拆分（Truth / Reasoning / Acting）
### Truth（事实层）
- Product Knowledge Graph（产品知识图谱）：SKU–SPU–类目–属性–兼容关系–风险标签–证书/规则关联
- Event Stream（事件流）：价格/库存/物流 SLA/活动/政策变化的增量更新
- Rule & Policy Store：平台规则、商家协议、合规规则、退换/保修条款（版本化）
- Tool API：对外暴露强事实查询与交易动作（见 `doc/05_tool_catalog.md`）

### Reasoning（推理层）
- GraphRAG/HybridRAG：先图谱约束候选集合，再在候选内召回证据并重排
- 风险推导：评价聚类 → 风险画像（尺码偏差、缺陷类型分布、破损概率等）
- 组合优化：跨店凑单/满减/替代品/what-if 仿真
- 规则引擎：合规门禁、税费推导、退换条款约束、敏感操作二次确认

### Acting（执行层）
- 多 Agent 编排：Orchestrator + Intent/Preference + Candidate + Verification/Critic + Compliance + Bundle + Execution + After-sale
- 工具调用与权限：按域拆 MCP Server；敏感工具（checkout/payment）严格 scope + 需要用户确认
- 审计与观测：OpenTelemetry trace + Evidence Snapshot + AB 实验

## 非目标（What NOT）
- 不做“模型直接下单扣款”。支付确认必须由前端用户交互触发。
- 不把商品详情页当真相来源。详情页只能进入 Evidence/RAG，且必须带引用与权重。

## 最小可行闭环（MVP）
MVP 的定义：能完成「Mission → 候选 → 核验 → 方案 → Draft Order」的可演示闭环。
- 必备工具：catalog、pricing quote、shipping quote、tax estimate、compliance check、cart/checkout draft、evidence snapshot
- 不必第一天做：跨店议价、复杂 what-if、全量 KG 抽取、全量售后仲裁


