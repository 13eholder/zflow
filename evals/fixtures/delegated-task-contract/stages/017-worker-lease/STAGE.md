# Stage: Worker 租约到期

**类型**: feat  
**状态**: in-progress  
**决策者**: 平台架构组

## MISSION

让 Worker 消费已经由 API 验证并由 Scheduler 透传的租约超时，在到期时取消任务、释放本地资源并返回既有错误。

## 应然文档

| 文档 | 说明 |
|------|------|
| [已批准 Spec](../../approved-inputs.md#已批准-specworker-租约到期) | Worker 租约行为 |
| [ADR-017](../../approved-inputs.md#adr-017已验证的任务租约) | timeout ownership |

## 实现计划

| Task | 说明 |
|------|------|
| [TASK-017](../../approved-inputs.md#task-017) | 实现 Worker 租约到期消费逻辑与测试 |

## Task Contracts（委派执行边界）

| Task | Contract | 状态 | Deviation / Evidence |
|------|----------|------|----------------------|

## 实然文档

TODO

## 应然 vs 实然差异

TODO

## 验证结果

TODO
