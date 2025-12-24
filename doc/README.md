# 文档索引（从这里开始）

本目录给出 “AI 生成可执行草稿订单（Draft Order）” 平台的**完整工程化设计**：仓库结构、技术栈、开发流程、工具目录（Tool Calls）、证据审计（Evidence Snapshot）、AROC（AI-Ready Offer Card）、知识图谱（KG）、GraphRAG、MCP 工具服务器拆分、多 Agent 编排与权限风控。

## 建议阅读顺序（强烈）
1) `00_overview.md`  
2) `04_tooling_spec.md`  
3) `05_tool_catalog.md`  
4) `06_evidence_audit.md`  
5) `07_draft_order.md`  
然后再进入 AROC/KG/RAG 与多 Agent/MCP 细节。

## 目录导航（点击直达）
- **概览**
  - [`00_overview.md`](./00_overview.md)：目标、边界、三层架构（Truth/Reasoning/Acting）
- **工程与落地**
  - [`01_repo_structure.md`](./01_repo_structure.md)：建议的仓库目录结构（可直接照着创建）
  - [`02_tech_stack.md`](./02_tech_stack.md)：技术栈与选型理由（跨境交易 + 可审计）
  - [`03_dev_process.md`](./03_dev_process.md)：开发流程、里程碑、CI/CD、联调与验收
- **工具层（强事实 + 可审计）**
  - [`04_tooling_spec.md`](./04_tooling_spec.md)：工具调用统一规范（Envelope/错误码/幂等/TTL/Tracing）
  - [`05_tool_catalog.md`](./05_tool_catalog.md)：平台级工具目录（全量清单 + 分阶段 MVP 裁剪）
  - [`06_evidence_audit.md`](./06_evidence_audit.md)：Evidence Snapshot 设计（可回放、可追责）
  - [`07_draft_order.md`](./07_draft_order.md)：Draft Order 生成流程与状态机（从 Mission 到支付前确认）
- **知识与检索**
  - [`08_aroc_schema.md`](./08_aroc_schema.md)：AROC Schema 与强/弱事实边界
  - [`09_kg_design.md`](./09_kg_design.md)：产品知识图谱（KG）实体/关系/版本/置信度
  - [`10_rag_graphrag.md`](./10_rag_graphrag.md)：HybridRAG/GraphRAG（证据库构建、chunk、引用）
- **智能体与协议**
  - [`11_multi_agent.md`](./11_multi_agent.md)：多 Agent 职责划分、编排状态机、Token 预算
  - [`12_mcp_design.md`](./12_mcp_design.md)：MCP Server 拆分、工具定义模板、权限与审计策略
- **安全与风控**
  - [`13_security_risk.md`](./13_security_risk.md)：支付确认、PII、风控、合规门禁、反注入


