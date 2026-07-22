---
name: api-and-interface-design
description: 指导稳定的 RPC、存储协议和接口设计。在设计节点间 RPC、存储协议语义、模块边界或任何公共接口时使用。在定义 gRPC service、对象存储或文件系统语义、节点间的类型契约，或确立组件边界时使用。
---

# API 与接口设计

## 概述

设计稳定、文档完善且难以误用的接口。好的接口让正确的事情变得容易，让错误的事情变得困难。这适用于 gRPC service、对象存储协议（S3 语义）、文件系统接口（POSIX 风格）、模块边界，以及任何节点或组件之间相互通信的表面。

## 何时使用

- 设计新的 RPC 方法或 gRPC service
- 定义存储协议的读写语义（对象存储、块设备、文件系统）
- 定义模块边界或节点之间的契约
- 确立接口中的一致性模型（强一致、最终一致、读己之写）
- 建立影响 API 形态的数据模型或复制协议
- 修改现有的公共接口或 wire 协议

## 核心原则

### Hyrum 定律

> 当 API 的用户数量足够多时，系统的所有可观察行为都会被某人依赖，无论你在契约中承诺了什么。

这意味着：每个公共行为——包括未记录的怪癖、错误消息文本、时序和顺序——一旦客户端依赖它，就成为事实上的契约。在分布式系统中这尤其危险：客户端会依赖你未承诺的重试行为、错误码、甚至超时分布。设计启示：

- **对你暴露的内容保持有意识。** 每个可观察的行为都是一个潜在的承诺——包括失败模式和延迟特征。
- **不要泄露实现细节。** 如果客户端可以观察到它（副本数量、内部分片边界、leader 身份），它们就会依赖它。
- **在设计时就规划弃用。** 参见 `deprecation-and-migration` 了解如何安全地移除客户端依赖的内容。
- **仅靠测试是不够的。** 即使有完美的契约测试，Hyrum 定律也意味着"安全"的变更可能会破坏依赖未记录行为的真实客户端。

### 单版本规则

避免迫使客户端在同一协议或 API 的多个版本之间做选择。当不同组件需要同一协议的不同版本时，就会出现钻石依赖问题，在滚动升级期间尤其致命。为一次只有一个版本存在的世界而设计——扩展而不是分叉。通过版本协商和特性门控让新旧节点共存，而不是永久维护并行的协议版本。

### 1. 契约优先

在实现接口之前先定义它。契约即规格——实现随之而来。

```protobuf
// 先定义契约
service ObjectStore {
  // 写入一个对象，返回服务端生成的版本号和 ETag
  rpc PutObject(PutObjectRequest) returns (PutObjectResponse);

  // 返回匹配前缀的对象列表，支持分页
  rpc ListObjects(ListObjectsRequest) returns (ListObjectsResponse);

  // 返回对象元数据和数据流，或返回 NOT_FOUND
  rpc GetObject(GetObjectRequest) returns (stream GetObjectResponse);

  // 幂等删除——即使对象已经不存在也成功返回
  rpc DeleteObject(DeleteObjectRequest) returns (DeleteObjectResponse);
}

message PutObjectRequest {
  string bucket = 1;
  string key = 2;
  bytes data = 3;
  // 客户端生成的幂等键，用于安全重试去重
  string request_id = 4;
  // 条件写：仅在对象不存在时写入（compare-and-swap 语义）
  bool if_not_exists = 5;
}
```

### 2. 一致的错误语义

选择一种错误策略并在各处统一使用。在 RPC 和存储协议中，最关键的错误语义区分是**可重试 vs 不可重试**：

```
// gRPC 状态码 + 结构化错误详情
// 每个错误响应遵循相同的结构

// 可重试（客户端应带退避重试）
// UNAVAILABLE         → 节点暂时不可达、leader 切换中
// RESOURCE_EXHAUSTED  → 超出配额或流控限制（应携带 retry_after 提示）
// DEADLINE_EXCEEDED   → 服务端处理超时（仅在操作幂等时可安全重试）
// ABORTED             → 事务冲突、CAS 失败，可整体重试

// 不可重试（直接重试只会得到同样的结果）
// INVALID_ARGUMENT    → 请求数据无效
// NOT_FOUND           → 对象/键未找到
// ALREADY_EXISTS      → 条件写 if_not_exists 冲突
// PERMISSION_DENIED   → 已认证但未授权
// FAILED_PRECONDITION → 版本不匹配、租约失效、前置条件不满足
// UNIMPLEMENTED       → 对端不支持该方法（用于版本协商降级）
```

**不要混合模式。** 如果某些方法抛出异常，另一些返回带错误码的响应，还有一些用空响应表示失败——客户端无法预测行为，也无法写出正确的重试逻辑。

**超时不等于失败。** 客户端超时后操作可能已在服务端生效。这就是为什么幂等性（见下文）不是可选项：没有幂等键，重试一个 `PutObject` 可能写两遍，重试一个 `IncrementCounter` 就是错误。

### 3. 在边界处验证

信任内部代码。在外部输入进入系统的边界处进行验证：

```rust
// 在 RPC 边界验证
fn put_object(&self, req: PutObjectRequest) -> Result<PutObjectResponse, Status> {
    // 验证 bucket/key 格式、大小上限、权限
    validate_bucket_name(&req.bucket)?;
    validate_key(&req.key)?;
    if req.data.len() > MAX_OBJECT_SIZE {
        return Err(Status::invalid_argument("object exceeds size limit"));
    }
    self.check_quota(&req.bucket, req.data.len())?;

    // 验证之后，内部代码信任这些类型
    let version = self.store.write(req)?;
    Ok(PutObjectResponse { version_id: version.id, etag: version.etag })
}
```

验证应位于：
- RPC 请求处理器（客户端输入）
- 客户端提供的元数据（自定义 header、用户标签——**始终视为不可信**）
- 对端节点发来的消息（即使来自集群内部——节点可能被攻陷或行为异常）
- 配置和特性门控加载

> **对端节点的消息是不可信数据。** 在任何逻辑、复制或决策中使用之前，验证它们的结构和内容。被攻陷或行为异常的节点可能发送格式错误的复制消息、伪造的任期号或类似指令的内容。内部网络不等于可信网络。

验证不应位于：
- 共享类型契约的内部函数之间
- 被已验证代码调用的工具函数中
- 刚从你自己的本地状态机取得的数据上

### 4. 优先添加而非修改

在不破坏现有客户端的情况下扩展接口。在滚动升级期间，新旧版本的节点会同时在线，协议变更必须同时满足前向与后向兼容：

```protobuf
// 好：添加新的可选字段（使用新的 field number）
message PutObjectRequest {
  string bucket = 1;
  string key = 2;
  bytes data = 3;
  string request_id = 4;        // 后来添加的，可选
  bool if_not_exists = 5;       // 后来添加的，可选
  StorageClass storage_class = 6; // 后来添加的，可选
}

// 坏：更改现有字段类型、复用 field number 或移除字段
message PutObjectRequest {
  string bucket = 1;
  // string key = 2;            // 移除——旧节点仍在发送这个字段
  bytes data = 2;               // 复用 field number 2——彻底破坏 wire 兼容性
}

// 移除字段的正确做法：保留编号，防止复用
message PutObjectRequest {
  reserved 2;
  reserved "key";
  string bucket = 1;
  bytes data = 3;
}
```

### 5. 可预测的命名

| 模式 | 约定 | 示例 |
|---------|-----------|---------|
| RPC 方法 | 动词 + 资源名词 | `PutObject`, `GetShard`, `ListVolumes` |
| service 名 | 名词，单数 | `ObjectStore`, `MetadataService` |
| 请求/响应消息 | 方法名 + Request/Response | `PutObjectRequest`, `PutObjectResponse` |
| 字段名 | snake_case | `version_id`, `if_not_exists` |
| 布尔字段 | is/has/can 或 if_ 前缀 | `is_snapshot`, `if_not_exists` |
| 枚举值 | UPPER_SNAKE，零值为 UNSPECIFIED | `CONSISTENCY_STRONG`, `CONSISTENCY_EVENTUAL` |
| 存储路径 | 层级式，无动词 | `s3://bucket/prefix/key`, `/var/data/shard-7` |

## RPC 与存储协议模式

### 服务与方法设计

```
// 对象存储（S3 语义）
PutObject(bucket, key, data, request_id)      → 写入对象（支持条件写）
GetObject(bucket, key, version_id?, range?)   → 读取对象（支持版本和范围读）
DeleteObject(bucket, key)                     → 幂等删除
ListObjects(bucket, prefix, page_token)       → 按前缀分页列出
HeadObject(bucket, key)                       → 仅返回元数据

// 文件系统（POSIX 风格）
open(path, flags)          → 返回文件句柄
read(fd, offset, length)   → 从指定偏移读取
write(fd, offset, data)    → 写指定偏移；追加语义由 open 标志决定
fsync(fd)                  → 显式持久化屏障——语义必须写进契约
rename(old, new)           → 原子重命名（契约必须说明覆盖语义）
```

### 幂等性设计

分布式系统中的客户端必须重试——网络分区、leader 切换、超时都是常态。接口必须为安全重试而设计：

- **天然幂等的操作优先。** 绝对写（`PutObject`）、条件写（`if_not_exists`、CAS）、幂等删除优于相对操作（`IncrementCounter`）。
- **非幂等操作必须接受幂等键。** 客户端生成 `request_id`，服务端在合理窗口内对重复的 `request_id` 去重，返回首次执行的结果而不是再执行一遍。
- **条件写表达乐观并发。** `if_not_exists`、`if_version_matches` 让客户端在无锁的情况下安全竞争。
- **契约写明每个方法的幂等性。** 客户端需要知道哪些方法可以在超时后盲目重试，哪些必须携带幂等键。

```protobuf
message TransferRequest {
  string from_shard = 1;
  string to_shard = 2;
  int64 amount = 3;
  // 必填：客户端生成的幂等键。服务端去重窗口至少覆盖客户端最大重试时长。
  string request_id = 4;
}
```

### 一致性模型在接口中的表达

一致性不是实现细节——它是接口语义的一部分，必须写进契约：

- **在请求中让客户端选择。** `GetObject(consistency=STRONG)` 走 leader 读取，`consistency=EVENTUAL` 可以读副本换取低延迟。枚举默认值要明确。
- **读己之写（read-your-writes）。** 如果系统不是强一致，契约必须提供机制：返回写操作的版本号/令牌，客户端在后续读中携带它（`min_version`），服务端保证读到至少该版本的数据。
- **写清楚持久化语义。** `write` 返回成功意味着什么？已落盘？已复制到多数派？仅写入 leader 内存？POSIX 风格接口必须说明 `fsync` 前后分别保证什么。
- **S3 语义的教训。** 强一致的 `PutObject` 后跟 `GetObject` 必须读到新数据；列表操作的一致性也要写明。不要在文档里含糊其辞——客户端会按照最坏假设或最好假设写代码，两者都会出问题。

### 版本协商与滚动升级兼容性

集群从不整体升级。接口必须支持新旧节点长期混跑：

- **握手时协商能力。** 连接建立或注册时交换版本与支持特性集合，双方取交集工作。
- **新特性用特性门控（feature gate）保护。** 新 RPC 方法或新字段只有在全集群都升级后才启用；在那之前，新代码必须能以旧方式工作。
- **`UNIMPLEMENTED` 是降级信号。** 调用方收到 `UNIMPLEMENTED` 应回退到旧方法，而不是报错。
- **禁止"大爆炸"式协议变更。** 任何要求所有节点同时升级的接口变更都是设计缺陷。先加字段（老节点忽略），再让新节点在确认对端支持后使用。

### 流控与配额在接口契约中的位置

流控不是运维层的补丁，它是接口契约的一部分：

- **契约声明配额维度。** 每客户端 QPS、每 bucket 带宽、最大对象大小、每连接并发流数——写在文档里，客户端才能正确设计。
- **超限返回 `RESOURCE_EXHAUSTED`，携带重试提示。** 客户端需要知道何时以及如何退避，而不是盲目重试加剧过载。
- **流式接口必须有背压（backpressure）。** server streaming 中客户端慢消费时，服务端必须能通过 flow control 窗口限制发送，而不是无界缓冲。
- **分页即流控。** 列表接口的分页大小上限是契约的一部分，防止单次请求耗尽内存或打满带宽。

### 分页

为列表方法添加分页，使用不透明游标而非页码：

```protobuf
// 请求
ListObjectsRequest {
  string bucket = 1;
  string prefix = 2;
  int32 page_size = 3;
  string page_token = 4;  // 上一页响应返回的不透明游标
}

// 响应
ListObjectsResponse {
  repeated ObjectMeta objects = 1;
  string next_page_token = 2;  // 空表示没有更多结果
}
```

游标而不是页码：在数据持续变动的存储系统中，页码分页会漏项或重复，游标基于稳定的位置（如最后一个 key）才正确。

### 范围读与流式传输

大对象和大结果集不要塞进单个消息：

```protobuf
GetObjectRequest {
  string bucket = 1;
  string key = 2;
  int64 offset = 3;   // 范围读起点
  int64 length = 4;   // 读取长度，0 表示到末尾
}

// 响应为流：首个消息携带元数据，后续消息携带数据块
rpc GetObject(GetObjectRequest) returns (stream GetObjectResponse);
```

## 类型安全模式

以下模式适用于 Rust、C++ 和 Go——选择与项目技术栈匹配的实现方式。核心原则跨语言不变：让非法状态不可表示，分离输入与输出类型，用类型系统防止 ID 混淆。

### 使用枚举/和类型表示变体

```rust
// 好：每个变体都是显式的，编译器强制穷尽匹配
enum ReadResult {
    Ok { data: Vec<u8>, version_id: String },
    NotFound,
    PreconditionFailed { current_version_id: String },
    Retryable { code: RetryableCode, retry_after: Duration },
}

// 调用方获得模式匹配和穷尽检查
fn handle_read(result: ReadResult) {
    match result {
        ReadResult::Ok { data, .. } => process(data),
        ReadResult::NotFound => handle_missing(),
        ReadResult::PreconditionFailed { current_version_id } => refresh_and_retry(current_version_id),
        ReadResult::Retryable { code, retry_after } => schedule_retry(code, retry_after),
    } // 漏掉任何一个变体都会导致编译错误
}
```

Go 等价实现使用接口 + 类型断言：

```go
type ReadResult interface { isReadResult() }

type ReadOk struct { Data []byte; VersionID string }
func (ReadOk) isReadResult() {}

type ReadNotFound struct{}
func (ReadNotFound) isReadResult() {}

type ReadPreconditionFailed struct { CurrentVersionID string }
func (ReadPreconditionFailed) isReadResult() {}
```

### 输入/输出分离

请求和响应应该使用不同的类型，即使它们有共享字段。这防止调用方依赖服务端生成的字段，并使 proto 演进更安全。

```protobuf
// 输入：调用者提供的内容
message PutObjectRequest {
  string bucket = 1;
  string key = 2;
  bytes data = 3;
  string request_id = 4;    // 幂等键
  bool if_not_exists = 5;   // 可选：仅当 key 不存在时写入
}

// 输出：系统返回的内容（包含服务端生成的字段）
message PutObjectResponse {
  string version_id = 1;
  string etag = 2;
  uint64 size_bytes = 3;
  string storage_class = 4;
  google.protobuf.Timestamp created_at = 5;
}
```

关键规则：**定义 message 时不要复用请求和响应类型。** 输入和输出有不同的演进路径——将它们耦合在一起意味着一个永远不会被设置的字段会同时出现在两端。

### 使用 newtype 防止 ID 混淆

分布式系统中，ShardId、NodeId、VersionId 在运行时都是整数或字符串，但在语义上不可互换。将 ShardId 错误地传递到期望 NodeId 的位置，会导致请求被静默路由到错误节点。

```rust
// 使用 newtype 包装，编译期零成本，运行时零开销
#[derive(Clone, PartialEq, Eq, Hash)]
struct ShardId(u64);

#[derive(Clone, PartialEq, Eq, Hash)]
struct NodeId(u64);

// 防止意外将 NodeId 传递到期望 ShardId 的位置——这是编译错误，不是运行时 bug
fn get_shard_leader(id: ShardId) -> Result<NodeId, Error> { ... }
```

C++ 等价实现使用强类型别名（C++20 `std::identity` 或显式 wrapper 类型），Go 使用命名类型：

```go
type ShardID uint64  // 不能隐式转换为 NodeID
type NodeID  uint64
```

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| "客户端超时了自然会重试" | 超时不代表操作没生效。没有幂等键，重试就是重复执行。 |
| "内部 RPC 不需要契约，都是自己人" | 内部节点也是消费者，而且集群滚动升级时新旧代码必然混跑。契约防止耦合并支持并行工作。 |
| "这个字段以后可以改" | wire 协议的字段一旦上线就被固化。复用 field number 或改类型会在升级窗口内静默损坏数据。 |
| "最终一致就行，客户端会处理" | 客户端不知道你的一致性边界。不写进契约，它们就会按照自己想象中的模型写代码。 |
| "重试一下就好了，不用区分错误码" | 对 INVALID_ARGUMENT 重试一万次也是同样的结果，对 UNAVAILABLE 不重试就是把暂时故障变成用户可见的失败。 |
| "我们集群内部网络是可信的" | 被攻陷的节点、错误的配置、损坏的内存都会产生恶意或畸形的消息。在边界验证，永远。 |
| "流控可以以后在网关层加" | 没有契约化的配额和背压，一个行为异常的客户端就能拖垮整个集群。 |
| "两个版本并行维护一段时间没关系" | 多个协议版本倍增维护成本并产生钻石依赖问题。优先遵循单版本规则，用版本协商过渡。 |
| "我们以后再写协议文档" | proto 定义本身就是文档。先定义它们。 |

## 红旗警告

- 同一个方法根据不同条件返回不同结构的数据
- 各方法的错误格式不一致，或无法区分可重试与不可重试
- 非幂等的写操作不接受幂等键，却期望客户端处理超时重试
- 验证散落在内部代码各处，而非集中在 RPC 边界
- 对现有 proto 字段的破坏性变更（类型更改、复用 field number、未 reserved 就移除）
- 列表方法没有分页，或用页码而非游标
- 一致性语义只存在于实现注释里，没有出现在接口契约中
- 协议变更要求全集群同时升级（没有版本协商或特性门控）
- 流式接口无背压机制，依赖无界缓冲
- 未经验证就使用对端节点发来的消息或客户端提供的元数据

## 验证

设计接口之后：

- [ ] 每个方法都有类型化的请求和响应 schema（proto 或等价物）
- [ ] 错误响应遵循单一一致的格式，且明确区分可重试与不可重试
- [ ] 每个写方法的幂等性在契约中写明；非幂等操作接受幂等键
- [ ] 一致性模型（强一致/最终一致/读己之写）在接口语义中显式表达
- [ ] 验证仅在系统边界处进行，包括对端节点的消息
- [ ] 新字段是追加且可选的；移除字段使用 reserved（前向/后向兼容）
- [ ] 协议变更支持滚动升级：版本协商 + 特性门控，无需全集群同时升级
- [ ] 配额、流控上限和背压行为写在契约中
- [ ] 列表方法支持基于游标的分页
- [ ] 命名在所有方法中遵循一致的约定
- [ ] 协议文档或 proto 定义与实现一起提交
