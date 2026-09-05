# AGENTS.md

本文件为 AI 编程智能体在此仓库中处理代码时提供指导。

> **适用范围：** 本文件配置的是在 [`13eholder/zflow`](https://github.com/13eholder/zflow) 仓库本身上工作的智能体。它不应被复制到其他项目或全局智能体配置中；可复用资产是 `skills/` 中的技能，而非本文件。

## 仓库概述

为资深基础架构工程师（分布式系统、存储、网络）打造的技能集合。技能是打包的指令和脚本，用于扩展当前支持的编程智能体能力。

## OpenCode 集成

OpenCode 从本仓库的 `skills/` 目录发现技能。技能用于补充模型没有必要重复内化的专业能力，不是每个任务都要经过的路由层。

### 核心规则

- 普通代码探索、实现、测试、调试、重构、代码审查和 Git 操作直接使用模型原生工作流
- 仅当请求明确匹配下表中的专业领域或文档产物时加载技能
- 默认只加载一个主技能；不要自动串联完整生命周期
- 用户显式点名技能时，严格遵循该技能
- 技能位于 `skills/<skill-name>/SKILL.md`

### 意图 → 技能映射

智能体只在意图清晰匹配时映射：

- 公共 API、RPC、协议或模块契约 → `api-and-interface-design`
- 容错验证、故障演练或混沌工程 → `failure-injection-testing`
- 一致性、持久性或崩溃恢复承诺 → `consistency-and-durability-verification`
- 性能、尾延迟、吞吐或 I/O 放大 → `performance-optimization`
- 日志、指标、追踪或告警设计 → `observability-and-instrumentation`
- 废弃、消费者迁移或安全下线 → `deprecation-and-migration`
- 生产发布、灰度或回滚决策 → `shipping-and-launch`
- 明确要求规范 → `spec-driven-development`
- 明确要求持久化实施计划或任务清单 → `planning-and-task-breakdown`
- 文档或 ADR → `documentation-and-adrs`
- 需要官方来源验证 → `source-driven-development`
- 用户显式要求创建或封版 Stage → `stage`

如果只是新增功能、修复缺陷、编写测试、简化代码、检查 diff 或操作 Git，不加载技能。

## 编排：角色、技能和斜杠命令

此仓库有三个可组合的层次。它们各有不同的职责，不应混淆：

- **技能**（`skills/<name>/SKILL.md`）——专业领域或明确文档产物的工作流。属于*如何做*。
- **角色**（`agents/<role>.md`）——具有视角和输出格式的角色。属于*谁来做*。
- **斜杠命令**（`commands/*.toml`）——面向用户的入口。属于*何时做*。即编排层。

组合规则：**用户（或斜杠命令）是编排者。角色不调用其他角色。**

此仓库认可的唯一多角色编排模式是**并行发散并合并**——由 `/ship` 使用，同时运行 `code-reviewer` 和 `test-engineer` 并综合它们的报告。不要构建一个角色路由器。

参见 [docs/agents.md](docs/agents.md) 了解决策矩阵，参见 [references/orchestration-patterns.md](references/orchestration-patterns.md) 了解完整的模式目录。

## 创建新技能

> **开始之前：** 运行 [CONTRIBUTING.md](CONTRIBUTING.md#before-proposing-a-new-skill) 中的预检检查，搜索目录，检查开放的 PR（`gh pr list --state open`），确认想法符合 [docs/skill-anatomy.md](docs/skill-anatomy.md)，并在 PR 描述中论证缺口。大多数新技能想法与现有技能或开放 PR 重叠；优先扩展现有技能而非添加一个近似重复的技能。CONTRIBUTING.md 是此工作流的唯一事实来源。

此仓库中的技能是 Markdown 优先的：每个技能位于 `skills/<kebab-case-name>/SKILL.md`，带有 YAML 前置元数据（`name`、`description`），并遵循章节结构（概述、何时使用、流程、常见合理化借口、危险信号、验证）。仅当技能提供可运行的辅助脚本时才添加 `scripts/` 目录；大多数技能只有 Markdown，并且没有每个技能的 zip 包。

有关完整格式、命名约定、前置元数据规则、支持文件阈值和编写原则，请参见 [docs/skill-anatomy.md](docs/skill-anatomy.md)，这是技能结构的唯一事实来源。不要在此处重述该指南，链接到它即可。
