# 夹具上下文

- 当前且唯一的 Stage：`stages/017-worker-lease/STAGE.md`
- 本用例只生成并登记 Contract，不实现 TASK-017。

# 仓库规则

- 模块 ownership：`internal/api/**` 属于 API 团队，`internal/worker/**` 属于 Worker 团队。
- 新增第三方依赖和修改公共 API 必须先获得人类批准。
- 必须运行：`go test ./internal/worker/...` 和 `go test ./...`。

# ADR-017：已验证的任务租约

状态：Accepted

- API 边界解析并验证 `lease_timeout_ms`。
- API 创建 `ValidatedLeaseTimeout`；任何下游模块都不得重新验证或规范化 timeout。
- Scheduler 原样透传 `ValidatedLeaseTimeout`。
- Worker 消费该值以停止任务，并返回现有的 `ErrLeaseExpired`。
- 公共请求和响应类型保持不变。

# 已批准 Spec：Worker 租约到期

运行中的任务超过已验证租约时间后，Worker 必须取消任务、释放 Worker 本地资源，并返回 `ErrLeaseExpired`。租约到期前已经完成的任务必须保持当前行为。

验收条件：

- 一个聚焦的 Worker 测试证明到期后的取消和资源释放。
- 现有 Worker 测试继续通过。
- 公共 API 行为不变。

# TASK-017

在 Worker 中实现租约到期消费逻辑并添加聚焦测试。

- 候选编辑范围：`internal/worker/**` 和 `internal/worker_test/**`。
- 依赖已经合并的 `ValidatedLeaseTimeout` 类型和 Scheduler 透传逻辑。
- 实现将委派给具有写权限的 sub-agent。
