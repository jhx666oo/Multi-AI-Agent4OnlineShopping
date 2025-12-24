# Contributing

Thanks for your interest in contributing!

## Ground rules
- Be respectful and constructive.
- Keep changes small and focused.
- Follow **contract-first**: update schemas/docs before implementing behavior.

## Development workflow (recommended)
1) Create a branch from `main`
2) Make changes
3) Open a PR with:
   - What changed / why
   - Any backward-compat notes (for tool contracts)
   - Evidence/audit implications (if any)

## Contracts & tools
- Tool envelopes, error codes, TTL, and evidence formats must remain consistent across services.
- If you change a tool schema:
  - Update the relevant docs under `doc/`
  - Keep the change backward compatible where possible

---

# 贡献指南（中文）

欢迎贡献！

## 基本原则
- 尊重沟通、聚焦问题。
- 变更尽量小而清晰。
- 遵循 **Contract First**：先改 schema/文档，再改实现。

## 推荐流程
1) 从 `main` 拉分支
2) 提交变更
3) 提 PR，说明：
   - 改了什么 / 为什么改
   - 工具合约兼容性说明
   - 对审计/Evidence 的影响


