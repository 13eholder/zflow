---
name: delegated-task-contract
description: 为 sub-agent 创建边界明确的委派契约，保护父会话已经确定的概念语义、模块职责和接口不变量。在主智能体准备向具备编辑能力的 sub-agent 或 Agent Team 成员下发工作，并需要限定编辑范围、可信前置条件、Owns / Does Not Own、Forbidden 行为、停止上报条件和合规证据时使用。此类委派必须先定位已有 Stage，在其 task-contract 目录中保存 READY 契约，并将完整契约内容随分派消息传递。
---

# 委派任务契约

## 概述

在委派实现工作前，为当前任务创建一份小型、专用的执行契约。契约把已经批准的设计投影为接收智能体可以直接执行的边界：哪些上游保证必须信任、当前任务拥有哪些职责、哪些决策已经关闭，以及何时必须停止而不能自行重新设计系统。

各类产物回答的问题不同：

- Spec 定义系统要实现什么行为。
- Plan 定义工作依赖和执行顺序。
- Task 定义一个可交付的工作单元。
- Task Contract 定义执行这个工作单元的智能体拥有什么权限，以及必须保持哪些语义。

契约限制的是架构自由，而不是普通编码自由。除非权威来源已经固定，否则局部命名、私有 helper 拆分和等价实现方式仍由接收智能体决定。

Task Contract 归属于一轮具体 Stage，但不反向索引 Stage。所属关系由 `stages/<stage-id>/task-contract/<task-id>.md` 的目录位置和 `STAGE.md` 的前向索引表达。

## 何时使用

同时满足以下条件时，本技能是必需的分派门禁：

- 工作将交给具有写权限的 sub-agent 或团队成员。
- 被委派的是实现、迁移或测试工作，而不是只读调查。
- 正确性依赖已批准的 Spec、已接受的 ADR、冻结接口、模块 ownership 或共享 invariant。

以下情况尤其应该使用：工作跨模块、多个智能体可能并行、下游不得重复上游 validation，或者过去的智能体曾擅自扩大 API、添加 fallback、创建推测性抽象或顺手清理无关代码。

以下情况不使用：只读探索、独立审查报告、拼写或格式修改，以及没有语义选择的局部机械编辑。也不要用 Contract 发明缺失的需求或架构决策；应先使用 `spec-driven-development`、`planning-and-task-breakdown`、`documentation-and-adrs` 或 `api-and-interface-design` 生成并批准相应的上游产物，再回到本技能。

如果委派本应使用 Contract，但当前没有能够唯一确定的现有 Stage，则门禁尚未满足：停止落盘与分派，请求用户选择现有 Stage 或显式创建 Stage。不要为了生成 Contract 而自动创建 Stage。

## 产物边界

| 产物 | 回答的问题 | 不负责的内容 |
|---|---|---|
| ADR | 为什么选择这项架构决策？ | 单个智能体的编辑权限 |
| Spec | 需要什么行为和验收条件？ | 如何委派执行 |
| Plan | 工作按什么依赖顺序推进？ | 创造架构事实 |
| Task | 一个工作单元交付什么结果？ | 重新解释上游决策的权限 |
| Task Contract | 当前执行者可以假设、修改和决定什么？ | 新的产品或架构决策 |
| Stage | 这轮变更有哪些产物、关系、差异和证据？ | 复制单个 Contract 的执行边界 |

Task Contract 是权威来源的投影，不是新的架构来源。如果生成 Contract 必须先选择一个尚未解决的语义，将状态设置为 `BLOCKED_BY_ARCHITECTURE`，并报告必须由人类或上游设计流程决定的问题。

目录归属、单向索引、状态同步和 Stage 封版门禁统一遵循 [Stage 与 Task Contract 联动规则](../../references/stage-task-contract-integration.md)。

## 工作流

### 1. 解析所属 Stage

在读取契约内容来源前，先为当前 Task 唯一确定一个已经存在的 Stage。解析顺序、歧义处理和目录规则见共享联动规则。

Contract 的规范路径固定为：

```text
stages/<stage-id>/task-contract/<task-id>.md
```

`task-contract/` 与该 Stage 的 `tasks/`、`spec/`、`design/`、`docs/` 和 `verify/` 平级。不要使用根级 `task-contract/` 或 `tasks/contracts/`。没有候选 Stage 或存在多个候选时，停止并请求用户决定；不得猜测归属、隐式新建 Stage 或继续分派。

### 2. 确认权威输入

只读取当前委派所需的材料：

1. 适用的人类指令和仓库规则
2. 已接受的 ADR 与冻结接口契约
3. 已批准的 Spec
4. 已批准的 Task 及其依赖状态
5. 相关代码、类型、schema、测试和 ownership 规则

检查所属 Stage 和仓库是否对 Task ID、文件名、状态词或证据格式有更细约定。更细约定可以收紧文件名和内容格式，但不能把 Contract 移出该 Stage 的 `task-contract/` 目录，也不能改变单向索引关系。

来源冲突时按以下优先级处理：

```text
显式人类指令和适用的仓库规则
    -> 已接受的 ADR 与冻结接口
    -> 已批准的 Spec
    -> 已批准的 Task
    -> Delegated Task Contract
    -> 通用工程最佳实践
```

Contract 不能授权违反更高层来源。遇到实质冲突时停止并上报，不要静默选择最方便的解释。

### 3. 提取概念边界

依据证据依次回答：

1. 当前智能体唯一拥有的结果是什么？
2. 哪些条件在其职责开始前已经得到保证？
3. 完成后必须新增哪些保证？
4. 哪些相邻职责属于其他模块或智能体？
5. 哪些值、状态转换、接口和 invariant 的语义不能改变？
6. 允许修改哪些文件、符号和 schema，允许运行哪些操作？
7. 哪些局部看似合理的改进会违反整体设计？
8. 哪些发现必须触发停止和权限升级？
9. 什么证据能够同时证明功能正确和契约合规？

前置条件是必须消费的系统保证，不是重新实现这些保证的邀请。如果真实代码没有建立某项前置条件，接收智能体必须报告不一致并停止，而不是静默增加重复 validation、normalization 或 fallback。

### 4. 明确划分权限

使用三个互不重叠的权限层级：

- **Allowed：** 智能体可以自主执行。
- **Ask First：** 执行前必须停止并请求扩大权限。
- **Forbidden：** 在当前任务下不得执行，即使它看起来能简化实现。

使用具体路径、符号、依赖方向或行为。把“尽量不要修改其他模块”改为“不得修改 `src/transport/**`；如果继续工作必须修改该目录，停止并说明原因”。

每份 Contract 必须同时包含 `Owns` 和 `Does Not Own`。只有正向 ownership 会让相邻职责继续处于模糊状态。

### 5. 编写最小契约

使用下列模板。确实不适用的可选字段可以删除，但不得删除权限边界、停止条件或证据要求。

```markdown
# Task Contract：[任务名称]

## Status

DRAFT | READY | BLOCKED_BY_ARCHITECTURE | COMPLETED | CANCELLED

## Task

- ID：[Task ID]
- Result：[一句话描述被委派的结果]

## Authority Sources

- Repository policy：[路径和相关章节]
- ADR：[路径和相关决策]
- Spec：[路径和相关要求]
- Depends on：[Task、interface、type 或 schema]

## Preconditions

- [当前职责开始前已经成立的保证]

## Postconditions

- [当前任务完成后新增的、可验证的保证]

## Owns

- [当前任务拥有的职责]

## Does Not Own

- [明确属于其他模块或 Task 的职责]

## Invariants

- [来源]：[不得改变的语义或行为]

## Interfaces

- Consumes：[冻结的输入、类型或行为]
- Produces：[冻结的输出、类型或行为]

## Allowed

- [精确的路径、符号、测试或操作]

## Ask First

- [需要扩大权限的操作]

## Forbidden

- [具体的重新设计、依赖、fallback、validation 或无关编辑]

## Verification

- [命令或检查，以及必须得到的结果]
- [架构或范围检查，以及必须得到的结果]

## Required Evidence

- 修改文件列表
- 执行的命令与结果
- Contract deviation，或 `none`
- 与真实代码冲突的上游假设，或 `none`
- 取消原因（仅 `CANCELLED` 时保留）

## Stop Conditions

- [表明某项上游保证不成立的证据]
- [继续工作所需的越权修改或未决决策]
- [仓库规则、ADR、Spec、interface 或 Task 之间的冲突]
```

Contract 应足够短，可以直接放进分派提示词。只保留会改变接收智能体行为的来源摘录、invariant、interface、路径、假设和禁止行为；每个小节优先使用少量具体条目。不要为了“完整”而在 Preconditions、Postconditions、Invariants 和 Forbidden 中逐字重复同一事实，必要时用简短引用连接相关条目。复制全部 ADR 或完整 Spec 会降低真正边界的显著性。

Contract 必须保存到步骤 1 确定的规范路径。正文不添加 Stage 字段、`STAGE.md` 链接或其他反向索引；不要把所属关系同时编码在路径和 Contract 正文中。

### 6. 执行 READY 门禁

只有同时满足以下条件，才能将 Contract 标记为 `READY`：

- Spec 和相关架构决策已经批准。
- 目标、前置条件、后置条件、Owns 和 Does Not Own 均明确。
- Allowed、Ask First 和 Forbidden 使用具体措辞。
- 每项 invariant 和 interface 都能追溯到权威来源。
- 依赖已经满足，或作为输入明确提供。
- 验证同时覆盖功能行为和架构合规性。
- Stop Conditions 覆盖错误假设、来源冲突和范围扩大。
- 没有把未解决的架构选择意外委派给执行者。

任一关键项缺失时，不得分派实现。保持 `DRAFT`，或设置为 `BLOCKED_BY_ARCHITECTURE`，然后请求最小的缺失决策。

`CANCELLED` 只用于任务被撤销、替代或转移的情况，并必须记录原因；它不是验证失败或架构阻断的替代状态。

### 7. 同步 Stage 前向索引

Contract 首次落盘以及每次状态、deviation 或证据变化后，同步所属 `STAGE.md` 的“Task Contracts（委派执行边界）”表。表中只保留 Task、Contract 链接、镜像状态和简短的 Deviation / Evidence，不复制 Contract 正文。

Contract 是执行边界、状态和 Required Evidence 的事实来源；`STAGE.md` 是这轮工作的叙事、关系和“应然 vs 实然差异”的事实来源。Contract 报告非 `none` 的 deviation 时，同时把有意义的偏离写入 Stage 差异表。禁止从 Contract 添加回到 Stage 的链接。

### 8. 并行分派前冻结共享语义

当多个智能体沿 `A -> B -> C` 等路径工作时，先定义共享语义，再创建各 Task 的 Contract：

- 哪个模块负责 validation、transport、transformation 和 consumption
- 哪些公共接口和共享类型已经冻结
- 哪些 invariant 跨越 Task 边界
- 每个可编辑路径由哪个 Task 独占

只有编辑范围不重叠，并且任何智能体都不需要另一个智能体在实现期间临时决定接口时，才可以并行分派。否则改为顺序执行。

### 9. 将契约文本随任务传递

确保接收智能体在编辑前获得完整的 `READY` Contract。不要假设它共享主会话上下文，也不要只说“遵循所有 ADR”或发送契约摘要。

Contract 已按规范路径持久化。分派时选择一种不产生第二份可漂移副本的传递方式：共享工作区时，提供精确路径并明确要求编辑前完整读取；接收智能体无法读取该文件时，在信封中嵌入一次与落盘文件逐字一致的完整 Contract。不要在同一分派信封中既引用路径又复制一份独立改写的 Contract。

使用下列分派信封：

```text
请实现下面的任务。

Spec：
[已批准的 Task 相关要求或精确路径]

Delegated Task Contract：
[完整的 READY Contract]

相关实现上下文：
[最小必要路径、符号或源码摘录]

严格遵守 Contract。如果触发 Stop Condition 或 Ask First 条件，
不要扩大范围；立即停止并报告证据和所需的最小决策。
完成时返回 Required Evidence。
```

接收智能体可以在 `Allowed` 内选择普通局部实现细节，但不能重新解释 Spec、吸收其他模块的职责，或把 `Ask First` 当成隐式授权。

### 10. 按契约验收返回结果

接受结果前：

1. 将实际修改文件与 `Allowed` 对照。
2. 检查每项 Postcondition 和 Verification 是否有证据。
3. 检查依赖方向、接口语义和 Forbidden 行为。
4. 确认 deviation 和错误上游假设被显式报告。
5. 当 Contract 包含架构约束时，不接受“测试通过”作为唯一证据。

只有功能和契约合规性都验证通过后，才能将状态设为 `COMPLETED`。随后同步 `STAGE.md` 中的镜像状态、Required Evidence 摘要和所有 deviation；同步完成前不能把 Stage 封版为 `done`。

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| “Spec 已经写清楚了一切。” | Spec 定义目标行为，通常不定义当前执行者的权限、可信前置条件和停止边界。 |
| “再验证一次更安全。” | 如果 validation 由上游独占，下游重新验证会制造第二个语义来源；前置条件为假时应停止报告。 |
| “顺手重构相邻代码会更干净。” | 代码整洁不产生编辑权限；创建后续 Task 或触发 Ask First。 |
| “加一个兼容 fallback 不会有坏处。” | 权威来源未要求的 fallback 会改变产品或协议语义。 |
| “让智能体阅读所有 ADR 后自行决定即可。” | 委派者应传递已经解决的相关边界；让更小上下文重新发现架构容易产生漂移。 |
| “所有测试通过，所以 Contract 已满足。” | 功能测试不能证明 ownership、依赖方向、接口稳定性或修改范围合规。 |

## 红旗警告

- Contract 只重复验收条件，没有描述执行权限。
- 缺少 `Does Not Own`、Preconditions 或 Stop Conditions。
- Allowed Scope 是整个仓库，或使用“尽量”“通常”“按需”等模糊词。
- Contract 发明了来源中不存在的 interface、fallback、默认值或 ownership。
- 两个并行 Contract 可以修改同一个 interface 或共享类型。
- Contract 位于仓库根目录、`tasks/contracts/` 或其他非所属 Stage 的目录。
- Contract 添加了 Stage 字段或指向 `STAGE.md` 的反向链接。
- Contract 已落盘或状态已变化，但所属 `STAGE.md` 没有对应索引或仍显示旧状态。
- 分派消息只发送 Task，没有 Contract 文本或精确路径。
- 接收智能体静默修复架构 drift 或错误前置条件。
- Verification 只检查行为，不检查修改范围和 invariant。

## 验证

分派前以及验收结果前，确认：

- [ ] Contract 来自已批准的权威来源，而非重新设计架构。
- [ ] 已唯一确定现有 Stage；没有猜测归属或隐式创建 Stage。
- [ ] Contract 位于 `stages/<stage-id>/task-contract/<task-id>.md`，并且没有 Stage 字段或反向链接。
- [ ] 所属 `STAGE.md` 已前向索引 Contract，镜像状态与正文一致。
- [ ] 它与 Spec、Plan 和 Task 的关系清晰。
- [ ] Preconditions 明确接收智能体必须信任且不得重复实现的保证。
- [ ] Postconditions 具体且可验证。
- [ ] `Owns` 与 `Does Not Own` 形成完整职责边界。
- [ ] Allowed、Ask First 与 Forbidden 使用具体措辞。
- [ ] 每项 invariant 和冻结 interface 都能追溯来源。
- [ ] 并行 Contract 具有互斥编辑权限和已冻结的共享语义。
- [ ] Verification 同时覆盖功能行为与架构合规。
- [ ] Stop Conditions 能阻止静默重新设计或扩大范围。
- [ ] 完整的 READY Contract 已随委派任务传递。
- [ ] 返回证据证明合规后，状态才变为 `COMPLETED`。
- [ ] deviation、完成证据或取消原因已同步到 Stage；非终态 Contract 会阻止 Stage 封版。
