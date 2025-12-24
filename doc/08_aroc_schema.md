# 08｜AROC（AI-Ready Offer Card）Schema：强结构化商品卡

## AROC 的定位
AROC 是 AI 读取商品信息的**唯一结构化入口**（除实时工具外）。  
原则：AI 不读详情页，不从营销文案“猜”关键属性；关键字段要么在 AROC（结构化），要么通过工具实时核验。

## 强事实 vs 弱事实（证据）边界
### 进入 AROC 的强结构化字段（可参与过滤/合规/下单）
- 变体轴与可选项：颜色/尺码/插头/电压/功率/容量/成分/保质期
- 包装信息：重量、尺寸（影响运费/禁限运）
- 是否含电池/液体/磁铁/粉末/食品/医疗宣称等风险标签
- 退换/保修条款：结构化摘要 + policy_id
- 合规声明：证书引用（doc_refs）+ 规则映射

### 只能作为证据（Evidence/RAG）的字段
- 营销文案、主观描述
- 评价原文（只能用于“风险画像”的来源）
- 测评结论（必须带引用且权重低）

## AROC v0.1（建议 Schema，供 contracts 使用）
```json
{
  "aroc_version": "0.1",
  "offer_id": "of_123",
  "spu_id": "spu_456",
  "merchant_id": "m_789",
  "category": { "cat_id": "c_001", "path": ["Electronics", "Chargers"] },
  "titles": [{ "lang": "en", "text": "..." }, { "lang": "zh", "text": "..." }],
  "brand": { "name": "Anker", "normalized_id": "brand_anker", "confidence": "high" },
  "attributes": [
    {
      "attr_id": "plug_type",
      "name": { "en": "Plug Type", "zh": "插头类型" },
      "value": { "type": "enum", "raw": "US", "normalized": "US" },
      "unit": null,
      "confidence": 0.98,
      "evidence_refs": ["chunk_aa12"]
    }
  ],
  "variants": {
    "axes": [{ "axis": "color", "values": ["black", "blue"] }],
    "skus": [
      {
        "sku_id": "sku_1",
        "options": { "color": "black" },
        "packaging": { "weight_g": 220, "dim_mm": [120, 80, 40] },
        "risk_tags": ["battery_included"],
        "compliance_tags": ["needs_un38_3"],
        "evidence_refs": ["chunk_cc56"]
      }
    ]
  },
  "policies": {
    "return_policy_id": "rp_us_2025_10",
    "warranty_policy_id": "wp_global_2025_01",
    "policy_summary": { "en": "Returns within 30 days...", "zh": "30天内可退..." },
    "evidence_refs": ["chunk_rp11"]
  },
  "risk_profile": {
    "fragile": false,
    "sizing_uncertainty": "low|medium|high",
    "counterfeit_risk": "low|medium|high",
    "after_sale_complexity": "low|medium|high"
  },
  "media_refs": { "image_ids": ["img_1"], "manual_doc_ids": ["doc_77"] },
  "update": {
    "source": "merchant_feed|platform_parse|human_review",
    "updated_at": "2025-12-23T00:00:00Z",
    "version_hash": "sha256:..."
  }
}
```

## 版本化与回溯
- AROC 必须带 `version_hash` 与 `updated_at`
- Draft Order/Evidence 必须记录当时使用的 AROC `version_hash`（避免“详情页变更导致争议”）

## AROC 生成（Pipeline）
推荐分层生成：
- 商家结构化 feed（优先级最高）
- 平台解析器（从参数表/说明书抽取结构化字段）
- 人工复核（高风险类目/高客单价）
- 模型抽取（只能生成“候选字段”，必须进入审核/置信度低，不能直接当强事实）


