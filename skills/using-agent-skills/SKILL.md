---
name: using-agent-skills
description: 发现并调用智能体技能。在开始会话或需要发现哪个技能适用于当前任务时使用。这是一个元技能，管理所有其他技能如何被发现和调用。
---

# 使用智能体技能

## 概述

智能体技能是按开发阶段组织的一组工程工作流技能。每个技能编码了资深工程师遵循的特定流程。此元技能帮助你发现并为当前任务应用正确的技能。

## 技能发现

当任务到来时，识别开发阶段并应用相应的技能：

```
任务到来
    │
    ├── 还不知道你想要什么？ ──────→ interview-me
    ├── 有粗略概念，需要变体？ → idea-refine
    ├── 新项目/功能/变更？ ──→ spec-driven-development
    ├── 有规格，需要分解任务？ ──→ planning-and-task-breakdown
    ├── 实现代码？ ────────────→ incremental-implementation
    │   ├── RPC/存储协议/接口设计？ ──→ api-and-interface-design
    │   ├── 需要更好的上下文？ ─────→ context-engineering
    │   ├── 需要文档验证的代码？ ──→ source-driven-development
    │   └── 高风险 / 不熟悉的代码？ ──→ doubt-driven-development
    ├── 编写/运行测试？ ────────→ test-driven-development
    ├── 有东西坏了？ ──────────────→ debugging-and-error-recovery
    ├── 验证容错/故障路径？ ───────→ failure-injection-testing
    ├── 验证一致性/持久性承诺？ ───→ consistency-and-durability-verification
    ├── 审查代码？ ───────────────→ code-review-and-quality
    │   ├── 太复杂？ ─────────────→ code-simplification
    │   └── 性能问题？ ────→ performance-optimization
    ├── 提交/分支？ ─────────→ git-workflow-and-versioning
    ├── CI/CD 流水线工作？ ──────────→ ci-cd-and-automation
    ├── 弃用/迁移？ ────────→ deprecation-and-migration
    ├── 写文档/ADR？ ───────────→ documentation-and-adrs
    ├── 添加日志/指标/告警？ ───→ observability-and-instrumentation
    ├── 部署/发布？ ─────────→ shipping-and-launch
    └── 串联本轮产出物？ ──────────→ stage（用户显式调用）
```

## 核心操作行为

这些行为始终适用，跨所有技能。它们是不可谈判的。

### 1. 提出假设

在实现任何非平凡的事情之前，显式陈述你的假设：

```
我正在做的假设：
1. [关于需求的假设]
2. [关于架构的假设]
3. [关于范围的假设]
→ 现在就纠正我，否则我将按这些进行。
```

不要静默地填补模棱两可的需求。最常见的失败模式是做出错误假设并在未经检查的情况下执行它们。尽早揭示不确定性——这比返工更便宜。

### 2. 主动管理困惑

当你遇到不一致、冲突需求或不清晰的规格时：

1. **停止。** 不要带着猜测继续。
2. 说出具体的困惑点。
3. 提出权衡或提出澄清问题。
4. 在继续之前等待解决方案。

**坏：** 静默地选择一个解释并希望它是正确的。
**好：** "我在规格中看到 X，但在现有代码中看到 Y。哪一个优先？"

### 3. 在必要时提出反对

你不是应声虫。当一个方法有明显问题时：

- 直接指出问题
- 解释具体的不利影响（尽可能量化——"这增加了约 200ms 延迟"而非"这可能更慢"）
- 提出替代方案
- 如果用户在充分了解信息后否决，接受他们的决定

谄媚是一种失败模式。"当然可以！"然后实现一个坏主意对任何人都没有帮助。诚实的技术分歧比虚假的一致更有价值。

### 4. 强制执行简单性

你的自然倾向是过度复杂化。主动抵制它。

在完成任何实现之前，问：
- 这能用更少的行数完成吗？
- 这些抽象值得它们的复杂度吗？
- 一位资深工程师看了会说"你为什么不直接……"吗？

如果你构建了 1000 行而 100 行就足够，你失败了。优先选择无聊、显然的解决方案。聪明是昂贵的。

### 5. 保持范围纪律

只触碰你被要求触碰的内容。

不要做：
- 移除你不理解的注释
- "清理"与任务正交的代码
- 作为副作用重构相邻系统
- 未经明确批准删除看似未使用的代码
- 添加不在规格中的功能因为它们"看起来有用"

你的工作是外科手术般精确，而非未经请求的翻新。

### 6. 验证，不要假设

每个技能都包含一个验证步骤。在验证通过之前，任务不算完成。"看起来是对的"永远不够——必须有证据（通过的测试、构建输出、运行时数据）。

每个技能的验证是本地的检查。适用于*每个*变更的项目范围标准，无论哪个技能处于活跃状态，是完成定义：测试通过、无回归、行为在运行时验证、文档已更新。参见 `references/definition-of-done.md`。它补充每个任务的验收条件，而非替代它们。

## 要避免的失败模式

这些是看似生产力但实际上制造问题的微妙错误：

1. 未经检查就做出错误假设
2. 不管理自己的困惑——迷失时继续推进
3. 不揭示你注意到的不一致
4. 在非显而易见的决策上不提出权衡
5. 对有明显问题的方法表现出谄媚（"当然可以！"）
6. 过度复杂化代码和 API
7. 修改与任务正交的代码或注释
8. 移除你没有完全理解的东西
9. 因为没有规格而"很明显"就不写规格就构建
10. 因为"看起来是对的"就跳过验证

## 技能规则

1. **在开始工作之前检查是否有适用的技能。** 技能编码了防止常见错误的流程。

2. **技能是工作流，而非建议。** 按顺序遵循步骤。不要跳过验证步骤。

3. **多个技能可能适用。** 一个功能实现可能按顺序涉及 `idea-refine` → `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` → `test-driven-development` → `code-review-and-quality` → `code-simplification` → `shipping-and-launch`。

4. **有疑问时，从规格开始。** 如果任务是非平凡的且没有规格，从 `spec-driven-development` 开始。

## 生命周期序列

对于一个完整的功能，典型的技能序列是：

```
1.  interview-me                → 提取用户真正想要什么
2.  idea-refine                 → 精炼模糊的想法
3.  spec-driven-development     → 定义我们正在构建什么
4.  planning-and-task-breakdown  → 分解为可验证的块
5.  context-engineering         → 加载正确的上下文
6.  source-driven-development   → 对照官方文档验证
7.  incremental-implementation  → 逐切片构建
8.  observability-and-instrumentation → 随构建一起进行仪表化（与 7-9 并行运行，而非之后）
9.  doubt-driven-development    → 对进行中的非平凡决策进行交叉审查
10. test-driven-development     → 证明每个切片能工作
11. failure-injection-testing   → 用受控故障注入验证容错承诺
12. consistency-and-durability-verification → 验证一致性与持久性承诺
13. code-review-and-quality     → 合并前审查
14. code-simplification         → 在保持行为的同时减少不必要的复杂度
15. git-workflow-and-versioning  → 干净的提交历史
16. documentation-and-adrs      → 记录决策
17. deprecation-and-migration   → 淘汰旧系统并在需要时安全地迁移用户
18. shipping-and-launch         → 安全部署
```

不是每个任务都需要每个技能。一个缺陷修复可能只需要：`debugging-and-error-recovery` → `test-driven-development` → `code-review-and-quality`。

## 快速参考

| 阶段 | 技能 | 一句话摘要 |
|-------|-------|-----------------|
| 定义 | interview-me | 在任何计划、规格或代码存在之前揭示用户真正想要什么 |
| 定义 | idea-refine | 通过结构化的发散和收敛思维精炼想法 |
| 定义 | spec-driven-development | 代码之前的验收条件和需求 |
| 规划 | planning-and-task-breakdown | 分解为小型、可验证的任务 |
| 构建 | incremental-implementation | 薄垂直切片，扩展前测试每个 |
| 构建 | source-driven-development | 实现前对照官方文档验证 |
| 构建 | doubt-driven-development | 对每个非平凡决策的对抗性全新上下文审查 |
| 构建 | context-engineering | 在正确的时间提供正确的上下文 |
| 构建 | api-and-interface-design | 具有清晰契约的稳定 RPC、存储协议与接口 |
| 验证 | test-driven-development | 先写失败的测试，然后使其通过 |
| 验证 | debugging-and-error-recovery | 复现 → 定位 → 修复 → 防护 |
| 验证 | failure-injection-testing | 受控故障注入，用证据验证容错承诺 |
| 验证 | consistency-and-durability-verification | 精确承诺 + 写路径审计 + kill point + 副本对账 |
| 审查 | code-review-and-quality | 带有质量门禁的五轴审查 |
| 审查 | code-simplification | 在减少不必要复杂度的同时保持行为 |
| 审查 | performance-optimization | 先测量，只优化重要的 |
| 交付 | git-workflow-and-versioning | 原子提交、干净历史 |
| 交付 | ci-cd-and-automation | 每次变更的自动化质量门禁 |
| 交付 | deprecation-and-migration | 移除旧系统并安全迁移用户 |
| 交付 | documentation-and-adrs | 记录为什么，而不仅仅是什么 |
| 交付 | observability-and-instrumentation | 结构化日志、RED 指标、追踪、基于症状的告警 |
| 交付 | shipping-and-launch | 发布前检查清单、监控、回滚计划 |
| 串联 | stage | 串联本轮所有产出物（MISSION → 应然 → 实然 → ADR → 验证），用户显式调用 |
