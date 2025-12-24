# 07｜Draft Order（草稿订单）生成：状态机与关键确认点

## Draft Order 的定位
Draft Order 是“可执行但未扣款”的订单草稿：
- 固化用户选择的商品/变体/数量
- 固化运输线路/地址/税费估算/优惠
- 固化关键条款与风险提示
- 绑定 Evidence Snapshot
- 产出用户必须二次确认的 `confirmation_items`

## 核心硬约束
- Draft Order 可以由 Agent 生成，但**支付扣款必须由用户交互完成**（工具返回 `NEEDS_USER_CONFIRMATION` 或 `requires_user_action=true`）。
- Draft Order 必须有 `expires_at`（防止“草稿价≠支付价”争议）。

## 关键对象
### Mission（采购委托）
强类型约束：
- 预算（金额/币种）
- 目的国/地址（可先 country+postal_code 粗算）
- 到货时间窗
- 硬约束（插头/电压/禁运/过敏材质/儿童安全等）
- 软偏好（品牌、颜色、评价风险阈值等）

### Draft Order（草稿订单）
必须包含：
- `draft_order_id`
- `items[]`（sku_id + 变体选项 + qty）
- `shipping_option_id` + SLA
- `pricing_breakdown`（商品/优惠/运费/税费估算）
- `compliance_summary`（allowed/blocked + reason）
- `policy_ack_required`（退换/税费估算/合规提示的确认）
- `evidence_snapshot_id`
- `expires_at`

## 状态机（推荐）
```
MISSION_READY
  -> CANDIDATES_READY
  -> VERIFIED_TOPN_READY
  -> PLAN_SELECTED
  -> CART_READY
  -> SHIPPING_SELECTED
  -> TOTAL_COMPUTED
  -> DRAFT_ORDER_CREATED
  -> WAIT_USER_PAYMENT_CONFIRMATION
  -> PAID (由前端支付回调驱动)
```

## Draft Order 生成主流程（工具调用序列）
1) `mission.create / mission.update`：固化约束
2) `catalog.search_offers`：粗召回
3) `catalog.get_offer_card + get_offer_variants + get_availability`：补齐结构化卡片/变体/可售性
4) 对 TopN：
   - `pricing.get_realtime_quote`
   - `shipping.quote_options`
   - `tax.estimate_duties_and_taxes`
   - `compliance.check_item`
5) `cart.create` + `cart.add_item`
6) `checkout.select_shipping_option`
7) `promotion.apply_to_cart`（可选）
8) `checkout.compute_total`
9) `evidence.create_snapshot`：固化关键事实集合（强建议）
10) `checkout.create_draft_order`（绑定 consents + evidence）
11) `checkout.get_draft_order_summary`：给 UI 展示的最终摘要
12) `payment.create_payment_intent`：生成收银台会话（requires_user_action=true）

## confirmation_items（必须前端二次确认的点）
建议至少包含：
- 税费估算不确定性（置信度 low/medium/high）
- 清关所需字段与用户填报确认（可能涉及身份证/税号等）
- 合规风险提示（电池/液体/磁铁等）
- 退换成本与窗口期（跨境退货费用/是否自理）
- 线路限制（PO Box/偏远附加费/不可投递区域）

## 异常策略（必须实现）
- `PRICE_CHANGED`：重新报价→更新方案→要求用户确认
- `OUT_OF_STOCK`：触发替代策略（同规格/同风险）→重新核验
- `COMPLIANCE_BLOCKED`：拒绝下单，提供 mitigations（换线路/换仓/换品）
- `ADDRESS_INVALID`：走 `shipping.validate_address` 提示修改
- `TIMEOUT/UPSTREAM_ERROR`：降级为缓存并标注 stale（或要求稍后重试）


