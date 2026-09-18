# 夹具上下文

- 输入修订号：`worker-lease-v2`（适用于本文的 Task、Spec 和 ADR；源码以随附 JavaScript 文件为准）。

- 当前且唯一的 Stage：`stages/017-worker-lease/STAGE.md`
- 本用例只生成并登记 Contract，不实现 TASK-017。

# 仓库规则

- 模块 ownership：`internal/api/**` 属于 API 团队，`internal/worker/**` 属于 Worker 团队。
- 新增第三方依赖和修改公共 API 必须先获得人类批准。
- 必须运行：`node --test internal/worker/worker.test.js`（从夹具根目录执行，无第三方依赖）。

# ADR-017：已验证的任务租约

状态：Accepted

- API 边界解析并验证 `lease_timeout_ms`。
- API 创建 `ValidatedLeaseTimeout`；任何下游模块都不得重新验证或规范化 timeout。
- Scheduler 原样透传 `ValidatedLeaseTimeout`。
- Worker 消费该值以停止任务，并以现有的 `ErrLeaseExpired` 拒绝返回的 Promise。
- 公共请求和响应类型保持不变。

# 已批准 Spec：Worker 租约到期

运行中的任务超过已验证租约时间后，Worker 必须取消任务、释放 Worker 本地资源，并以 `ErrLeaseExpired` 拒绝返回的 Promise。租约到期前已经完成的任务必须保持当前行为。

验收条件：

- 一个聚焦的 Worker 测试证明到期后的取消和资源释放。
- 现有 Worker 测试继续通过。
- 公共 API 行为不变。

# TASK-017

在 Worker 中实现租约到期消费逻辑并添加聚焦测试。

验收条件（稳定编号）：

- AC-01：租约到期后取消任务，任务退出后释放本地资源，并以 `ErrLeaseExpired` 拒绝返回的 Promise。
- AC-02：租约到期前正常完成时保持当前返回结果，并释放本地资源。
- AC-03：公共 API 与 timeout validation ownership 保持不变，现有测试继续通过。

源码上下文：

- `internal/worker/worker.js`：类 `Worker`、方法 `Worker.run(signal, timeout, work, release)`；现有实现尚未消费 timeout。
- `internal/worker/worker.test.js`：已有 `run returns the result and releases resources after work completes`；可新增租约到期测试验证 AC-01。
- `internal/api/timeout.js`：`ValidatedLeaseTimeout`、`parseLeaseTimeout`；实例的 `milliseconds` 表示已校验的超时时长，只读。
- `Worker.run` 的签名保持不变；Scheduler 的已合并调用点通过该签名原样传入 validated timeout，无需修改。
- `work` 接受 `AbortSignal` 并响应取消后结束；`release` 为同步回调，必须在 `work` 结束后执行。具体控制流留给执行者。

- 候选编辑范围：`internal/worker/**`（包含实现与测试）。
- 依赖已经合并的 `ValidatedLeaseTimeout` 类型和 Scheduler 透传逻辑。
- 实现将委派给具有写权限的 sub-agent。
