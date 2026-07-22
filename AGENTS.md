# AGENTS.md

本文件为 AI 编程智能体（Claude Code、Cursor、Copilot、Antigravity 等）在此仓库中处理代码时提供指导。

> **适用范围：** 本文件配置的是在 [`13eholder/zflow`](https://github.com/13eholder/zflow) 仓库本身上工作的智能体。它不应被复制到其他项目或全局智能体配置中；可复用资产是 `skills/` 中的技能，而非本文件。

## 仓库概述

为资深基础架构工程师（分布式系统、存储、网络）打造的面向 Claude.ai 和 Claude Code 的技能集合。技能是打包的指令和脚本，用于扩展 Claude 和你的编程智能体的能力。

## OpenCode 集成

OpenCode 使用由 `skill` 工具和此仓库的 `/skills` 目录驱动的**技能驱动执行模型**。

### 核心规则

- 如果任务匹配某个技能，你**必须**调用它
- 技能位于 `skills/<skill-name>/SKILL.md`
- 如果有技能适用，绝不直接实现
- 始终严格遵循技能指令（不要部分应用它们）

### 意图 → 技能映射

智能体应自动将用户意图映射到技能：

- 功能 / 新能力 → `spec-driven-development`，然后 `incremental-implementation`、`test-driven-development`
- 规划 / 分解 → `planning-and-task-breakdown`
- 缺陷 / 失败 / 异常行为 → `debugging-and-error-recovery`
- 容错验证 / 故障演练 / 混沌工程 → `failure-injection-testing`
- 一致性 / 持久性承诺验证 → `consistency-and-durability-verification`
- 代码审查 → `code-review-and-quality`
- 重构 / 简化 → `code-simplification`
- 接口 / 协议设计 → `api-and-interface-design`
- 性能 / 延迟问题 → `performance-optimization`
- 数据迁移 / 升级 → `shipping-and-launch`

### 生命周期映射（隐式命令）

OpenCode 不支持 `/spec` 或 `/plan` 等斜杠命令。

相反，智能体必须在内部遵循此生命周期：

- 定义 → `spec-driven-development`
- 规划 → `planning-and-task-breakdown`
- 构建 → `incremental-implementation` + `test-driven-development`
- 验证 → `debugging-and-error-recovery`
- 审查 → `code-review-and-quality`
- 发布 → `shipping-and-launch`

### 执行模型

对于每个请求：

1. 判断是否有技能适用（即使只有 1% 的可能性）
2. 使用 `skill` 工具调用相应的技能
3. 严格遵循技能工作流
4. 仅在所需步骤（规范、计划等）完成后才进入实现阶段

### 反合理化

以下想法是不正确的，必须忽略：

- "这对于使用技能来说太小了"
- "我可以直接快速实现这个"
- "我先收集上下文"

正确的行为：

- 始终首先检查并使用技能

这确保 OpenCode 表现得与具有完整工作流执行的 Claude Code 相似。

## 编排：角色、技能和斜杠命令

此仓库有三个可组合的层次。它们各有不同的职责，不应混淆：

- **技能**（`skills/<name>/SKILL.md`）——带有步骤和退出标准的工作流。属于*如何做*。当意图匹配时必须跳转。
- **角色**（`agents/<role>.md`）——具有视角和输出格式的角色。属于*谁来做*。
- **斜杠命令**（`.claude/commands/*.md`）——面向用户的入口。属于*何时做*。即编排层。

组合规则：**用户（或斜杠命令）是编排者。角色不调用其他角色。** 角色可以调用技能。

此仓库认可的唯一多角色编排模式是**并行发散并合并**——由 `/ship` 使用，同时运行 `code-reviewer` 和 `test-engineer` 并综合它们的报告。不要构建一个"路由器"角色来决定调用哪个其他角色；这是斜杠命令和意图映射的职责。

参见 [docs/agents.md](docs/agents.md) 了解决策矩阵，参见 [references/orchestration-patterns.md](references/orchestration-patterns.md) 了解完整的模式目录。

**Claude Code 互操作：** `agents/` 中的角色可用作 Claude Code 子智能体（从此插件的 `agents/` 目录自动发现）和 Agent Teams 团队成员（在生成时按名称引用）。两个平台约束与我们的规则一致：子智能体不能生成其他子智能体，团队不能嵌套。插件智能体会静默忽略 `hooks`、`mcpServers` 和 `permissionMode` 前置元数据字段。

## 创建新技能

> **开始之前：** 运行 [CONTRIBUTING.md](CONTRIBUTING.md#before-proposing-a-new-skill) 中的预检检查，搜索目录，检查开放的 PR（`gh pr list --state open`），确认想法符合 [docs/skill-anatomy.md](docs/skill-anatomy.md)，并在 PR 描述中论证缺口。大多数新技能想法与现有技能或开放 PR 重叠；优先扩展现有技能而非添加一个近似重复的技能。CONTRIBUTING.md 是此工作流的唯一事实来源。

此仓库中的技能是 Markdown 优先的：每个技能位于 `skills/<kebab-case-name>/SKILL.md`，带有 YAML 前置元数据（`name`、`description`），并遵循章节结构（概述、何时使用、流程、常见合理化借口、危险信号、验证）。仅当技能提供可运行的辅助脚本时才添加 `scripts/` 目录；大多数技能只有 Markdown，并且没有每个技能的 zip 包。

有关完整格式、命名约定、前置元数据规则、支持文件阈值和编写原则，请参见 [docs/skill-anatomy.md](docs/skill-anatomy.md)，这是技能结构的唯一事实来源。不要在此处重述该指南，链接到它即可。
