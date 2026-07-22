---
name: test-driven-development
description: 以测试驱动开发。在实现任何逻辑、修复任何缺陷或更改任何行为时使用。当需要证明代码可行、缺陷报告到来，或即将修改现有功能时使用。在按红-绿-重构（red-green-refactor）循环实现功能时使用。当需要在修复 bug 前先写一个失败测试、或在动手实现前先想清楚需要哪些测试时使用。
---

# 测试驱动开发

## 概述

在编写使其通过的代码之前先编写一个失败的测试。对于缺陷修复，在尝试修复之前用测试复现缺陷。测试就是证明——"看起来是对的"不算完成。拥有良好测试的代码库是 AI 智能体的超能力；没有测试的代码库是一个负担。

## 何时使用

- 实现任何新的逻辑或行为
- 修复任何缺陷（Prove-It 模式）
- 修改现有功能
- 添加边界情况处理
- 任何可能破坏现有行为的变更

**何时不使用：** 纯粹的配置变更、文档更新或没有行为影响的静态内容变更。

**相关：** 对于分布式系统的变更，将 TDD 与测试集群中的故障注入验证相结合——见下方的"在真实集群中验证"部分。

## 首先发现技术栈

TDD 循环是通用的；命令不是。在编写第一个测试之前，发现*这个*仓库如何测试，并在每个 RED、GREEN 和验证步骤中使用它的命令：

- **语言和构建系统**——`package.json`、`pom.xml`/`build.gradle`、`pyproject.toml`、`go.mod`、`Cargo.toml`、`Gemfile`、`Makefile`
- **已提交的包装器**——优先使用 `./gradlew`、`./mvnw`、`make test` 或仓库脚本，而非全局安装的工具
- **测试框架和配置**——以及它如何运行单个聚焦测试 vs 完整套件
- **现有约定**——测试在哪里、文件如何命名、相邻测试遵循什么模式
- **文档化的命令**——README、CONTRIBUTING 和 CI 工作流展示了实际控制合并的命令

在循环期间运行仓库的聚焦测试命令，在完成之前运行其完整套件命令。永远不要假设默认值如 `npm test`——一个 Gradle、Cargo 或 pytest 项目有其自己的等效命令。

以下示例使用 Go 作为说明；在任何语言中工作流程都是相同的，只要你已经发现了项目自己的工具。

## TDD 循环

```
    RED               GREEN              REFACTOR
 编写一个失败   编写最小代码来    清理实现
 的测试    ──→  使其通过       ──→           ──→  (重复)
      │                  │                    │
      ▼                  ▼                    ▼
   测试 FAILS        测试 PASSES        测试仍然 PASS
```

### 步骤 1：RED ——编写一个失败的测试

先写测试。它必须失败。立即通过的测试证明不了任何东西。

```go
// RED: 此测试失败因为 CreateTask 还不存在
func TestTaskService_CreateTask(t *testing.T) {
	task, err := taskService.CreateTask(ctx, TaskInput{Title: "Buy groceries"})
	require.NoError(t, err)

	assert.NotEmpty(t, task.ID)
	assert.Equal(t, "Buy groceries", task.Title)
	assert.Equal(t, StatusPending, task.Status)
	assert.False(t, task.CreatedAt.IsZero())
}
```

### 步骤 2：GREEN ——让它通过

编写最小代码使测试通过。不要过度工程化：

```go
// GREEN: 最小实现
func (s *TaskService) CreateTask(ctx context.Context, in TaskInput) (Task, error) {
	task := Task{
		ID:        generateID(),
		Title:     in.Title,
		Status:    StatusPending,
		CreatedAt: time.Now(),
	}
	if err := s.db.InsertTask(ctx, task); err != nil {
		return Task{}, err
	}
	return task, nil
}
```

### 步骤 3：REFACTOR ——清理

在测试绿色的情况下，改进代码而不改变行为：

- 提取共享逻辑
- 改进命名
- 移除重复
- 如有必要则优化

每次重构步骤后运行测试以确认没有破坏任何东西。

## Prove-It 模式（缺陷修复）

当报告缺陷时，**不要从尝试修复它开始。** 从编写一个复现它的测试开始。

```
缺陷报告到来
       │
       ▼
  编写一个展示缺陷的测试
       │
       ▼
  测试 FAILS（确认缺陷存在）
       │
       ▼
  实现修复
       │
       ▼
  测试 PASSES（证明修复有效）
       │
       ▼
  运行完整测试套件（无回归）
```

**示例：**

```go
// 缺陷："完成任务没有更新 CompletedAt 时间戳"

// 步骤 1：编写复现测试（它应该 FAIL）
func TestCompleteTask_SetsCompletedAt(t *testing.T) {
	task, _ := taskService.CreateTask(ctx, TaskInput{Title: "Test"})
	completed, err := taskService.CompleteTask(ctx, task.ID)
	require.NoError(t, err)

	assert.Equal(t, StatusCompleted, completed.Status)
	assert.False(t, completed.CompletedAt.IsZero()) // 这失败了 → 缺陷已确认
}

// 步骤 2：修复缺陷
func (s *TaskService) CompleteTask(ctx context.Context, id string) (Task, error) {
	return s.db.UpdateTask(ctx, id, TaskUpdate{
		Status:      StatusCompleted,
		CompletedAt: time.Now(), // 之前缺失这个
	})
}

// 步骤 3：测试通过 → 缺陷已修复，回归已防护
```

## 测试金字塔

按照金字塔投入测试努力——大多数测试应该小且快，在更高层级逐渐减少测试数量：

```
          ╱╲
         ╱  ╲         E2E 测试 (~5%)
        ╱    ╲        完整客户端流程，真实集群
       ╱──────╲
      ╱        ╲      集成测试 (~15%)
     ╱          ╲     组件交互，API 边界
    ╱────────────╲
   ╱              ╲   单元测试 (~80%)
  ╱                ╲  纯逻辑，隔离，每个毫秒级
 ╱──────────────────╲
```

**Beyonce 规则：** 如果你喜欢它，你就应该为它写测试。基础设施变更、重构和迁移不负责捕获你的缺陷——你的测试负责。如果一个变更破坏了你的代码且你没有为它写测试，那是你的问题。

### 测试规模（资源模型）

除了金字塔层级之外，按测试消耗的资源分类：

| 大小 | 约束 | 速度 | 示例 |
|------|------------|-------|---------|
| **Small** | 单进程、无 I/O、无网络、无数据库 | 毫秒 | 纯函数测试、数据转换 |
| **Medium** | 允许多进程、仅 localhost、无外部服务 | 秒 | 带测试数据库的 API 测试、组件测试 |
| **Large** | 允许多机器、允许外部服务 | 分钟 | E2E 测试、性能基准测试、预发布集成 |

Small 测试应该构成你套件的绝大多数。它们快、可靠，并且在失败时容易调试。

### 决策指南

```
是没有副作用的纯逻辑吗？
  → 单元测试（small）

它跨越了边界（API、数据库、文件系统）吗？
  → 集成测试（medium）

它是必须端到端工作的关键用户流程吗？
  → E2E 测试（large）——限制这些在关键路径上
```

## 编写好的测试

### 测试状态，而非交互

断言操作的*结果*，而非哪些方法被内部调用了。验证方法调用序列的测试在你重构时会失败，即使行为没有改变。

```go
// 好：测试函数做什么（基于状态）
func TestListTasks_SortsByCreatedAtDesc(t *testing.T) {
	tasks := listTasks(SortOptions{By: SortByCreatedAt, Order: Desc})
	assert.True(t, tasks[0].CreatedAt.After(tasks[1].CreatedAt))
}

// 坏：测试函数内部如何工作（基于交互）
func TestListTasks_CallsQueryWithOrderBy(t *testing.T) {
	listTasks(SortOptions{By: SortByCreatedAt, Order: Desc})
	mockDB.AssertCalled(t, "Query",
		mock.MatchedBy(func(q string) bool {
			return strings.Contains(q, "ORDER BY created_at DESC")
		}))
}
```

### 测试中 DAMP 优于 DRY

在生产代码中，DRY（Don't Repeat Yourself）通常是正确的。在测试中，**DAMP（Descriptive And Meaningful Phrases，描述性且有意义的短语）**更好。测试应该读起来像规格——每个测试应该讲述一个完整的故事，而不需要读者追溯共享的辅助函数。

```go
// DAMP: 每个测试是自包含且可读的
func TestCreateTask_RejectsEmptyTitle(t *testing.T) {
	input := TaskInput{Title: "", Assignee: "user-1"}
	_, err := createTask(input)
	require.EqualError(t, err, "title is required")
}

func TestCreateTask_TrimsTitleWhitespace(t *testing.T) {
	input := TaskInput{Title: "  Buy groceries  ", Assignee: "user-1"}
	task, err := createTask(input)
	require.NoError(t, err)
	assert.Equal(t, "Buy groceries", task.Title)
}

// 过度 DRY: 共享设置掩盖了每个测试实际验证的内容
// （不要为了避免重复输入结构而这样做）
```

测试中的重复是可以接受的，当它使每个测试独立可理解时。

### 优先真实实现而非 Mock

使用最简单的能完成工作的测试替身。你的测试使用的真实代码越多，它们提供的信心就越多。

```
偏好顺序（从最到最不偏好）：
1. 真实实现    → 最高信心，捕获真正的缺陷
2. Fake         → 依赖项的内存版本（例如，fake DB）
3. Stub         → 返回预设数据，无行为
4. Mock（交互） → 验证方法调用——谨慎使用
```

**仅在以下情况下使用 mock：** 真实实现太慢、非确定性或具有你无法控制的副作用（外部 API、发送邮件）。过度 mock 会创建测试通过而生产环境出错的测试。

### 使用 Arrange-Act-Assert 模式

```go
func TestCheckOverdue_MarksTaskOverdueAfterDeadline(t *testing.T) {
	// Arrange: 设置测试场景
	task := Task{
		Title:    "Test",
		Deadline: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
	}

	// Act: 执行被测试的操作
	result := checkOverdue(task, time.Date(2025, 1, 2, 0, 0, 0, 0, time.UTC))

	// Assert: 验证结果
	assert.True(t, result.IsOverdue)
}
```

### 每个概念一个断言

```go
// 好：每个测试验证一个行为
func TestCreateTask_RejectsEmptyTitle(t *testing.T) { ... }
func TestCreateTask_TrimsTitleWhitespace(t *testing.T) { ... }
func TestCreateTask_EnforcesTitleMaxLength(t *testing.T) { ... }

// 坏：所有东西放在一个测试中
func TestCreateTask_ValidatesTitle(t *testing.T) {
	_, err := createTask(TaskInput{Title: ""})
	assert.Error(t, err)
	task, _ := createTask(TaskInput{Title: "  hello  "})
	assert.Equal(t, "hello", task.Title)
	_, err = createTask(TaskInput{Title: strings.Repeat("a", 256)})
	assert.Error(t, err)
}
```

### 描述性命名的测试

```go
// 好：读起来像规格
func TestCompleteTask_SetsStatusToCompletedAndRecordsTimestamp(t *testing.T) { ... }
func TestCompleteTask_ReturnsNotFoundForMissingTask(t *testing.T) { ... }
func TestCompleteTask_IsIdempotent_CompletingAlreadyCompletedTaskIsNoOp(t *testing.T) { ... }
func TestCompleteTask_SendsNotificationToAssignee(t *testing.T) { ... }

// 坏：模糊的名称
func TestTaskService(t *testing.T) { ... }
func TestError(t *testing.T) { ... }
func Test3(t *testing.T) { ... }
```

## 要避免的测试反模式

| 反模式 | 问题 | 修复 |
|---|---|---|
| 测试实现细节 | 重构时测试会失败，即使行为没有改变 | 测试输入和输出，而非内部结构 |
| 不稳定测试（时序、顺序依赖） | 侵蚀对测试套件的信任 | 使用确定性断言，隔离测试状态 |
| 测试框架代码 | 浪费时间测试第三方行为 | 只测试你的代码 |
| 快照滥用 | 大快照无人审查，任何变更都会破坏 | 谨慎使用快照并审查每次变更 |
| 无测试隔离 | 测试单独通过但一起失败 | 每个测试设置和清理自己的状态 |
| 什么都 Mock | 测试通过但生产环境出错 | 优先真实实现 > Fake > Stub > Mock。仅在真实依赖项慢或非确定性的边界处 Mock |

## 在真实集群中验证

对于分布式和存储系统，仅有单元测试是不够的——正确性问题集中在故障路径上，而故障路径只有在真实进程、真实网络、真实磁盘上才会暴露。在测试集群中做运行时验证：注入故障、观察遥测、校验不变量。故障注入的完整模式参见 `references/testing-patterns.md`。

### 集群验证工作流

```
1. 复现：在测试集群部署当前构建，用负载发生器触发缺陷场景
2. 注入：制造故障——kill 节点、网络分区、慢盘、时钟偏移（一次一种）
3. 观察：指标（p99、副本滞后、重传率）、日志、集群状态收敛过程
4. 诊断：比较实际 vs 预期——一致性承诺是否被破坏？恢复是否完整？
5. 修复：在源代码中实现修复
6. 验证：重跑同一故障场景，确认不变量保持，回归测试通过
```

### 检查什么

| 信号 | 何时 | 寻找什么 |
|------|------|-----------------|
| **日志** | 始终 | 错误级别日志为零、无未处理的 panic/断言失败 |
| **指标** | 性能与收敛 | p99/p999 延迟、副本滞后、重试率、恢复耗时 |
| **一致性** | 任何故障后 | 已确认的写入不丢失、无部分应用、读不到旧值 |
| **校验和** | 数据路径变更 | 端到端校验和匹配、无静默数据损坏 |
| **集群状态** | 节点变更后 | 成员关系收敛、无脑裂、leader 选举稳定 |
| **资源** | soak 期间 | 内存/句柄/磁盘水位无单调增长 |

### 安全边界

故障注入只在**测试集群**进行。对生产集群的任何故障注入、混沌实验或破坏性操作（kill 节点、拔盘、限速）都必须先获得用户明确批准，并确认有回退预案。测试集群中的数据同样按真实数据对待：不要用生产数据做注入实验，除非经过脱敏且获得授权。

## 何时使用子智能体进行测试

对于复杂的缺陷修复，生成一个子智能体来编写复现测试：

```
主智能体："生成一个子智能体来为这个缺陷编写复现测试：
[缺陷描述]。测试在当前代码下应该失败。"

子智能体：编写复现测试

主智能体：验证测试失败，然后实现修复，
然后验证测试通过。
```

这种分离确保测试是在不知道修复方案的情况下编写的，使其更加健壮。

## 参见

有关说明这些原则的 Go/Rust 测试模式——包括故障注入、崩溃恢复与一致性验证——参见 `references/testing-patterns.md`。这些原则（Arrange-Act-Assert、命名、Mock 纪律、反模式）可转移到任何生态系统；其中的语法和工具是 Go/Rust 特定的。

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| "代码能工作后我再写测试" | 你不会的。而且事后编写的测试测试的是实现，而非行为。 |
| "这太简单了不值得测试" | 简单的代码会变得复杂。测试文档化了预期行为。 |
| "测试拖慢我" | 测试现在拖慢你。它们在你以后每次修改代码时加速你。 |
| "我手动测试过了" | 手动测试不会持久化。明天的变更可能破坏它而无法知道。 |
| "代码是自解释的" | 测试就是规格。它们文档化代码应该做什么，而非它确实做了什么。 |
| "这只是个原型" | 原型会变成生产代码。从第一天就写测试可以防止"测试债务"危机。 |
| "让我再运行一次测试以加倍确保" | 在干净测试运行之后，重复相同命令不会增加任何东西，除非代码自上次以来发生了变化。在后续编辑后再运行，而非作为安慰剂。 |

## 红旗警告

- 编写代码却没有相应的测试
- 不检查此仓库实际使用什么就采用默认测试命令（如 `cargo test`、`go test ./...`）
- 第一次运行就通过的测试（它们可能没有测试你认为的东西）
- "所有测试通过"但实际上没有运行任何测试
- 缺陷修复没有复现测试
- 测试框架行为而非应用程序行为的测试
- 测试名称不描述预期行为
- 跳过测试使套件通过
- 连续两次运行相同的测试命令且没有任何中间代码变更

## 验证

完成任何实现后：

- [ ] 每个新行为都有相应的测试
- [ ] 完整套件通过，使用仓库自己的测试命令运行（`go test ./...`、`cargo test`、`pytest`、`./gradlew test`……）
- [ ] 缺陷修复包含一个在修复前失败的复现测试
- [ ] 测试名称描述正在验证的行为
- [ ] 没有测试被跳过或禁用
- [ ] 覆盖率没有下降（如果追踪了）

**注意：** 在可能影响结果的变更之后运行每个测试命令。在干净运行之后，除非代码在上次运行以来发生了变化，否则不要重复相同命令——对未更改的代码重新运行不会增加信心。
