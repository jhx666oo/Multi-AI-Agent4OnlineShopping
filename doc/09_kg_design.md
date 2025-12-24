# 09｜产品知识图谱（KG）：实体、关系、置信度与版本

## KG 的价值（为什么不是“先全站 RAG”）
综合类目 + 跨境场景里，最难的是：
- 属性不统一（插头/电压/尺码体系）
- 兼容关系复杂（配件/机型/协议）
- 合规/禁限运传播（含电池 → 线路限制）

KG 能提供“可计算约束”，让候选召回与合规判断**先变干净**，再在小集合里做 RAG 证据补全。

## 实体（Nodes）
最小集（MVP）：
- `Offer` / `SKU` / `SPU`
- `Category`
- `Brand`
- `Merchant`
- `Attribute` / `AttributeValue`
- `Country/Region`
- `Policy`（Return/Warranty/Shipping）
- `ComplianceRule` / `Certificate`

增强（P1/P2）：
- `Model`（设备型号，如 iPhone 15）
- `ShippingLane` / `Warehouse`
- `HSCode`
- `RiskTag`

## 关系（Edges）
最小集（MVP）：
- `SKU -BELONGS_TO-> SPU`
- `Offer -SOLD_BY-> Merchant`
- `Offer -IN_CATEGORY-> Category`
- `SKU -HAS_ATTRIBUTE-> AttributeValue`
- `SKU -RISK-> RiskTag`
- `SKU -REQUIRES_CERT-> Certificate`
- `ComplianceRule -APPLIES_TO-> (Category|AttributeValue|Country)`
- `Policy -APPLIES_TO-> (Offer|Merchant|Country)`

增强（P1/P2）：
- `SKU -COMPATIBLE_WITH-> Model|SKU`
- `Offer -SUBSTITUTE_OF-> Offer`（替代）
- `Offer -COMPLEMENT_OF-> Offer`（配件/组合）
- `ShippingLane -ALLOWS-> RiskTag`（某线路允许电池/液体等）

## 每条边/节点必须带的元数据
- `confidence`：0–1 或 low/medium/high
- `source`：merchant_feed / platform_rules / parsed_manual / human_review
- `version_hash`：用于回溯
- `valid_from`/`valid_to`：政策/合规规则强烈建议

## 写入与更新
- 结构化字段更新：走事件流（price/stock/availability）或批处理（属性/类目）
- 政策/合规更新：必须版本化（ruleset_version），并写入 Evidence

## 服务化（给 Agent 的用法）
KG 不直接给模型“自由读图”；应通过工具暴露稳定接口，例如：
- `catalog.search_offers`：内部用 KG 过滤
- `compliance.check_item`：内部用 KG + ruleset 判定
- `catalog.get_offer_variants`：从 AROC/KG 输出变体矩阵


