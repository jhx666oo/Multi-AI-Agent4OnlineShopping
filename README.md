# Multi-AI-Agent4OnlineShopping

**shopping like prompting!** Build an auditable, tool-driven multi-agent system that turns a user’s *purchase mission* into an executable **Draft Order** (without capturing payment), backed by **strong facts** (pricing/stock/shipping/tax/compliance/policies) obtained only via tools and **evidence snapshots** that can be replayed for cross-border disputes.

## Contents
- [Docs (Chinese)](#docs-chinese)
- [Architecture (Truth / Reasoning / Acting)](#architecture-truth--reasoning--acting)
- [Repository conventions](#repository-conventions)
- [中文](#中文)

## Why this repo
- **No guessing on tradable facts**: price/stock/shipping/tax/compliance/policies must come from structured sources or real-time tools.
- **Auditable by design**: every key decision is attached to an Evidence Snapshot (tool outputs + ruleset versions + citations).
- **RAG is evidence, not truth**: manuals/QA/review insights are retrieved with citations; they never override tool-verified truth.

## Docs (Chinese)
- Start here: [`doc/README.md`](doc/README.md)

## Architecture (Truth / Reasoning / Acting)
```mermaid
flowchart TB
  subgraph Truth[Truth Layer]
    KG[Product Knowledge Graph\n(SPU/SKU/Attributes/Compat/Risk)]
    ES[Event Streams\n(price/stock/logistics/policy)]
    RS[Rules & Policies\n(return/warranty/compliance)]
    TOOLS[Tool APIs\n(realtime quotes & checks)]
  end

  subgraph Reasoning[Reasoning Layer]
    GRAG[GraphRAG / HybridRAG\n(evidence retrieval with citations)]
    OPT[Bundle Optimizer\n(what-if, promos, substitutes)]
    RISK[Risk Signals\n(review->risk profile)]
  end

  subgraph Acting[Acting Layer]
    ORCH[Orchestrator]
    AGENTS[Specialist Agents\n(intent/candidate/verify/compliance/execution)]
    GW[Tool Gateway\n(envelope/auth/idempotency/audit)]
    MCP[MCP Servers\n(catalog/pricing/logistics/...)]
  end

  KG --> GRAG
  ES --> TOOLS
  RS --> TOOLS
  TOOLS --> GW --> MCP
  GRAG --> ORCH
  OPT --> ORCH
  RISK --> ORCH
  ORCH --> AGENTS --> GW
```

## Repository conventions
- **Contract-first**: tool schemas, error codes, TTL, and evidence formats are defined before implementations.
- **Least privilege**: payment capture is never callable by agents; user confirmation is mandatory.

---

## 中文

**shopping like prompting!** 目标是构建一个可工程落地的“委托式采购（Delegated Buying）”平台：AI 把用户的采购委托转成**可执行草稿订单（Draft Order）**（不扣款），并通过**工具调用**获得价格/库存/物流/税费/合规/条款等**强事实**，同时全链路**可审计回放（Evidence Snapshot）**，支撑跨境纠纷仲裁。

## 核心原则
- **强事实不允许模型猜**：所有可验证交易事实必须来自结构化源或实时工具返回。
- **可审计**：关键决策点必须产出 Evidence Snapshot，可回放“当时为什么这么报价/这么合规判定/这么下单”。
- **RAG 只做证据补全**：说明书/QA/评价洞察必须带引用，且不替代强事实。

## 文档（中文）
- 从这里开始：[`doc/README.md`](doc/README.md)


