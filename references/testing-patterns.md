# 测试模式参考（基础设施/分布式系统）

基础设施测试模式的快速参考——面向分布式系统、存储引擎和网络组件，示例使用 Go 与 Rust——展示来自 `test-driven-development` 技能的通用原则。这些原则（Arrange-Act-Assert、命名、Mock 纪律、反模式）适用于任何生态系统；此处显示的语法和工具是基础设施领域特定的。在其他技术栈中，遵循相同的原则，使用仓库自身的测试框架和命令。

基础设施测试与业务应用测试的根本区别：被测对象的正确性大多体现在**故障路径**上，而不是 happy path 上。一个存储引擎在一切正常时不丢数据是最低要求；真正的测试是进程在 fsync 中途被杀、网络分区持续十分钟、磁盘返回成功但写入了垃圾数据时，系统是否仍然满足其一致性与持久性承诺。

## 目录

- [测试结构（Arrange-Act-Assert）](#测试结构arrange-act-assert)
- [测试命名约定](#测试命名约定)
- [常见断言](#常见断言)
- [Mock 模式](#mock-模式)
- [故障注入测试](#故障注入测试)
- [一致性与持久性验证](#一致性与持久性验证)
- [压力与 soak 测试](#压力与-soak-测试)
- [确定性模拟测试（deterministic simulation）](#确定性模拟测试deterministic-simulation)
- [集群集成测试](#集群集成测试)
- [测试反模式](#测试反模式)

## 测试结构（Arrange-Act-Assert）

```go
func TestWAL_ReplayAfterCrash_RestoresCommittedEntries(t *testing.T) {
    // Arrange：准备前置状态——写入并 fsync 一批已提交条目
    dir := t.TempDir()
    wal, _ := wal.Open(dir)
    entries := []wal.Entry{{Index: 1, Term: 1, Data: []byte("set x=1")}}
    require.NoError(t, wal.Append(entries))
    require.NoError(t, wal.Sync())
    wal.Close() // 模拟进程退出，未走正常关闭路径

    // Act：执行被测操作——重新打开并 replay
    reopened, err := wal.Open(dir)
    require.NoError(t, err)
    got, err := reopened.Replay()

    // Assert：验证结果——已 fsync 的条目必须完整恢复
    require.NoError(t, err)
    require.Equal(t, entries, got)
}
```

## 测试命名约定

```go
// 模式：Test[单元]_[条件]_[预期行为]
func TestRaftElection_PartitionedLeader_FollowersElectNewLeader(t *testing.T) {}
func TestRaftElection_SplitVote_RetriesWithRandomizedTimeout(t *testing.T) {}
func TestSSTable_ReadAfterCompaction_ReturnsLatestVersion(t *testing.T) {}
func TestConnectionPool_PeerUnreachable_MarksNodeSuspect(t *testing.T) {}

// Rust 中同样使用描述性 snake_case
#[test]
fn log_truncation_after_snapshot_keeps_invariant() {}
#[test]
fn crc_mismatch_on_read_returns_corruption_error_not_garbage() {}
```

## 常见断言

```go
// 相等性（testify）
require.Equal(t, expected, got)        // 值相等；require 失败即中止
assert.NotEqual(t, oldTerm, newTerm)
assert.Len(t, replicas, 3)

// 错误
require.NoError(t, err)
require.ErrorIs(t, err, storage.ErrCorruption)   // 检查错误链
require.ErrorContains(t, err, "checksum mismatch")

// 数值与边界
assert.GreaterOrEqual(t, acked, quorum)
assert.InDelta(t, 0.99, hitRate, 0.01)           // 浮点近似

// 不变量（比单点断言更有价值）
assert.LessOrEqual(t, commitIndex, appliedIndex+1)
assert.True(t, log.IsContiguous())
```

```rust
// Rust 标准断言
assert_eq!(state.committed_term(), 3);
assert_ne!(old_epoch, new_epoch);
assert!(buffer.len() <= page_size);
assert!(matches!(result, Err(Error::Corruption { .. })));
```

**优先断言不变量而非内部状态。** `assert!(commitIndex <= lastLogIndex)` 在重构后仍然成立；断言内部字段的具体值则随实现改动而碎裂。

## Mock 模式

### 接口替换（Go）

```go
// 用接口定义边界，测试中用可控实现替换
type BlockDevice interface {
    WriteAt(p []byte, off int64) (int, error)
    Sync() error
}

// 可控故障设备：记录写入、按脚本注入错误
type flakyDevice struct {
    inner     BlockDevice
    failAfter int // 前 N 次成功后开始失败
    calls     int
}

func (d *flakyDevice) Sync() error {
    d.calls++
    if d.calls > d.failAfter {
        return syscall.EIO
    }
    return d.inner.Sync()
}

func TestLogWriter_SyncFails_MarksSegmentSealed(t *testing.T) {
    dev := &flakyDevice{inner: realDevice, failAfter: 2}
    w := NewLogWriter(dev)
    // 验证第三次 Sync 失败后 writer 拒绝后续写入并上报错误
}
```

### 仅在边界处 Mock

```
Mock 这些：                          不要 Mock 这些：
├── RPC / 网络收发                   ├── 编解码与序列化
├── 磁盘 I/O 与 fsync                ├── 状态机转移逻辑
├── 时钟（单调钟与墙钟）             ├── 校验和 / CRC 计算
├── 随机数源（用 seed 替代）         ├── 内存数据结构
├── 内核事件（epoll/信号，需要时）   ├── 配置解析
└── 对端节点（单节点测试中）         └── 纯函数
```

**Mock 纪律对基础设施有特殊含义：** mock 磁盘时，必须能模拟"写成功但数据损坏""fsync 返回成功但数据没落盘"这类真实硬件行为，而不是只有"成功/失败"两种结果。只模拟 happy path 的 fake 比没有 fake 更糟——它给你虚假的信心。

## 故障注入测试

基础设施系统的核心测试手段。每条关键路径都应有对应的故障变体。

### 杀进程 / 杀节点

```go
// 在关键操作的不同时间点 kill 进程，验证重启后状态正确
func TestCommit_KillBetweenWalSyncAndApply_NoDataLoss(t *testing.T) {
    for _, killPoint := range []string{"after_wal_sync", "after_apply", "after_respond"} {
        t.Run(killPoint, func(t *testing.T) {
            node := startNode(t, withKillPoint(killPoint))
            resp := node.Propose(cmd) // 在指定点 SIGKILL（不是 SIGTERM）
            crashed := restartNode(t, node)
            // 已 ack 的写必须可见；未 ack 的写可出现可不出现，但绝不能部分应用
            assertCommittedStateConsistent(t, crashed, resp)
        })
    }
}
```

要点：

- 用 `SIGKILL` 而非优雅停机——崩溃测试测的是没有 cleanup 的机会。
- 在**每个持久化边界**设置 kill point：WAL 写入前后、fsync 前后、向客户端响应前后。用编译期 failpoint（如 Go 的 `failpoint`、Rust 的 `fail` crate）注入，而不是 sleep。
- 恢复后必须验证：已确认的数据不丢失、未确认的数据不部分可见、序列号/epoch 不回退。

### 网络分区与延迟注入

```bash
# Linux 上用 tc/netem 注入延迟、丢包、乱序
tc qdisc add dev eth0 root netem delay 100ms 20ms distribution normal
tc qdisc change dev eth0 root netem loss 5% reorder 25%

# 用 iptables 制造单向/双向分区
iptables -A OUTPUT -d 10.0.0.3 -j DROP
```

测试代码中优先使用可编程代理（Toxiproxy 或在测试内实现的 fault-injecting proxy），而非直接操作宿主机防火墙——可在 CI 容器内运行、可并行、可精确控制故障的开始与结束：

```go
func TestCluster_MajorityPartition_OldLeaderStepsDown(t *testing.T) {
    cluster := NewTestCluster(t, 5)
    leader := cluster.Leader()
    // 将 leader 与多数派隔离
    cluster.Partition(leader, []NodeID{n3, n4, n5})
    // 少数派一侧不能继续提交新写
    require.Error(t, cluster.ProposeOn(leader, cmd, withTimeout(2*electionTimeout)))
    // 多数派一侧选出新 leader 并继续服务
    newLeader := cluster.WaitLeader([]NodeID{n3, n4, n5})
    require.NotEqual(t, leader, newLeader)
    // 愈合分区后，旧 leader 降为 follower 并补齐日志
    cluster.Heal()
    cluster.WaitConverged()
    assertLogsIdentical(t, cluster.Nodes()...)
}
```

必须覆盖的网络故障剧本：

- 完全分区（双向）、**单向分区**（A 能发给 B，B 回不了 A——最容易漏）
- 高延迟、延迟抖动、丢包、乱序、重复包
- 分区时长跨越多个选举周期
- 分区恰好发生在 leader 刚提交未广播时

### 磁盘慢盘与坏盘模拟

```bash
# dm-delay：注入 I/O 延迟，模拟慢盘
dmsetup create slowdisk --table "0 $SECTORS delay $DEV 0 500"

# dm-flakey：按时间窗口交替返回错误与成功，模拟间歇性故障盘
dmsetup create flakey --table "0 $SECTORS flakey $DEV 0 60 30 1 error_writes"
```

```go
// 用 fake BlockDevice 模拟应用层必须处理的磁盘行为
// ——这些行为真实硬件都会发生：
// 1. 写返回成功，读回来是旧数据（lost write）
// 2. 写返回成功，读回来是垃圾（misdirected/torn write）
// 3. fsync 返回成功但数据没落盘（盘说谎）
// 4. I/O 挂起数分钟不返回（慢盘拖垮整个 IO 线程池）
func TestSSTable_ReadDetectsTornPage_ReturnsCorruption(t *testing.T) {
    dev := &scriptedDevice{corruptPages: map[int64][]byte{4096: garbage(4096)}}
    table := openSSTable(t, dev)
    _, err := table.Get(key)
    // 校验和必须拦截损坏，向上报 Corruption，绝不返回垃圾数据
    require.ErrorIs(t, err, storage.ErrCorruption)
}
```

### 时钟漂移

```go
func TestLease_ClockSkew_DoesNotGrantOverlappingLeases(t *testing.T) {
    clock := clockwork.NewFakeClock()
    server := NewLeaseServer(clock)
    lease1, _ := server.Grant(5 * time.Second)
    // 节点时钟向前跳 3 秒（NTP 校正、VM 暂停恢复都会真实发生）
    clock.Advance(3 * time.Second)
    _, err := server.Grant(5 * time.Second)
    // 旧 lease 未过期前不得发放新 lease
    require.ErrorIs(t, err, ErrLeaseHeld)
    _ = lease1
}
```

规则：

- 一切超时判断用**单调钟（monotonic clock）**，测试中用 fake clock 驱动。
- 墙钟只用于展示与日志；凡是拿墙钟做正确性判断的代码，补一个时钟回拨/跳跃的测试，它大概率会暴露问题。
- 分布式 lease/锁的正确性不能依赖时钟同步假设，除非该假设被显式建模并测试（如 TiKV 的 TSO、Spanner 的 TrueTime 思路）。

## 一致性与持久性验证

### 崩溃恢复点校验

将持久化路径上的每个关键点后设为 kill point，枚举测试。对存储引擎，恢复后按层级校验：

1. **可打开**：crash 后不 panic、能完成 replay。
2. **已提交的不丢**：fsync 确认过的写全部可读。
3. **不部分应用**：一个事务/一批写要么全在，要么全不在。
4. **不读旧值**：读不到任何已被覆盖版本的复活（lost update 回滚）。
5. **元数据自洽**：manifest、epoch、序列号与数据文件互相印证。

```rust
#[test]
fn crash_recovery_satisfies_durability_contract() {
    for point in ["pre_wal", "post_wal_pre_fsync", "post_fsync_pre_manifest", "post_manifest"] {
        let mut sim = CrashSim::new(point);
        let acked = sim.run_workload_until_crash();
        let db = sim.recover();
        // 所有已 ack 的键必须读到最后一次 ack 的值
        for (k, v) in &acked {
            assert_eq!(db.get(k).unwrap(), Some(v.clone()), "lost acked write at {point}");
        }
        assert!(db.verify_manifest_consistency());
    }
}
```

### Jepsen 式线性一致性检查

不自己证明正确，而是**收集历史、交给检查器判定**：

1. **生成负载**：并发的读/写/CAS 操作，随机并发度与网络故障交织。
2. **记录历史**：每个操作记录 `invoke` 与 `ok/fail` 时间戳及返回值——并发操作按实时序（real-time order）约束。
3. **运行检查器**：用 Knossos、Porcupine（Go）或 Elle 判定该历史是否存在满足线性一致性的合法排序；Elle 还能找出最小异常环。
4. **失败即 bug**：历史不可线性化 = 系统违反了它声称的一致性模型，没有"测试误报"这一说。

```go
// 历史条目
type Op struct {
    Process int
    Type    OpType // invoke / ok / fail
    Fn      string // read / write / cas
    Value   interface{}
    Time    int64
}

// 用 Porcupine 判定
model := porcupine.Model{ /* read/write 的合法转移定义 */ }
ok := porcupine.CheckOperations(model, history)
// ok == false 时输出不可线性化的反例历史
```

适用模型按系统承诺选择：线性一致性 register、顺序一致性、可串行化事务。系统承诺什么就检查什么——承诺 snapshot isolation 却用可串行化模型检查会满屏误报，反之则是漏报。

## 压力与 soak 测试

单元测试抓不到的缺陷类型——泄漏、竞态窗口、慢路径退化——只能靠长时间运行暴露。

```go
// 压力测试骨架：真实负载特征 + 资源监控 + 周期性不变量校验
func TestCluster_Soak_2h_UnderMixedWorkload(t *testing.T) {
    if testing.Short() {
        t.Skip("soak 测试仅在 nightly 运行")
    }
    cluster := NewTestCluster(t, 5)
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Hour)
    defer cancel()

    go cluster.RunWorkload(ctx, mixed(70, 25, 5)) // 70% 读 25% 写 5% 删除
    go cluster.ChaosMonkey(ctx, every(5*time.Minute)) // 周期性杀节点/分区/限速
    go cluster.AssertInvariants(ctx, every(10*time.Second)) // 持续校验，不是最后才校验

    <-ctx.Done()
    stats := cluster.Stats()
    // 无 goroutine 泄漏
    require.Less(t, runtime.NumGoroutine(), baseline+100)
    // 内存稳定，不随时间增长
    require.Less(t, growthRate(stats.HeapSamples), 0.01)
    // p99 延迟没有随运行时长退化
    require.Less(t, stats.P99Last10Min, 2*stats.P99First10Min)
}
```

必须监控并断言的指标：

- **内存与句柄**：RSS、堆增长率、文件描述符数、goroutine/线程数——任何随时间单调上涨即为泄漏。
- **延迟分布**：p50/p99/p999，且比较**测试开头与结尾**的分布——很多退化（compaction 债务、碎片化）只在运行数小时后出现。
- **磁盘**：写放大、空间放大、compaction 积压。
- **日志**：错误/重试率基线之外的毛刺，哪怕最终都成功了。

安排方式：压力/soak 测试进 nightly 流水线而非 PR 门控；PR 门控用 5–10 分钟的缩小版。所有 soak 测试必须在结束时 dump 完整指标，失败时能从指标里定位退化起始点。

## 确定性模拟测试（deterministic simulation）

把系统的所有不确定性来源——网络、时钟、磁盘、调度、随机数——抽象为接口，测试时替换为**由单个 seed 驱动的确定性模拟器**。这是 FoundationDB 验证其数据库的方式，也是捕获分布式竞态的最强手段。

```
真实环境                          模拟环境
├── epoll / socket               ├── 模拟网络：消息队列 + 可控丢包/乱序/延迟
├── monotonic clock              ├── 虚拟时钟：只在无事件时推进
├── 磁盘 I/O                     ├── 模拟磁盘：可控延迟/故障/崩溃点
├── rand                         ├── seed 化的 PRNG
└── OS 线程调度                  └── 单线程协作式调度
```

```rust
#[test]
fn distributed_protocol_never_violates_safety_across_10k_seeds() {
    for seed in 0..10_000 {
        let mut sim = Sim::new(seed); // 同 seed 完全复现
        sim.spawn_nodes(5);
        sim.set_fault_profile(FaultProfile::WAN { loss: 0.01, reorder: true });
        sim.client().run_random_ops(500);
        while sim.step() {
            sim.assert_safety_invariants(); // 每个事件后校验，不是最后
        }
        // 失败时 seed 直接可复现：cargo test -- <seed>
    }
}
```

纪律要求：

- **一切不确定性走模拟接口**。代码里出现一次 `rand::random()`、`SystemTime::now()`、裸 `socket`，该 seed 的确定性就被破坏。用 CI lint 禁止业务代码直接调用这些 API。
- 失败必须能用 seed 一键复现并回放（记录事件序列到文件）。
- 每晚跑数万 seed；发现一个失败 seed 就把它固化成回归测试。
- 模拟网络要支持真实网络的全部恶意行为：丢包、重复、乱序、任意延迟、分区。模拟磁盘要支持前文列出的全部磁盘谎言。

## 集群集成测试

真实二进制、真实网络（localhost 多实例或容器编排）、真实存储介质的端到端验证。数量要少、覆盖系统级承诺：

```go
func TestCluster_RollingUpgrade_PreservesAvailability(t *testing.T) {
    cluster := NewBinaryCluster(t, 3, withVersion("v1.4"))
    require.NoError(t, cluster.Start())
    stop := cluster.StartWorkload(t, 100) // 100 ops/s 持续读写

    // 逐节点滚动升级到当前构建版本
    for _, node := range cluster.Nodes() {
        cluster.Replace(node, withBinary(currentBuild))
        cluster.WaitHealthy(node)
        // 升级全程可用性不跌破 SLO
        require.Greater(t, cluster.SuccessRate(), 0.999)
    }
    stop()
    // 升级期间无已确认数据丢失
    require.Empty(t, cluster.AckedButLost())
}
```

适合在这里测的：滚动升级与降级、跨版本兼容、备份恢复、节点替换、扩缩容、配置热更新。不适合在这里测的：单组件逻辑（那是单元测试）、穷举故障组合（那是模拟测试）。

## 测试反模式

| 反模式 | 问题 | 更好的方法 |
|---|---|---|
| 用 `sleep` 等待收敛 | 慢 CI 上假失败，快机器上浪费分钟级时间 | 轮询条件 + 超时：`require.Eventually` |
| 硬编码端口 | 并行测试互相踩端口 | 端口传 0 让内核分配，读回实际端口 |
| 只在 happy path 断言持久性 | 崩溃路径从不被验证 | 枚举 kill point，见"崩溃恢复点校验" |
| fake 磁盘只模拟成功/失败 | 漏掉 lost write、torn write 等真实故障 | fake 必须能模拟磁盘谎言 |
| 用墙钟判断超时/lease | NTP 校正、VM 暂停导致假阳性 | 单调钟 + fake clock 驱动测试 |
| 一致性靠"跑一遍看看没报错" | 没有判定标准，等于没测 | 记录历史 + 线性一致性检查器 |
| 失败就重试 CI 直到绿 | flaky 测试掩盖真实竞态 | 隔离调查；分布式竞态的 flaky 几乎都是真 bug |
| 共享集群状态不清理 | 测试顺序依赖，互相污染 | 每个用例独立集群/`t.TempDir()` |
| 压力测试只看"没崩" | 泄漏与延迟退化漏网 | 断言内存/延迟/句柄指标趋势 |
| 模拟代码用真随机/真时钟 | 失败不可复现 | 全量 seed 化，失败可回放 |
| 断言内部状态细节 | 重构时大面积破坏 | 断言不变量与外部可观察行为 |
