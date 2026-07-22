# zflow 入门指南

zflow 适用于任何接受 Markdown 指令的 AI 编程智能体。本指南涵盖通用方法。如需特定工具的设置说明，请参阅专门的指南。

## 技能如何运作

每个技能都是一个 Markdown 文件（`SKILL.md`），描述一个特定的工程工作流。当加载到智能体的上下文中时，智能体会遵循该工作流——包括验证步骤、需要避免的反模式和退出标准。

**技能不是参考文档。** 它们是智能体遵循的逐步流程。

## 快速入门（任何智能体）

### 1. 克隆仓库

```bash
git clone https://github.com/13eholder/zflow.git
```

### 2. 选择一个技能

浏览 `skills/` 目录。每个子目录包含一个 `SKILL.md`，其中包含：
- **何时使用**——表明此技能适用的触发条件
- **流程**——逐步工作流
- **验证**——如何确认工作已完成
- **常见合理化借口**——智能体可能用来跳过步骤的借口
- **危险信号**——技能被违反的迹象

### 3. 将技能加载到你的智能体中

将相关的 `SKILL.md` 内容复制到你的智能体的系统提示词、规则文件或对话中。最常见的方法：

**系统提示词：** 在会话开始时粘贴技能内容。

**规则文件：** 将技能内容添加到项目的规则文件中（CLAUDE.md、.cursorrules 等）。

**对话：** 在给出指令时引用技能："请对此变更遵循 test-driven-development 流程。"

### 4. 使用元技能进行发现

首先加载 `using-agent-skills` 技能。它包含一个将任务类型映射到合适技能的流程图。

## 推荐设置

正在将技能推广到真实项目中？**[采纳指南](adoption-guide.md)** 涵盖了两条端到端路径：为全新项目从第一天开始的完整生命周期，以及为已有代码库的渐进式、验证优先的滚动发布。以下设置是快速版本。

### 最小化设置（从这里开始）

将三个基本技能加载到你的规则文件中：

1. **spec-driven-development**——用于定义要构建什么
2. **test-driven-development**——用于证明它能用
3. **code-review-and-quality**——用于在合并前验证质量

这三个技能覆盖了 AI 辅助开发中最关键的质量缺口。

### 完整生命周期

要获得全面的覆盖，按阶段加载技能：

```
开始项目时：    spec-driven-development → planning-and-task-breakdown
开发过程中：    incremental-implementation + test-driven-development
合并之前：      code-review-and-quality
部署之前：      shipping-and-launch
```

### 上下文感知加载

不要一次加载所有技能——这会浪费上下文。加载与当前任务相关的技能：

- 在调试？加载 `debugging-and-error-recovery`
- 在设置 CI？加载 `ci-cd-and-automation`

## 技能结构

每个技能遵循相同的结构：

```
YAML 前置元数据（name、description）
├── 概述 —— 该技能做什么
├── 何时使用 —— 触发条件和情境
├── 核心流程 —— 逐步工作流
├── 示例 —— 代码示例和模式
├── 常见合理化借口 —— 借口与反驳
├── 危险信号 —— 技能被违反的迹象
└── 验证 —— 退出标准检查清单
```

参见 [skill-anatomy.md](skill-anatomy.md) 了解完整规范。

## 使用智能体

`agents/` 目录包含预配置的智能体角色：

| 智能体 | 用途 |
|-------|---------|
| `code-reviewer.md` | 五轴代码审查 |
| `test-engineer.md` | 测试策略和编写 |

在你需要专业审查时加载智能体定义。例如，让你的编程智能体"使用 code-reviewer 智能体角色审查此变更"，并提供智能体定义。

## 使用斜杠命令

`.claude/commands/` 目录包含 Claude Code 的斜杠命令：

| 命令 | 调用的技能 |
|---------|---------------|
| `/spec` | spec-driven-development |
| `/plan` | planning-and-task-breakdown |
| `/build` | incremental-implementation + test-driven-development |
| `/build auto` | planning-and-task-breakdown → incremental-implementation + test-driven-development（整个计划，一次批准） |
| `/test` | test-driven-development |
| `/review` | code-review-and-quality |
| `/code-simplify` | code-simplification |
| `/ship` | shipping-and-launch |

> **注意：** 作为 Claude Code 插件安装时，你可能会看到类似
> _"Default commands/ folder is ignored because the manifest sets 'commands'"_ 的警告。
> 这是预期行为。根目录下的 `commands/` 目录属于 Antigravity CLI，
> 有意与 `.claude/commands/` 分开。所有 Claude Code 斜杠
> 命令都能从 `.claude/commands/` 正常加载；该警告只是表面性的。

## 使用参考资料

`references/` 目录包含补充性检查清单：

| 参考资料 | 配合使用 |
|-----------|----------|
| `testing-patterns.md` | test-driven-development |
| `performance-checklist.md` | performance-optimization |
| `definition-of-done.md` | 所有技能 / 每个变更 |
| `observability-checklist.md` | observability-and-instrumentation |
| `orchestration-patterns.md` | doubt-driven-development |

当你需要超出技能范围的详细模式时加载参考资料。

## 规范和任务产物

`/spec` 和 `/plan` 命令创建工作产物（`SPEC.md`、`tasks/plan.md`、`tasks/todo.md`）。在开发进行中将它们视为**活动文档**：

- 在开发期间将它们纳入版本控制，使开发者和智能体拥有共享的事实来源。
- 当范围或决策发生变化时更新它们。
- 如果你的仓库不想要长期保留这些文件，在合并前删除它们或将文件夹添加到 `.gitignore`——工作流不要求它们是永久性的。

## 技巧

1. **从 spec-driven-development 开始**任何非平凡的工作
2. **在编写代码时始终加载 test-driven-development**
3. **不要跳过验证步骤**——它们是核心所在
4. **有选择地加载技能**——更多上下文并不总是更好
5. **使用智能体进行审查**——不同的视角捕捉不同的问题
