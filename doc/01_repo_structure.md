# 01｜仓库结构（建议：Monorepo + Contract First）

> 你当前仓库为空。下面给出一个**可直接照抄创建**的目录结构，围绕“工具合约（Contract）→ MCP Server → Agent 编排 → 数据管道”组织。

## 目录树（建议）

```
/
  README.md
  doc/                          # 设计与规范（本次已创建）

  apps/
    agent-orchestrator/         # Orchestrator + 多 Agent 编排（对话/任务/预算/路由）
    tool-gateway/               # 统一 Tool Gateway（Envelope/鉴权/审计/幂等/限流）
    mcp-servers/
      catalog-mcp/
      pricing-mcp/
      logistics-mcp/
      compliance-mcp/
      checkout-mcp/
      knowledge-mcp/
      support-mcp/
    web-console/                # 内部控制台：回放 Evidence、查看 trace、人工复核/仲裁

  packages/
    contracts/                  # JSON Schema / OpenAPI：Tool、Mission、DraftOrder、Evidence
    common/                     # 日志、错误码、Envelope、trace、鉴权中间件
    sdk/                        # 给 Agent/前端用的 typesafe SDK（由 contracts 生成）

  data/
    pipelines/                  # AROC 生成、KG 构建、评价聚类、索引构建
    migrations/                 # DB/KG schema 迁移（版本化）

  infra/
    docker/                     # 本地一键启动：Postgres/Redis/Kafka/Neo4j/MinIO/OpenSearch
    k8s/                        # Helm charts / Kustomize
    ci/                         # CI 工作流（lint/test/contract-check）

  scripts/                      # 开发脚本：生成 SDK、回放 evidence、导入样例数据
```

## 核心原则：Contract First
- 所有工具（Tool）必须先在 `packages/contracts` 定义：输入/输出 schema + 错误码 + TTL + evidence 格式
- MCP Server 与 Tool Gateway 必须通过 **contract-test** 校验：不允许“工具文档与实现脱节”

## 组件边界（强制）
- `tool-gateway`：只负责 Envelope、鉴权、幂等、限流、审计、trace；不做业务决策
- `mcp-servers/*`：只做领域服务编排（调用内部微服务或数据库），输出强事实与 evidence
- `agent-orchestrator`：只做任务拆解与编排；强事实一律依赖工具返回
- `data/pipelines`：离线/准实时构建 AROC/KG/向量索引；不得绕开证据与版本管理


