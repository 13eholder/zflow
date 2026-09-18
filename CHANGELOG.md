# Changelog

## 2.4.0 — 2026-09-18

### 变更

- 将 `delegated-task-contract` 更名为 `task-contract`，集中维护文件／结构／函数级变更对象、目标行为、接口变化与执行权限；函数内部实现仍由执行者决定。
- Task 和验收条件使用稳定编号，Contract 映射验收条目、变更对象及验证，并记录输入版本。上游相关变更使 READY 失效，重新核验后才能继续。
- Plan 仅引用已接受的架构决策；ADR 必须在相关实现和 Contract READY 前接受。规范变更及临时例外先批准，再更新有效来源和契约。
- Stage 支持 `done → revising → done`，修订保留原封版基线与历史契约，并重新执行封版门禁。
- 取消任务必须记录已有变更的撤回或接管处置；交付中保留的变更须经接管契约验收，跨 Stage 转移同样适用。
- Stage 技能经对照评审压缩为 253 行，保留授权、ADR 前置、修订和终态门禁。
- 扩充任务契约与 Stage 评估场景；Task Contract fixture 使用 Markdown、CommonJS 和 Node 内置测试，无第三方依赖。

### 升级注意

- 自定义提示词或配置若引用 `delegated-task-contract` 或 `skills/delegated-task-contract/SKILL.md`，请改为 `task-contract` 或 `skills/task-contract/SKILL.md`；本版本未保留旧名称别名。
- 既有 Stage 内的 `task-contract/` 产物路径保持不变。历史已完成契约保留原输入和证据，新增修订使用新的 Task ID 和契约。
