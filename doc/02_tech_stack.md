# 02｜技术栈（建议选型：可审计交易系统优先）

> 目标是“能交易落地 + 可审计回放 + 跨境合规”，所以选型优先级：**一致性与可回放** > **速度** > **花哨**。

## 语言与运行时
- **TypeScript（Node.js 20 LTS）**：Agent 编排、Tool Gateway、MCP Servers、Web Console（类型一致、contract 生成友好）
- **Python（可选）**：离线管道（评价聚类、抽取、训练/评估），也可用 TS 统一实现（团队取舍）

## API / 合约 / 代码生成
- **OpenAPI 3.1 + JSON Schema**：定义 Tool 输入输出与错误码（Contract First）
- **Typescript SDK 生成**：从 contracts 自动生成 typesafe client（给 Agent/前端调用）
- **Protobuf（可选）**：内部高频服务间通信与事件定义（强类型、跨语言）

## 存储与检索（“三库一层”）
### AROC Store（结构化商品卡）
- **PostgreSQL**（含事务、版本化字段）
- **Redis**：短 TTL 缓存（报价、可售性、热卡片）

### Evidence Store（证据库 + 向量 + 关键词）
- 原文：**MinIO/S3**（说明书、政策原文、证书 PDF、图片）
- 向量：**pgvector / Milvus**（MVP 推荐 pgvector，运维简单）
- 关键词：**OpenSearch/Elastic**（型号、标准号、条款关键字）

### Knowledge Graph（知识图谱）
- **Neo4j**（MVP/中期推荐；查询友好）
- 或 Amazon Neptune / JanusGraph（更大规模可选）

## 事件与实时增量
- **Kafka / Pulsar**：价格/库存/物流 SLA/政策更新事件流
- CDC：Debezium（可选）采集库存/价格变更

## 观测与审计
- **OpenTelemetry**：trace/span 贯穿 Envelope → Gateway → MCP → Upstream
- **Prometheus + Grafana**：指标与告警
- **Loki/ELK**：日志检索
- Evidence Snapshot：写入 Postgres（元数据）+ 对象存储（大 payload，可选）

## 认证/鉴权/权限
- **OAuth2/OIDC**（用户态）
- 服务间：mTLS + JWT（含 scope）
- 工具级权限：`tool:<domain>:read|write` + Agent 绑定可调用工具白名单

## 交付与部署
- **Docker Compose**：本地一键启动依赖（pg/redis/kafka/neo4j/minio/opensearch）
- **Kubernetes + Helm**：生产环境
- **CI/CD**：GitHub Actions / GitLab CI（lint/test/contract-test/build/scan/deploy）

## LLM 与推理
- Orchestrator/Planner：中等模型（成本可控）
- Verification/Compliance/Compare：大模型用于 TopN 深度核验与长上下文比对
- **强制工具核验**：任何可验证事实必须被工具回填/覆盖


