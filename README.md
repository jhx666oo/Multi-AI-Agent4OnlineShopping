# Multi-AI-Agent4OnlineShopping

> **shopping like prompting!**

Build an auditable, tool-driven multi-agent system that turns a user's *purchase mission* into an executable **Draft Order** (without capturing payment), backed by **strong facts** (pricing/stock/shipping/tax/compliance/policies) obtained only via tools and **evidence snapshots** that can be replayed for cross-border disputes.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Contents

- [Why this repo](#why-this-repo)
- [Architecture](#architecture-truth--reasoning--acting)
- [Docs (Chinese)](#docs-chinese)
- [Repository conventions](#repository-conventions)
- [中文版本](#中文版本)

---

## Why this repo

| Principle | Description |
|-----------|-------------|
| **No guessing on tradable facts** | Price, stock, shipping, tax, compliance, policies must come from structured sources or real-time tools. |
| **Auditable by design** | Every key decision is attached to an Evidence Snapshot (tool outputs + ruleset versions + citations). |
| **RAG is evidence, not truth** | Manuals, QA, review insights are retrieved with citations; they never override tool-verified truth. |

---

## Architecture (Truth / Reasoning / Acting)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           TRUTH LAYER                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ Product KG       │  │ Event Streams    │  │ Rules & Policies │       │
│  │ (SPU/SKU/Compat) │  │ (price/stock)    │  │ (return/warranty)│       │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘       │
│           │                     │                     │                 │
│           └──────────┬──────────┴──────────┬──────────┘                 │
│                      ▼                     ▼                            │
│              ┌───────────────────────────────────┐                      │
│              │      Tool APIs (realtime)         │                      │
│              └───────────────┬───────────────────┘                      │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────────┐
│                           REASONING LAYER                               │
│  ┌──────────────────┐  ┌─────┴────────────┐  ┌──────────────────┐       │
│  │ GraphRAG         │  │ Bundle Optimizer │  │ Risk Signals     │       │
│  │ (evidence+cite)  │  │ (what-if/promo)  │  │ (review→risk)    │       │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘       │
│           └──────────┬──────────┴──────────┬──────────┘                 │
│                      ▼                     ▼                            │
└──────────────────────┼──────────────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────────────┐
│                           ACTING LAYER                                  │
│                      ▼                                                  │
│              ┌───────────────┐                                          │
│              │  Orchestrator │                                          │
│              └───────┬───────┘                                          │
│                      ▼                                                  │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │ Specialist Agents                                       │            │
│  │ (Intent / Candidate / Verify / Compliance / Execution)  │            │
│  └────────────────────────┬────────────────────────────────┘            │
│                           ▼                                             │
│              ┌────────────────────────┐                                 │
│              │ Tool Gateway           │                                 │
│              │ (envelope/auth/audit)  │                                 │
│              └────────────┬───────────┘                                 │
│                           ▼                                             │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │ MCP Servers                                             │            │
│  │ (catalog / pricing / logistics / compliance / checkout) │            │
│  └─────────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Docs (Chinese)

📚 **Start here:** [`doc/README.md`](doc/README.md)

| Document | Description |
|----------|-------------|
| [00_overview](doc/00_overview.md) | 项目概览：三层架构 |
| [01_repo_structure](doc/01_repo_structure.md) | 仓库目录结构 |
| [02_tech_stack](doc/02_tech_stack.md) | 技术栈选型 |
| [03_dev_process](doc/03_dev_process.md) | 开发流程与里程碑 |
| [04_tooling_spec](doc/04_tooling_spec.md) | 工具调用统一规范 |
| [05_tool_catalog](doc/05_tool_catalog.md) | 平台级工具目录 |
| [06_evidence_audit](doc/06_evidence_audit.md) | Evidence Snapshot 审计机制 |
| [07_draft_order](doc/07_draft_order.md) | Draft Order 状态机 |
| [08_aroc_schema](doc/08_aroc_schema.md) | AROC Schema 设计 |
| [09_kg_design](doc/09_kg_design.md) | 知识图谱设计 |
| [10_rag_graphrag](doc/10_rag_graphrag.md) | GraphRAG 检索 |
| [11_multi_agent](doc/11_multi_agent.md) | Multi-Agent 编排 |
| [12_mcp_design](doc/12_mcp_design.md) | MCP Server 设计 |
| [13_security_risk](doc/13_security_risk.md) | 安全与风控 |

---

## Repository conventions

- **Contract-first**: Tool schemas, error codes, TTL, and evidence formats are defined before implementations.
- **Least privilege**: Payment capture is never callable by agents; user confirmation is mandatory.

---

## 中文版本

> **shopping like prompting!**

目标是构建一个可工程落地的**委托式采购（Delegated Buying）**平台：

- AI 把用户的采购委托转成**可执行草稿订单（Draft Order）**（不扣款）
- 通过**工具调用**获得价格/库存/物流/税费/合规/条款等**强事实**
- 全链路**可审计回放（Evidence Snapshot）**，支撑跨境纠纷仲裁

### 核心原则

| 原则 | 说明 |
|------|------|
| **强事实不允许模型猜** | 所有可验证交易事实必须来自结构化源或实时工具返回 |
| **可审计** | 关键决策点必须产出 Evidence Snapshot，可回放"当时为什么这么报价/合规判定/下单" |
| **RAG 只做证据补全** | 说明书/QA/评价洞察必须带引用，且不替代强事实 |

### 文档入口

📚 从这里开始：[`doc/README.md`](doc/README.md)
