---
name: stage
description: 创建和管理 Stage 文档——串联一轮工作中的所有技能产出物（MISSION、应然文档、实现计划、实然文档、ADR、验证结果），记录应然与实然的差异及其原因，并在封版时提炼学习摘要。当用户显式请求"创建 Stage""开始一个 Stage""封版 Stage"时使用。Stage 创建完全由用户决定，无自动触发条件。
---

# Stage

## 概述

Stage 是一轮工程变更的**串联文档**——它不是替代任何一个技能产出物，而是记录每个技能产出了什么、这些产出之间是什么关系、以及这一轮变更的完整故事。

Stage 回答三个问题：
1. **我们本来要做什么？**（MISSION + 应然文档）
2. **我们实际做成了什么？**（实然文档 + ADR）
3. **为什么会有差异？**（应然 vs 实然差异 + 学习摘要）

```
                          STAGE.md
                   （串联层 / 索引 + 叙事）
                          │
    ┌─────────┬─────────┬─┴─────────┬─────────┐
    │         │         │           │         │
  MISSION  应然文档   实现计划    实然文档   验证
  (目标)   (设计)    (plan+todo)  (结果)    (证据)
                                    │
                                  ADR
                              (强制，每个 Stage 至少一篇)
```

## 何时使用

**Stage 创建完全由用户决定。** 仅在用户显式请求时创建，无自动触发条件。

用户通常以以下方式发起：
- "创建 Stage" / "开始一个 Stage"
- "为这轮工作建 Stage"
- "封版 Stage" / "Seal Stage"
- `/plan` 输出计划后，用户对"是否需要 Stage 文档？"回答"是"

**典型适用场景**（供用户参考，非触发规则）：
- 跨越多个任务、构成一个逻辑整体的变更
- 跨越多个模块的新功能
- 改变内部结构但行为不变的重构
- 生产环境缺陷的完整修复链
- 需要记录架构决策的任何变更

**不会自动触发：**
- 单个孤立任务或机械性变更不自动创建
- 纯文档更新不自动创建
- Agent 不会根据任务数量或跨模块程度自行判断——必须用户确认

## Stage 类型

| 类型 | 动机 | 成功标准 | 应然 vs 实然 | 文档重心 |
|------|------|---------|-------------|---------|
| **feat** | 添加新能力 | 新行为出现且符合规范 | 有差异是正常的，必须记录 | spec + api-contract + api-doc |
| **opt** | 改善已有行为 | 指标达到目标值 | 简要记录优化效果对比 | 性能基线 + 优化结果 |
| **debug** | 修复错误行为 | 问题不再复现 + 回归测试覆盖根因路径 | 应然=实然（修复即目标） | 现象 + 根因 + 修复策略 + 预防措施 |
| **refactor** | 改变内部结构，行为不变 | 所有已有行为保持不变，回归测试全绿 | 应然=实然是硬性要求 | 架构设计 + 结构变更说明 |

## Stage 生命周期

```
/plan 输出后               /build 过程中              /build 全部完成后          /ship 执行时
     │                          │                          │                      │
     ▼                          ▼                          ▼                      ▼
  创建骨架                  逐任务追加文档               封版 STAGE.md            检查 Stage 存在
  (MISSION +               (应然文档链接、              (实然文档、ADR、          (pre-launch
   应然文档路径、            实现计划链接)               差异分析、验证结果、       checklist
   实现计划链接)                                        学习摘要)                 阻断项)
```

### 创建（骨架阶段）

在 `/plan` 输出 `tasks/plan.md` 和 `tasks/todo.md` 后，Agent 询问用户是否需要 Stage 文档。用户确认后：

1. 创建 `stages/<stage-id>/` 目录（`stage-id` 为 kebab-case 简短标题）
2. 创建 `STAGE.md` 骨架，预填：
   - 类型（feat | opt | debug | refactor）
   - 状态设为 `draft`
   - 决策者
   - MISSION（从 spec 中提取）
   - 应然文档路径（标记为 TODO）
   - 实现计划链接（填入 `tasks/plan.md` 和 `tasks/todo.md`）
   - 实然文档（标记为 TODO——实现完成后填写）
   - ADR（标记为 TODO——每个 Stage 至少一篇，实现完成后填写）
   - 验证结果（标记为 TODO）
3. 在 `stages/INDEX.md` 中追加一行

### 填充（构建阶段）

在 `/build` 执行过程中：
- 每完成一个任务，无需修改 STAGE.md
- 当应然文档（spec、api-contract）产出时，更新对应链接，去掉 TODO 标记

### 封版（完成后）

所有任务完成且验证通过后，Agent 提醒用户封版。用户确认后：

1. 填充实然文档链接（api-doc、ADR）
2. 填写**应然 vs 实然差异表**（含"是否回溯更新应然文档"列）
3. 填写验证结果
4. 提炼**学习摘要**（"下次这样做"和"下次别这样做"）
5. 状态改为 `done`
6. 更新 `stages/INDEX.md` 对应行状态

### 检查（发布前）

`/ship` 的 pre-launch checklist 中包含：
- "□ 重大变更是否有对应的 Stage 文档？"——如果本轮工作曾创建 Stage，此为阻断项

## Stage 模板

以下是 `stages/<stage-id>/STAGE.md` 的规范模板：

```markdown
# Stage: [简短标题]

**类型**: feat | opt | debug | refactor
**日期**: YYYY-MM-DD — YYYY-MM-DD
**状态**: draft | in-progress | done | abandoned | superseded | split
**决策者**: @username

---

## MISSION（本轮目标）

<!-- feat / opt / refactor 使用标准 MISSION -->

- **目标**: [一句话描述本轮要达成什么]
- **用户**: [谁会受益]
- **成功标准**: [如何知道完成了——具体、可验证的条件]
- **约束**: [绑定限制——技术、资源、时间]
- **不做**: [显式排除的内容及原因]

<!-- debug 类型替换为以下结构：-->
<!--
- **现象**: [用户做了什么、看到了什么、应该看到什么]
- **影响**: [影响范围、持续时间、数据完整性风险]
- **根因假设**: [初步判断——实现完成后更新为确认根因]
- **修复策略**: [止血方案 + 根因修复 + 预防措施]
- **成功标准**: [问题不再复现、回归测试覆盖根因路径、同类问题有静态检查]
-->

→ 详见 [MISSION.md](./MISSION.md)

---

## 应然文档（我们计划怎么做）

| 文档 | 来源技能 | 说明 |
|------|---------|------|
| [spec/xxx.md](./spec/xxx.md) | spec-driven-dev | 功能规范 |
| [design/api-contract.md](./design/api-contract.md) | api-and-interface | API 契约 |
| [design/xxx.md](./design/xxx.md) | — | [补充说明] |

> 实现开始前填充。若某类文档本轮不涉及，删除对应行。

---

## 实现计划

| 文档 | 来源技能 | 说明 |
|------|---------|------|
| [tasks/plan.md](./tasks/plan.md) | planning-and-task | 技术方案 |
| [tasks/todo.md](./tasks/todo.md) | planning-and-task | 原子任务列表 |

---

## 实然文档（我们实际做成了什么样）

> 实现完成后填充本节。

| 文档 | 来源技能 | 说明 |
|------|---------|------|
| [docs/api/xxx.md](./docs/api/xxx.md) | documentation-and-adrs | 实际 API 文档 |
| [docs/adr/XXX-title.md](./docs/adr/XXX-title.md) | documentation-and-adrs | 架构决策记录（必填，每个 Stage 至少一篇） |

### ADR（必填）

每个 Stage **必须**产出至少一篇 ADR。ADRs 记录关键的架构决策及其上下文。

| ADR | 决策内容 | 替代方案 |
|-----|---------|---------|
| [ADR-XXX](./docs/adr/XXX.md) | [一句话描述决策] | [被拒绝的方案及原因] |

**ADR 内容要求：**
- 记录"为什么选择 A 而不是 B"
- 列出被考虑并拒绝的替代方案及拒绝原因
- 描述决策的约束条件和后果
- 如果该决策与已有 ADR 相关，显式引用

**不同类型 Stage 的 ADR 重心：**

| Stage 类型 | ADR 典型内容 |
|-----------|-------------|
| **feat** | 为什么选这个架构/框架/协议；数据模型的设计取舍 |
| **opt** | 为什么选这个优化策略；为什么不选其他方案（如缓存 vs 索引优化） |
| **debug** | 根因为什么会产生；为什么选这个修复方案；预防措施的设计 |
| **refactor** | 为什么选这个新结构；为什么不统一某些边界情况；新旧结构的对比 |

---

## 应然 vs 实然差异

> 实现完成后填写。记录计划与实际之间的每个有意义的偏离。

| 差异 | 应然（计划） | 实然（结果） | 原因 | 是否回溯更新应然文档 |
|------|------------|------------|------|-------------------|
| [简述] | [计划怎么做] | [实际怎么做] | [为什么偏离] | 是 / 否 |

**"是否回溯更新应然文档"列说明：**
- **是**：该差异被认定为正确的设计方向，已回头修改 spec 或 api-contract 使其与实然一致
- **否**：该差异是临时妥协或折中，应然文档保留原样以便后续 Stage 参考
- 所有标"否"的差异行是下一轮 backlog 的候选输入

---

## 验证结果

| 检查项 | 状态 | 证据 |
|--------|------|------|
| [验收标准 1] | ✅ / ❌ | [测试报告、性能数据、截图等] |
| [验收标准 2] | ✅ / ❌ | [证据] |
| 无回归 | ✅ / ❌ | CI 运行链接 |

→ 详见 [VERIFY.md](./VERIFY.md)

---

## 学习摘要

> 封版时填写。不超过两句话。

- **下次这样做**：[本轮做对了什么——值得在其他 Stage 中复用]
- **下次别这样做**：[本轮做错了什么——应该避免、警惕或改进]

---

## 关联

- **上一轮 Stage**: [STAGE-XXX](../stage-XXX/STAGE.md)（或"无"）
- **下一轮计划**: [简述，或"无"]
```

---

## 增量（封版后追加）

Stage 封版（状态变为 `done`）后，如果发现小问题需要修补，但不构成一个新的 Stage，可在 STAGE.md 末尾追加增量章节：

```markdown
---

## 增量 1（2026-07-28）

- **变更**: [简述修补了什么]
- **原因**: [为什么封版后还需要这个修补]
- **影响范围**: [哪些文件/模块]
```

追加增量时：
- Stage 状态保持 `done`，不退回 `in-progress`
- 增量条目按时间顺序追加
- 如果修补涉及新的 ADR 决策，追加到实然文档的 ADR 表中并标注 `[增量 1]`
- 累计 3 个以上增量时，考虑是否应该新建一个 Stage 而非继续追加

---

## INDEX.md

`stages/INDEX.md` 是所有 Stage 的导航入口。每个 Stage 创建和封版时维护。

```markdown
# Stage 索引

| ID | 标题 | 类型 | 状态 | 涉及模块 | 日期 |
|----|------|------|------|---------|------|
| 001 | raft-election-optimization | opt | done | consensus, rpc | 2026-07-15 — 2026-07-17 |
| 002 | wal-checksum-verification | feat | done | storage, wal | 2026-07-18 — 2026-07-20 |
| 003 | replica-sync-refactor | refactor | done | replication, net | 2026-07-22 — 2026-07-23 |
| 004 | multi-az-placement | feat | abandoned | placement, scheduler | 2026-07-23 |
```

**维护规则：**
- Stage 创建时追加一行，状态为 `draft`
- Stage 封版时更新状态为 `done`
- Stage 状态变为 `abandoned`、`superseded` 或 `split` 时同步更新
- `涉及模块` 列出受影响的顶层模块/目录，便于按模块检索

---

## 状态模型

| 状态 | 含义 | 何时使用 |
|------|------|---------|
| `draft` | 骨架已创建，实现尚未开始 | Stage 创建后 |
| `in-progress` | 正在实现中 | `/build` 执行期间（可选使用） |
| `done` | 按计划完成，已封版 | 所有任务完成、验证通过、学习摘要已写 |
| `abandoned` | 中途放弃 | 方向错了、需求取消、被更高优先级打断 |
| `superseded` | 被另一个 Stage 覆盖 | Stage-B 的范围吞掉了 Stage-A |
| `split` | 拆分成了多个更小的 Stage | Stage 过大，拆分为独立子 Stage |

**`abandoned` 的处理：**
- 更新 MISSION 章节，追加一段"放弃原因"
- ADR 表中至少保留一篇，记录"为什么不继续做"
- 学习摘要照常填写——放弃的教训往往比成功的更有价值
- 被放弃的 Stage 中已完成的部分代码/文档是否需要回滚，由决策者决定并在 ADR 中记录
- `关联` 章节的"下一轮计划"改为"无（已放弃）"

**`superseded` 的处理：**
- 更新 MISSION 章节，追加一段"被哪个 Stage 取代及原因"
- 在 `关联` 章节添加"被取代于: [STAGE-XXX](../stage-XXX/STAGE.md)"
- 状态改为 `superseded`
- 不在被取代的 Stage 上继续追加增量——所有后续工作转移到取代它的 Stage

**`split` 的处理：**
- 更新 MISSION 章节，追加一段"拆分为哪些子 Stage 及原因"
- 在 `关联` 章节添加"拆分为: [STAGE-XXX](../stage-XXX/STAGE.md), [STAGE-YYY](../stage-YYY/STAGE.md)"
- 状态改为 `split`
- 原始 Stage 不再追加增量——所有工作转移到子 Stage

## 目录结构

```
stages/
  INDEX.md                      ← 索引，每行一个 Stage
  001-raft-election-optimization/
    STAGE.md                    ← Stage 串联文档
    MISSION.md                  ← 详细目标描述（可选，复杂项目推荐）
    spec/                       ← 应然：功能规范
    design/                     ← 应然：协议契约、数据布局
    tasks/
      plan.md                   ← 实现计划
      todo.md                   ← 任务列表
    docs/
      protocol/                 ← 实然：协议文档、RPC 接口
      adr/                      ← 实然：架构决策记录（必填）
    verify/                     ← 验证证据
      fault-injection-report.md
      consistency-check.txt
      perf-before-after.json
  002-wal-checksum/
    ...
    ...
```

> 目录结构是推荐范式，非强制。核心约束只有两条：**STAGE.md 必须存在**，**每个 Stage 至少包含一篇 ADR**。

## 与其他技能的交互

| 技能 | 交互方式 |
|------|---------|
| **spec-driven-development** | Stage 的 MISSION 从 spec 的 Objective 提取 |
| **planning-and-task-breakdown** | `/plan` 输出后，Agent 询问是否创建 Stage 骨架 |
| **api-and-interface-design** | 应然文档中的协议契约（gRPC/protobuf）和实然文档中的接口文档都链接到 Stage |
| **failure-injection-testing** | 涉及容错与故障恢复时，故障注入方案和混沌实验报告链接到 Stage 实然文档 |
| **consistency-and-durability-verification** | 涉及存储或状态复制时，一致性/持久性校验报告链接到 Stage 验证结果 |
| **incremental-implementation** | `/build` 全部完成后，Agent 提醒封版 Stage |
| **documentation-and-adrs** | ADR 是 Stage 的必填产出；每个 Stage 至少一篇 |
| **shipping-and-launch** | `/ship` 检查 Stage 是否存在（本轮曾创建则阻断） |

## 常见合理化借口

| 合理化借口 | 现实 |
|-----------|------|
| "这轮改动太小，不需要 Stage" | 如果改动小到不需要 Stage，那它可能也不需要 ADR。但用户已经决定创建 Stage——相信用户的判断。 |
| "需求太简单，应然和实然不会有什么差异" | 差异无处不在——即使最简单的变更也可能在实现中偏离计划。Stage 的核心价值恰好是记录这些差异。 |
| "先把代码写了，Stage 之后补" | 封版前的 Stage 是活的目录，不需要一次性写完。但事后补写意味着差异分析依赖记忆——记忆是不可靠的。 |
| "这个不需要 ADR" | 每个 Stage 都有至少一个值得记录的决策——哪怕只是"我们选择了最简单的实现方式，因为当前约束不允许更复杂的方案"。 |
| "已经 `abandoned` 了，学习摘要没意义" | 放弃的教训往往比成功的更有价值。记录"为什么放弃"至少和记录"为什么成功"同等重要。 |
| "差异表里标'否'就够了，不需要解释" | 差异表的每一行都是未来决策的输入。标"否"的行告诉下一个接手的人"这里有技术债，而且是有意留下的"。 |
| "INDEX.md 可以以后补" | INDEX.md 的价值随 Stage 数量增长——第一个 Stage 时不觉得，第十个时就成了必需品。从一开始就维护。 |

## 红旗警告

- 创建了 STAGE.md 但 MISSION 为空——骨架的价值在 MISSION，没有目标的 Stage 只是占位符
- 实然文档有 API 文档但没有对应 ADR——违反了"每个 Stage 至少一篇 ADR"的规则
- 差异表为空但用户提到过实现中的偏离——差异没有被捕获
- 学习摘要写"无"或"一切顺利"——每个 Stage 都有教训，找不到说明反思不够深
- `abandoned` 的 Stage 没有"放弃原因"——丢失了最有价值的信息
- INDEX.md 中某行长期处于 `draft` 状态——要么推进实现，要么标记为 `abandoned`，不要让骨架腐烂
- 增量章节累计 3+ 条但未考虑拆分新 Stage——说明本轮范围判断有误，应反思而非继续追加
- 决策者字段为空——多人协作时这会导致决策追溯链断裂

## 验证

创建 Stage 骨架后：
- [ ] `stages/<stage-id>/STAGE.md` 存在
- [ ] Stage 类型（feat | opt | debug | refactor）已填写
- [ ] 状态为 `draft`
- [ ] 决策者已填写
- [ ] MISSION 已填写（标准格式或 debug 格式，根据类型选择）
- [ ] 实现计划链接指向 `tasks/plan.md` 和 `tasks/todo.md`
- [ ] `stages/INDEX.md` 已追加对应行

封版 Stage 后：
- [ ] 实然文档链接已填充
- [ ] ADR 至少一篇，已链接到实然文档表
- [ ] 应然 vs 实然差异表已填写（无差异则显式写"无差异"并简要说明原因）
- [ ] 差异表中每行都标了"是否回溯更新应然文档"
- [ ] 验证结果表已填写，每个检查项有状态和证据
- [ ] 学习摘要已填写（两句话，非空泛）
- [ ] 状态改为 `done`（或其他终态）
- [ ] `stages/INDEX.md` 对应行状态已同步更新
