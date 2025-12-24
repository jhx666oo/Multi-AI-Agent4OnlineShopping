# 05｜平台级工具目录（Tool Calls 全量清单 + MVP 裁剪）

> 目标：AI 生成 **Draft Order**。因此工具层必须同时满足：  
> 1) **强事实不允许模型猜**（所有关键交易事实由工具提供）  
> 2) **可审计可回放**（Evidence Snapshot）

本文把工具按域分组，并标注优先级：
- **P0（MVP 必做）**：Draft Order 闭环必需
- **P1（增强）**：体验/准确率显著提升
- **P2（平台壁垒）**：议价、保证、仲裁等

所有工具必须遵守 `doc/04_tooling_spec.md` 的 Envelope/错误码/evidence/幂等规范。

---

## 2.1 身份与用户上下文（Identity / Profile）
- **P0** `identity.get_user_profile`：基础画像（language/country_preference/risk_tier）
- **P0** `identity.get_user_preferences`：长期偏好（硬约束/软偏好）
- **P1** `identity.update_user_preferences`（写；需 idempotency_key）
- **P0** `identity.get_user_addresses`
- **P0** `identity.add_or_update_address`（写；需 idempotency_key）

---

## 2.2 任务与对话状态（Mission / Session）
- **P0** `mission.create`：固化“采购委托”
- **P0** `mission.update`：澄清后更新约束（需版本号）
- **P0** `mission.get`：多 Agent 共享一致目标函数

Mission 必须强类型，最少包含：预算、目的国、到货时间窗、禁忌项、数量、收货人属性（如儿童安全）。

---

## 2.3 商品/供给检索（Catalog & Offer）
- **P0** `catalog.search_offers`：粗召回（BM25 + 向量 + 类目过滤）
- **P0** `catalog.get_offer_card`：获取 AROC（AI-Ready Offer Card）
- **P0** `catalog.get_offer_variants`：变体矩阵（颜色/尺码/插头/功率等）
- **P1** `catalog.get_offer_media`：图片/视频/说明书资源列表（证据与展示）
- **P0** `catalog.get_availability`：可售性（按目的国/仓/线路）

---

## 2.4 实时价格、库存、活动（Pricing / Inventory / Promotions）
- **P0** `pricing.get_realtime_quote`：实时商品侧报价（含过期时间）
- **P1** `promotion.list_applicable_promotions`：可用券/满减/跨店活动
- **P1** `promotion.apply_to_cart`：优惠应用（必须可回滚）
- **P2** `promotion.optimize`：凑单/组合优化（最低价/最快到/风险最低）

---

## 2.5 跨境物流（Shipping / Delivery）
- **P0** `shipping.validate_address`：地址结构化与可达性校验
- **P0** `shipping.quote_options`：线路报价（核心）
- **P1** `shipping.get_last_mile_restrictions`：偏远/PO Box/附加费
- **P2** `shipping.track_shipment`：订单后追踪

---

## 2.6 税费/关税/清关（Tax & Duty）
- **P0** `tax.estimate_duties_and_taxes`：税费估算（必须给置信度 + 方法）
- **P1** `tax.get_hs_code_suggestion`：HS 推荐（高风险，建议默认“建议值 + 置信度 + 人工复核开关”）

---

## 2.7 合规与禁限运（Compliance）
- **P0** `compliance.check_item`：合规门禁（allowed/blocked + reason + mitigations）
- **P1** `compliance.get_certificates_for_sku`：拉取证书引用（doc_refs）
- **P0** `compliance.policy_ruleset_version`：规则版本固化入 evidence（可回放）

---

## 2.8 内容证据与 RAG（Knowledge / Evidence / RAG）
- **P1** `knowledge.search`：证据检索（manual/policy/qa/review_insight）
- **P1** `knowledge.get_chunk`：取完整 chunk + offsets（UI 高亮）
- **P0** `evidence.create_snapshot`：固化关键事实与引用（强烈建议第一天就做）
- **P0** `evidence.attach_to_draft_order`：绑定到 Draft Order 供售后/仲裁调用

---

## 2.9 购物车/草稿订单/下单执行（Cart / Checkout / Draft Order）
- **P0** `cart.create`
- **P0** `cart.add_item`
- **P0** `cart.remove_item` / `cart.update_quantity`
- **P0** `checkout.select_shipping_option`
- **P0** `checkout.compute_total`：总额计算（含 assumptions）
- **P0** `checkout.create_draft_order`：生成草稿订单（核心；不扣款）
- **P0** `checkout.get_draft_order_summary`：支付前最终摘要（给 UI 直接展示）
- **P1** `checkout.lock_price_and_stock`：短时间锁价锁库（强烈建议）

---

## 2.10 支付（Payment）——禁止 AI 代替用户确认
- **P0** `payment.create_payment_intent`：生成收银台会话
  - 必须返回：`requires_user_action: true`
  - 工具层必须能抛：`NEEDS_USER_CONFIRMATION`
- **P1** `payment.get_status`：支付状态查询

**硬约束**：任何“确认扣款/确认支付”的动作必须由前端用户交互触发；后端工具不得提供可被 Agent 直接调用的“capture/confirm”能力（或永远拒绝）。

---

## 2.11 订单后（Order / After-sale）
- **P1** `order.get`
- **P1** `order.cancel`（窗口期）
- **P2** `order.request_return` / `order.request_refund`
- **P2** `order.open_dispute`：纠纷仲裁入口（强依赖 evidence）

---

## 2.12 商家侧工具（Merchant / Shop Capability Contract）
- **P1** `merchant.get_capabilities`：商家结构化合约（版本化）
- **P1** `merchant.submit_compliance_docs`：上传证书/报告（进证据库）
- **P2** `merchant.get_sla_metrics`：履约质量（用于排序与风险提示）

---

## 2.13 风控、观察与实验（Risk / Observability / Experiment）
- **P1** `risk.assess_order`：欺诈/拒付风险与动作要求
- **P0** `obs.log_event`：决策链路埋点（必备）
- **P1** `exp.get_assignment`：AB 实验分流

---

## MVP 建议裁剪（最少 30% 也能跑）
只实现以下 P0 即可跑通 Draft Order：
- identity：profile/preferences/addresses
- mission：create/update/get
- catalog：search_offers/get_offer_card/get_offer_variants/get_availability
- pricing：get_realtime_quote
- shipping：validate_address/quote_options
- tax：estimate_duties_and_taxes
- compliance：check_item/policy_ruleset_version
- checkout：cart + compute_total + create_draft_order + get_draft_order_summary
- evidence：create_snapshot + attach_to_draft_order
- obs：log_event


