# 10｜GraphRAG / HybridRAG：证据库构建与可引用检索

## 目标
RAG 只服务“解释性内容与证据引用”：
- 说明书、参数表、政策条款原文、Q&A、评价洞察
输出必须包含 citations（chunk_id + doc_version_hash + offsets），供 UI 高亮与 Evidence 回放。

## 证据来源分级（权重与可引用性）
平台规则 > 商家协议 > 说明书/参数表 > 官方 Q&A > 评价洞察 > 评价原文

## Chunking（分块）策略：字段感知 + 可引用
不要按固定 token 硬切。建议按结构边界切：
- 参数表：每行一个 chunk（带 attr_id 候选）
- 条款：每条条款一个 chunk（带 policy_id、clause_id）
- 说明书：按小节/步骤切（带 section_id）
- QA：按问答对切

chunk 元数据最小集：
- `chunk_id`
- `text`
- `source_type`（manual/policy/qa/review_insight）
- `offer_id/sku_id/category_id`
- `language`
- `doc_version_hash`
- `offsets`（原文偏移，供 UI 高亮）
- `created_at`

## 评价进入 RAG 的正确姿势：先结构化再入库
直接把评价原文塞向量库会噪声爆炸。建议 pipeline：
1) 评论聚类/主题抽取
2) 输出 Review Insight Chunks：
   - “尺码偏小：支持数/国家分布/批次分布”
   - “做工缺陷：类型分布”
   - “物流破损概率”
3) 每条洞察带回溯：`support_count`、`country_distribution`、`evidence_review_ids[]`

## Serving：Graph Filter → Hybrid Retrieve → Re-rank
推荐检索流水线：
1) Query Rewrite：将用户问题拆成 2–5 个子查询（兼容/功率/退换/禁限运提示等）
2) Graph Filter：用 KG/AROC 先约束候选（类目/属性/目的国可达）
3) Hybrid Retrieve：
   - BM25（型号/标准号/条款编号）
   - 向量召回（语义需求表达）
4) Re-rank：cross-encoder 或小模型重排（只对 top_k）
5) 输出：chunks + citations + 来源权重

## 与强事实的边界（强制）
- RAG 不输出价格/库存/税费/可达性/合规结论；这些必须由对应工具给出。
- 若用户问“是否能运/是否能清关”，RAG 只能提供政策条款证据，最终结论必须由 `compliance.check_item` 输出。


