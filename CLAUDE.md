# zflow

这是 zflow 项目——面向基础架构工程（分布式系统、存储、网络）的生产级工程技能集合。

> **适用范围：** 本文件配置的是在 [`13eholder/zflow`](https://github.com/13eholder/zflow) 仓库本身上工作的智能体，而非其他项目。不要将其复制到其他项目或全局智能体配置中；可复用资产是 `skills/` 中的技能。

## 项目结构

```
skills/       → 核心技能（每个目录一个 SKILL.md）
agents/       → 可复用的智能体角色（code-reviewer、test-engineer）
hooks/        → 会话生命周期钩子
.claude/commands/ → 斜杠命令（/spec、/plan、/build、/test、/review、/code-simplify、/ship）
references/   → 补充性检查清单（测试、性能、可观测性）
evals/        → 技能评估用例 + 框架（参见 evals/README.md）
docs/         → 不同工具的设置指南
```

## 按阶段分类的技能

**定义：** interview-me、idea-refine、spec-driven-development
**规划：** planning-and-task-breakdown
**构建：** incremental-implementation、test-driven-development、context-engineering、source-driven-development、doubt-driven-development、api-and-interface-design
**验证：** debugging-and-error-recovery, failure-injection-testing, consistency-and-durability-verification
**审查：** code-review-and-quality、code-simplification、performance-optimization
**串联：** stage（跨阶段文档串联，用户显式调用）
**发布：** git-workflow-and-versioning、ci-cd-and-automation、deprecation-and-migration、documentation-and-adrs、observability-and-instrumentation、shipping-and-launch

## 约定

- 每个技能位于 `skills/<name>/SKILL.md`
- YAML 前置元数据包含 `name` 和 `description` 字段
- 描述以技能的功能开头（第三人称），后跟触发条件（"Use when..."）
- 每个技能包含：概述、何时使用、流程、常见合理化借口、危险信号、验证
- 参考资料放在 `references/` 中，而非技能目录内
- 仅当内容超过 100 行时才创建支持文件

## 贡献

在添加新技能或大幅修改现有技能之前，运行 [CONTRIBUTING.md](CONTRIBUTING.md#before-proposing-a-new-skill) 中的预检检查：搜索目录，检查开放的 PR，确认想法符合 [docs/skill-anatomy.md](docs/skill-anatomy.md)，并论证缺口。优先扩展现有技能而非添加近似重复的技能。CONTRIBUTING.md 是此工作流的唯一事实来源；不要在此处或其他地方重述其检查清单，链接到它即可。

## 命令

- 测试命令——不适用（这是一个文档项目，验证通过 `node scripts/validate-skills.js` 和 `node scripts/run-evals.js` 完成）
- 验证：检查所有 SKILL.md 文件是否包含有效的 YAML 前置元数据（含 name 和 description）
- 评估：`node scripts/run-evals.js`——每个技能的触发/路由评估（CI）；`--behavioral <skill>` 用于分级运行

## Pull Request (PR)

PR 目标为上游仓库的默认分支。在典型的 fork 设置中，上游远程是 `upstream`，你的 fork 是 `origin`，但确切的远程名称并非重点。

- 在开启 PR 之前，搜索上游仓库的开放 PR 和 issue，查找涉及相同文件或规则的工作。如果有任何重叠，应协调处理（在此基础上构建、对齐规则或在其合并后变基），而非开启一个冲突的 PR。
- 优先选择小而专注的 PR，而非对广泛共享的文件进行大型重构（例如 `scripts/` 下的文件），因为这些重构更有可能与正在进行中的工作冲突。

## 边界

- 始终：在创建新技能目录之前运行 CONTRIBUTING.md 中的预检检查
- 始终：新技能遵循 skill-anatomy.md 格式
- 始终：在开启新 PR 之前检查上游仓库的开放 PR 和 issue 是否有重叠
- 绝不：添加模糊建议而非可操作流程的技能
- 绝不：在不同技能间重复内容——应引用其他技能
