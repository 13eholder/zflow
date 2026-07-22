---
name: performance-optimization
description: 优化分布式系统、存储引擎和网络服务的性能。当存在延迟或吞吐需求、怀疑性能回归、p99/p999 尾延迟或 IOPS 需要改进、读写放大需要收敛，或分析揭示了瓶颈时使用。当服务越来越慢需要 profile 并提速、需要用 fio 等压测工具调优队列深度、或排查 RPC 延迟尖峰、重试风暴、网络重传时使用。
---

# 性能优化

## 概述

优化前先测量。没有测量的性能工作是猜测——而猜测会导致过早优化，增加复杂度却不改善真正重要的东西。先分析，识别实际瓶颈，修复它，再次测量。只优化测量证明重要的东西。

## 何时使用

- 规格中存在性能需求（p99 延迟预算、吞吐 SLA、IOPS 目标）
- 监控或用户报告了缓慢行为（尾延迟尖峰、吞吐下降）
- p99/p999 延迟超出阈值，或 IOPS/吞吐低于容量基线
- 你怀疑某个变更引入了回归（内核升级、参数变更、发布新版本）
- 构建处理大数据集或高并发的功能

**何时不使用：** 在你没有证据证明有问题之前不要优化。过早优化增加的复杂度比它获得的性能代价更高。

## 关键指标目标

| 指标 | 良好 | 需要改进 | 差 |
|--------|------|-------------------|------|
| **p99 延迟**（在线请求路径） | ≤ 目标的 2× 平均值 | ≤ 5× 平均值 | > 5× 平均值 |
| **p999 延迟**（尾部） | ≤ 10× 平均值 | ≤ 50× 平均值 | > 50× 平均值 |
| **IOPS / 吞吐** | ≥ 容量基线的 70% | ≥ 50% | < 50% |
| **写放大 / 读放大** | ≤ 2 | ≤ 5 | > 5 |
| **网络重传率** | < 0.01% | < 0.1% | ≥ 0.1% |

注意：具体阈值必须来自你所在系统的 SLO 和容量基线，上表只是量级参考。不要拿 SSD 的延迟标准去衡量 HDD 或远端存储。

## 优化工作流

```
1. 测量  → 使用真实负载建立基准
2. 识别  → 找到实际瓶颈（非假设的）
3. 修复  → 解决具体瓶颈
4. 验证  → 再次测量，确认改进
5. 防护  → 添加监控或测试以防止回归
```

### 步骤 1：测量

两种互补方法——两者都使用：

- **受控压测（fio、iperf3、自研负载发生器）：** 可复现、可隔离变量。最适合回归检测和隔离特定问题。fio 必须明确 job 参数（iodepth、bs、rw、direct、numjobs），否则结果不可比。
- **生产观测（iostat、sar、ss、prometheus 指标、bpftrace/bcc）：** 真实负载下的真实数据。验证修复是否实际上改善了线上表现所必需的。

**存储与 IO：**
```bash
# 块设备延迟与队列
iostat -x 1                     # 关注 await、aqu-sz、%util
sar -d 1                        # 按设备的历史 IO 统计

# 受控基准：随机读、direct IO、iodepth=32
fio --name=randread --rw=randread --bs=4k --iodepth=32 \
    --direct=1 --size=10G --runtime=60 --time_based

# 块层延迟分布（分位数直方图，定位慢盘）
bpftrace -e 'tracepoint:block:block_rq_complete { @usecs = hist(args->rwbs); }'
biolatency 1                    # bcc：块 IO 延迟直方图
```

**CPU 与等待：**
```bash
# 找热点函数
perf top
perf record -g -- <pid> && perf report

# on-CPU 不忙但请求慢 → 分析 off-CPU 时间（锁、IO、调度等待）
offcputime -p <pid> 5           # bcc：off-CPU 栈统计
```

**网络：**
```bash
# RTT、重传、拥塞窗口
ss -ti                          # 每条 TCP 连接的 rtt/retrans/cwnd
sar -n TCP,ETCP 1               # 重传率、连接速率
nstat -az | grep -i retrans     # 重传计数器

# 带宽与延迟基准
iperf3 -c <peer>                # 吞吐
ping -c 100 <peer>              # RTT 基线
```

**应用层：**
```bash
# 在关键路径打点：p50/p99/p999 直方图，不是平均值
# 分布式追踪：定位请求在哪个 RPC 跳上耗时
# 磁盘/网卡/NUMA 拓扑：numactl --hardware、lstopo
```

### 从哪里开始测量

使用症状来决定首先测量什么：

```
什么慢？
├── 存储延迟高 / IOPS 不达标
│   ├── 单盘慢？ --> biolatency/iostat 看该盘 await 分布，对比同型号盘（慢盘检测）
│   ├── 队列深度不够？ --> 检查 iodepth、应用并发 IO 数、块设备 nr_requests
│   ├── 同步写慢？ --> 检查 fsync 频率、是否启用组提交（group commit）、WAL 刷盘模式
│   └── 绕过 page cache 的怀疑？ --> 确认 direct IO 是否真正生效，检查 buffered IO 回填
├── 网络路径慢
│   ├── RTT 高？ --> ping/iperf3 定位链路；确认是否跨机房/跨可用区
│   ├── 重传/丢包？ --> ss -ti 看 retrans，nstat 计数器，检查网卡丢包 ethtool -S
│   └── 带宽打满？ --> sar -n DEV、iftop，确认是否达到网卡线速
├── 分布式调用慢
│   ├── 关键路径上有串行 RPC？ --> 分布式追踪瀑布图，能并行的并行化
│   ├── 间歇性尖峰？ --> 检查重试风暴（重试×扇出放大）、超时设置级联、GC 暂停
│   └── 跨节点慢？ --> 检查 NUMA 亲和性、CPU 绑定、中断亲和（IRQ affinity）
└── CPU / 内存
    ├── sys 态高？ --> perf top 看内核态热点（锁、缺页、网络栈）
    ├── 缺页/缺 cache？ --> perf stat 看 IPC、LLC miss；检查大页（THP）
    └── 远端内存访问？ --> numastat 看跨 NUMA 访问比例，绑核绑内存
```

### 步骤 2：识别瓶颈

按类别的常见瓶颈：

**存储 / IO 路径：**

| 症状 | 可能原因 | 调查方法 |
|---------|-------------|---------------|
| 写延迟尖峰 | fsync 过频、组提交未生效、WAL 设备慢 | strace 统计 fsync 次数、biolatency 看 WAL 盘 |
| IOPS 远低于盘标称 | 队列深度不足、随机小 IO、未用 direct IO | iostat 看 aqu-sz、fio 复现实测上限 |
| 读放大高 | LSM 层数过多、缓存命中率低、预读过度 | 引擎内部指标（rocksdb stats）、缓存命中率 |
| 写放大高 | LSM compaction 频繁、日志重复写 | 引擎 compaction 统计、对比应用写入量与设备写入量 |
| 少数盘拖慢整体 | 慢盘（slow disk）、坏块重试 | biolatency 按盘对比、smartctl |

**网络 / 分布式：**

| 症状 | 可能原因 | 调查方法 |
|---------|-------------|---------------|
| p999 尖峰 | 重试风暴、TCP 重传、队头阻塞 | ss -ti、追踪超时与重试日志 |
| 吞吐上不去 | 单连接串行、窗口太小、跨机房 RTT | iperf3、ss -ti 看 cwnd |
| 延迟抖动 | NUMA 跨节点访问、中断未绑定、GC 暂停 | numastat、/proc/interrupts、GC 日志 |
| 扇出请求慢 | 关键路径串行 RPC、同步等待全部副本 | 分布式追踪瀑布图 |

### 步骤 3：修复常见反模式

#### 关键路径上的串行 RPC（分布式）

```go
// 坏：串行 —— 总延迟 = 三次 RTT 之和
meta := getMeta(ctx, key)
data := getData(ctx, key)
index := getIndex(ctx, key)

// 好：无依赖的调用并行化 —— 总延迟 ≈ 最慢的一次
g, ctx := errgroup.WithContext(ctx)
var meta Meta; var data Data; var index Index
g.Go(func() error { var err error; meta, err = getMeta(ctx, key); return err })
g.Go(func() error { var err error; data, err = getData(ctx, key); return err })
g.Go(func() error { var err error; index, err = getIndex(ctx, key); return err })
if err := g.Wait(); err != nil { return err }
```

#### fsync 过频 / 缺少组提交（存储）

```go
// 坏：每条日志写都 fsync —— 吞吐被盘延迟钉死
for _, entry := range entries {
    wal.Write(entry)
    wal.Sync() // 每次一次刷盘
}

// 好：组提交 —— 攒批或按时间窗合并刷盘，
// 吞吐不再等于 1/盘延迟，同时不牺牲单条可见性语义
for _, entry := range entries {
    wal.Write(entry)            // 追加到内存缓冲区 + 页缓存
}
wal.GroupCommit(5 * time.Millisecond) // 后台协程按窗口统一 fsync
```

#### 队列深度不足 / 错误的 IO 模式

```bash
# 坏：iodepth=1 的同步小 IO —— NVMe 只能发挥个位数百分比
fio --name=x --rw=randread --bs=4k --iodepth=1 --direct=1

# 好：足够的队列深度与并发，才测得出设备真实上限
fio --name=x --rw=randread --bs=4k --iodepth=64 --numjobs=4 --direct=1
```

应用层同理：单线程同步读写换成批量、异步提交（io_uring）、或用户态轮询（SPDK）。注意：io_uring/SPDK 是手段不是目的，先用 perf/biolatency 证明瓶颈在内核 IO 路径开销再上。

#### NUMA 亲和性缺失

```bash
# 坏：进程漂移跨 NUMA 节点访问远端内存
# numastat -p <pid> 显示大量 remote node 内存

# 好：绑核 + 本地内存分配
numactl --cpunodebind=0 --membind=0 ./storage-server

# 网卡中断绑到本地节点
echo <local-node-cpus> > /proc/irq/<irq>/smp_affinity_list
```

#### 无界重试 / 重试风暴

```go
// 坏：每层都重试，无上限、无退避 —— 下游抖动被放大成雪崩
for {
    if err := call(); err == nil { break }
}

// 好：有限重试 + 指数退避 + 抖动，且只在单层重试
err := retry.Do(ctx, retry.WithMaxAttempts(3),
    retry.WithBackoff(retry.Exponential(100*time.Millisecond)),
    retry.WithJitter(0.2), func(ctx context.Context) error {
        return call(ctx)
    })
```

## 性能预算

设定预算并强制执行：

```
请求 p99 延迟：< 50ms（在线读路径）
请求 p999 延迟：< 200ms
单盘 IOPS：≥ 厂商标称随机读的 70%（fio 验证）
写放大：≤ 2（应用写入量 vs 设备写入量）
网络重传率：< 0.01%
跨 NUMA 内存访问：< 10%
慢盘比例：0（biolatency 长尾盘下线）
```

**在 CI / 例行巡检中强制执行：**
```bash
# 存储基准回归：固定 fio job 文件，定期跑并对比历史基线
fio baseline_randread.fio --output=result.json --output-format=json

# 网络基准回归
iperf3 -c <fixed-peer> --json > result.json

# 慢盘巡检：按盘延迟分布对比，长尾盘告警
biolatency 60 1
```

## 参见

有关详细的性能检查清单、优化命令和反模式参考，参见 `references/performance-checklist.md`。

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| "平均延迟正常，没问题" | 平均值掩盖尾部。用户感受到的是 p99/p999，一个慢盘或一次重传就足以让平均值纹丝不动、尾部爆炸。看分位数直方图。 |
| "加机器就能解决" | 水平扩展解决不了单机瓶颈：锁竞争、fsync 延迟、串行关键路径、NUMA 远端访问都不会因为多几台机器而消失，只会更贵。 |
| "重启就好了" | 重启掩盖了症状，根因（泄漏、慢盘、重试风暴）还在。下次复发时你连现场都没有。先抓数据再重启。 |
| "这个参数调大肯定更快" | 没有基准就调参是赌博。队列深度、缓冲区、线程数都有拐点，过了拐点反而更差（队头阻塞、上下文切换、内存压力）。一次只改一个变量，改完重新测量。 |
| "在我机器上压测很快" | 你的笔记本不是生产环境。用代表性硬件、拓扑（NUMA、跨机房 RTT）和真实负载分布压测。 |
| "我们以后优化" | 性能债务会累积。现在就修复明显的反模式（串行 RPC、无退避重试、fsync 过频），推迟微优化。 |

## 红旗警告

- 只报告平均延迟，没有 p99/p999 分位数
- 没有基准数据就修改内核参数、IO 调度器或引擎配置
- 优化后没有前后对比数据（同一负载、同一硬件、同一指标）
- 一次改动同时调整多个变量，无法归因
- 关键路径上存在串行的独立 RPC
- 重试没有上限、没有退避和抖动
- 每写必 fsync，或反之——该持久化的写从未 fsync
- fio 结果没有记录 job 参数（iodepth、bs、direct、numjobs），无法复现
- 生产环境没有 biolatency/iostat 级别的慢盘观测

## 验证

任何与性能相关的变更之后：

- [ ] 存在前后测量数据（具体数字，同一负载同一硬件）
- [ ] 对比的是 p99/p999 分位数，不只是平均值
- [ ] 具体瓶颈已被识别和处理（有分析数据支撑，不是猜测）
- [ ] 一次只改了一个变量，改进可归因
- [ ] 写入路径的持久性语义没有被削弱（fsync/组提交行为仍符合要求）
- [ ] 性能预算在基准回归中通过（fio/iperf3 基线对比）
- [ ] 现有测试仍然通过（优化没有破坏行为）
