---
name: code-simplification
description: 为清晰性而简化代码。在重构代码以提高可读性而不改变行为时使用。当代码可以正常工作但比应有的更难阅读、维护或扩展时使用。在审查已积累不必要复杂性的代码时使用。当组件过度设计、过于炫技而难以维护时使用。当需要清理越来越难读懂的代码时使用。
---

# 代码简化

> 灵感来源于 [Claude Code Simplifier 插件](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md)。此处改编为一个模型无关的、面向任何 AI 编码智能体的流程驱动型技能。

## 概述

通过降低复杂度同时保持精确行为来简化代码。目标不是更少的行数——而是更易于阅读、理解、修改和调试的代码。每个简化都必须通过一个简单的测试："新团队成员会比原始代码更快地理解它吗？"

## 何时使用

- 当一个功能已经可以工作且测试通过，但实现感觉比所需更重时
- 代码审查中标记了可读性或复杂度问题时
- 当你遇到深层嵌套逻辑、过长函数或不清楚的命名时
- 重构在时间压力下编写的代码时
- 整合分散在多个文件中的相关逻辑时
- 合并引入了重复或不一致的变更之后

**何时不使用：**

- 代码已经干净且可读——不要为简化而简化
- 你还不理解代码做了什么——先理解再简化
- 代码是性能关键的，且"更简单"的版本会可测量地更慢
- 你即将完全重写该模块——简化即将丢弃的代码是浪费精力

## 五项原则

### 1. 精确保持行为

不要改变代码做什么——只改变它如何表达。所有输入、输出、副作用、错误行为和边界情况必须保持完全相同。如果你不确定一个简化是否保持行为，就不要做。

```
每次变更前自问：
→ 这对每个输入都产生相同的输出吗？
→ 这保持了相同的错误行为吗？
→ 这保持了相同的副作用和顺序吗？
→ 所有现有测试是否仍在无修改的情况下通过？
```

### 2. 遵循项目约定

简化意味着使代码与代码库更一致，而非强加外部偏好。在简化之前：

```
1. 阅读 CLAUDE.md / 项目约定
2. 研究相邻代码如何处理类似模式
3. 在以下方面匹配项目风格：
   - Import 排序和模块系统
   - 函数声明风格
   - 命名约定
   - 错误处理模式
   - 类型注解深度
```

破坏项目一致性的简化不是简化——它是无谓的改动。

### 3. 优先清晰而非聪明

显式代码优于紧凑代码——当紧凑版本需要大脑停顿来解析时。

```go
// 不清晰：密集的条件链
label := choose(isNew, "New", choose(isUpdated, "Updated", choose(isArchived, "Archived", "Active")))

// 清晰：可读的 switch
func statusLabel(item *Item) string {
	switch {
	case item.IsNew:
		return "New"
	case item.IsUpdated:
		return "Updated"
	case item.IsArchived:
		return "Archived"
	}
	return "Active"
}
```

```go
// 不清晰：硬套函数式风格的一行聚合
result := lo.Reduce(items, func(acc map[string]int, it Item, _ int) map[string]int {
	acc[it.ID]++
	return acc
}, map[string]int{})

// 清晰：命名的中间步骤
countByID := make(map[string]int)
for _, item := range items {
	countByID[item.ID]++
}
```

### 4. 保持平衡

简化有一个失败模式：过度简化。注意这些陷阱：

- **过于激进地内联**——移除给概念命名的辅助函数会使调用点更难阅读
- **合并不相关的逻辑**——两个简单函数合并为一个复杂函数并不是更简单
- **移除"不必要的"抽象**——某些抽象是为了可扩展性或可测试性而存在的，而非为了复杂性
- **以行数优化为目标**——更少的行不是目标；更容易的理解才是

### 5. 限定在变更范围内

默认只简化最近修改的代码。避免对不相关代码的顺手重构，除非被明确要求扩大范围。无范围的简化会在 diff 中制造噪音，并有意外回归的风险。

## 简化流程

### 步骤 1：在触碰之前先理解（切斯特顿之栅栏）

在改变或移除任何东西之前，理解它为什么存在。这就是切斯特顿之栅栏：如果你看到路中间有一道栅栏且不明白它为什么在那里，不要拆除它。先理解原因，然后决定这个原因是否仍然适用。

```
简化之前，回答：
- 这段代码的职责是什么？
- 谁调用它？它调用什么？
- 边界情况和错误路径是什么？
- 是否有定义预期行为的测试？
- 它为什么可能以这种方式编写？（性能？平台限制？历史原因？）
- 检查 git blame：这段代码的原始上下文是什么？
```

如果你不能回答这些问题，你就没有准备好进行简化。先阅读更多上下文。

### 步骤 2：识别简化机会

扫描以下模式——每一个都是一个具体的信号，而非模糊的异味：

**结构性复杂度：**

| 模式 | 信号 | 简化方法 |
|---------|--------|----------------|
| 深层嵌套（3+ 层） | 难以跟踪控制流 | 将条件提取为卫语句或辅助函数 |
| 过长函数（50+ 行） | 多重职责 | 拆分为具有描述性名称的专注函数 |
| 嵌套三元表达式 | 需要脑内栈来解析 | 替换为 if/else 链、switch 或查找对象 |
| 布尔参数标志 | `doThing(true, false, true)` | 替换为选项对象或独立函数 |
| 重复的条件判断 | 多处出现相同的 `if` 检查 | 提取为命名良好的谓词函数 |

**命名和可读性：**

| 模式 | 信号 | 简化方法 |
|---------|--------|----------------|
| 通用名称 | `data`、`result`、`temp`、`val`、`item` | 重命名以描述内容：`userProfile`、`validationErrors` |
| 缩写名称 | `usr`、`cfg`、`hdlr`、`stat` | 使用完整单词，除非缩写是通用的（`id`、`url`、`api`） |
| 误导性名称 | 名为 `get` 的函数也会改变状态 | 重命名以反映实际行为 |
| 解释"what"的注释 | `count++` 上面的 `// increment counter` | 删除注释——代码已经足够清晰 |
| 解释"why"的注释 | `// Retry because the API is flaky under load` | 保留这些——它们传达了代码无法表达的意图 |

**冗余：**

| 模式 | 信号 | 简化方法 |
|---------|--------|----------------|
| 重复逻辑 | 多处出现相同的 5+ 行代码 | 提取为共享函数 |
| 死代码 | 不可达的分支、未使用的变量、被注释掉的代码块 | 移除（在确认确实死代码之后） |
| 不必要的抽象 | 不增加价值的包装器 | 内联包装器，直接调用底层函数 |
| 过度工程化模式 | 为工厂创建的工厂、只有一个策略的策略模式 | 替换为简单直接的方法 |
| 冗余的类型断言 | 强转为已经推断出的类型 | 移除断言 |

### 步骤 3：增量应用变更

一次做一个简化。每次变更后运行测试。**将重构变更与功能或缺陷修复变更分开提交。** 一个既重构又添加功能的 PR 是两个 PR——拆分它们。

```
对于每个简化：
1. 进行变更
2. 运行测试套件
3. 如果测试通过 → 提交（或继续下一个简化）
4. 如果测试失败 → 撤销并重新考虑
```

避免将多个简化批处理为一个未测试的变更。如果出现问题，你需要知道是哪个简化导致的。

**500 行规则：** 如果重构将触及超过 500 行，投资于自动化（codemod、sed 脚本、AST 转换）而非手动改动。该规模的手动编辑容易出错且令人筋疲力尽地审查。

### 步骤 4：验证结果

所有简化之后，退后一步评估整体：

```
比较前后：
- 简化后的版本是否确实更容易理解？
- 你是否引入了任何与代码库不一致的新模式？
- Diff 是否干净且可审查？
- 同事会批准这个变更吗？
```

如果"简化后"的版本更难理解或审查，就撤销。不是每次简化尝试都会成功。

## 语言特定指南

### Go

```go
// 简化：不必要的包装函数
// 之前
func GetNode(id string) (*Node, error) {
	n, err := nodeService.FindByID(id)
	if err != nil {
		return nil, err
	}
	return n, nil
}
// 之后
func GetNode(id string) (*Node, error) {
	return nodeService.FindByID(id)
}

// 简化：冗长的条件赋值
// 之前
var displayName string
if node.Alias != "" {
	displayName = node.Alias
} else {
	displayName = node.Hostname
}
// 之后
displayName := cmp.Or(node.Alias, node.Hostname)

// 简化：字符串比较错误
// 之前
if err != nil && err.Error() == "node not found" {
	return nil
}
// 之后
if errors.Is(err, ErrNodeNotFound) {
	return nil
}

// 简化：冗余的布尔返回
// 之前
func isValid(input string) bool {
	if len(input) > 0 && len(input) < 100 {
		return true
	}
	return false
}
// 之后
func isValid(input string) bool {
	return len(input) > 0 && len(input) < 100
}
```

### Python

```python
# 简化：冗长的字典构建
# 之前
result = {}
for item in items:
    result[item.id] = item.name
# 之后
result = {item.id: item.name for item in items}

# 简化：嵌套条件加提前返回
# 之前
def process(data):
    if data is not None:
        if data.is_valid():
            if data.has_permission():
                return do_work(data)
            else:
                raise PermissionError("No permission")
        else:
            raise ValueError("Invalid data")
    else:
        raise TypeError("Data is None")
# 之后
def process(data):
    if data is None:
        raise TypeError("Data is None")
    if not data.is_valid():
        raise ValueError("Invalid data")
    if not data.has_permission():
        raise PermissionError("No permission")
    return do_work(data)
```

### Rust

```rust
// 简化：冗余的 match 布尔
// 之前
let state = match node.is_leader() {
    true => State::Leader,
    false => State::Follower,
};
// 之后
let state = if node.is_leader() { State::Leader } else { State::Follower };

// 简化：手动传播错误
// 之前
let entry = match log.get(index) {
    Ok(e) => e,
    Err(err) => return Err(err),
};
// 之后
let entry = log.get(index)?;

// 简化：冗长的 Option 处理
// 之前
let name = match replica.alias {
    Some(alias) => alias,
    None => replica.hostname.clone(),
};
// 之后
let name = replica.alias.unwrap_or_else(|| replica.hostname.clone());
```

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| "它能用，不用动它" | 能用但难以阅读的代码，在出问题时将难以修复。现在简化能为每一次未来的变更节省时间。 |
| "更少的行总是更简单" | 一行嵌套三元表达式不比五行 if/else 更简单。简单性关乎理解速度，而非行数。 |
| "我顺便快速简化一下这段不相关的代码" | 无范围的简化会制造噪音 diff，并在你不打算修改的代码中带来回归风险。保持专注。 |
| "类型让它自文档化" | 类型文档化的是结构，而非意图。一个命名良好的函数解释*为什么*，比类型签名解释*是什么*更好。 |
| "这个抽象以后可能有用" | 不要保留推测性抽象。如果现在不使用它，它就是没有价值的复杂度。移除它，需要时再加回来。 |
| "原作者一定有原因" | 也许。检查 git blame——应用切斯特顿之栅栏。但累积的复杂性往往没有原因；它只是压力下迭代的残留物。 |
| "我在添加这个功能的同时重构" | 将重构与功能工作分开。混合的变更更难审查、更难回滚，在历史中也更难理解。 |

## 红旗警告

- 需要修改测试才能通过的简化（你很可能改变了行为）
- "简化后"的代码比原始代码更长、更难跟踪
- 重命名以匹配你的偏好而非项目约定
- 移除错误处理因为"它让代码更干净"
- 简化你尚未完全理解的代码
- 将许多简化批处理为一个大的、难以审查的提交
- 在任务范围之外重构代码且未被要求

## 验证

完成简化之后：

- [ ] 所有现有测试在无修改的情况下通过
- [ ] 构建成功且无新警告
- [ ] Linter/格式化器通过（无风格退化）
- [ ] 每个简化都是一个可审查的、增量的变更
- [ ] Diff 干净——没有无关变更混入
- [ ] 简化后的代码遵循项目约定（对照 CLAUDE.md 或等效文档检查）
- [ ] 没有错误处理被移除或削弱
- [ ] 没有死代码被遗留（未使用的 import、不可达的分支）
- [ ] 同事或审查智能体会将变更批准为净改进
