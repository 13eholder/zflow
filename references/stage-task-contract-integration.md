# Stage 与 Task Contract 联动规则

本文件是 `stage` 与 `task-contract` 的共享事实来源。两个技能只保留各自工作流所需的摘要；目录归属、单向索引、状态同步和封版门禁以本文件为准。

## 归属与目录

Task Contract 是具体 Stage 内的执行治理产物，不是仓库根级产物，也不放在 `tasks/` 下。规范路径为：

```text
stages/<stage-id>/
  STAGE.md
  spec/
  design/
  tasks/
  task-contract/
    <task-id>.md
  docs/
  verify/
```

`task-contract/` 与 `spec/`、`design/`、`tasks/`、`docs/`、`verify/` 平级。不要创建根级 `task-contract/`，也不要使用 `tasks/contracts/`。

每份 Contract 必须归属于一个已经存在且能够唯一确定的 Stage。按以下顺序解析：

1. 用户或当前会话明确指定的 Stage。
2. 承载该 Task 的 `stages/<stage-id>/tasks/` 路径。
3. 已批准的 Task、Plan 或 Spec 唯一引用的 Stage。

如果没有候选 Stage，或存在多个无法排除的候选，不要创建 Contract、不要分派任务，也不要隐式创建 Stage；请求用户选择现有 Stage 或显式创建 Stage。Stage 的创建仍完全由用户决定。

新建 Contract 和执行新增工作只允许在活动 Stage（`draft`、`in-progress`、`revising`）中进行。`draft` 可准备契约，但编码前必须满足 Stage 的前置 ADR 要求。已封版 Stage 的增量先按 `stage` 将 `done` 转为 `revising` 并同步 INDEX，再创建新 Task／Contract；其他终态不能通过此流程重开。

## 单向索引

所属 Stage 的 `STAGE.md` 在“Task Contracts（委派执行边界）”章节中前向索引 Contract：

| Task | Contract | 状态 | Deviation / Evidence |
|------|----------|------|----------------------|
| TASK-001 | [TASK-001](./task-contract/TASK-001.md) | READY | — |

索引遵循以下约束：

- Contract 文件是执行边界、Contract 状态和 Required Evidence 的事实来源。
- `STAGE.md` 只保存链接、镜像状态和简短摘要，不复制 Contract 正文。
- Contract 不包含 Stage 字段、`STAGE.md` 链接或其他反向索引。所属关系由目录位置和 `STAGE.md` 的前向索引表达。
- 如果表中状态与 Contract 正文冲突，以 Contract 为准并修复表格；不得从表格反向改写 Contract。

## 状态与同步事件

Contract 使用以下状态：

```text
DRAFT -> READY -> COMPLETED
   |       |          
   +-------+-------> CANCELLED
   |
   +-> BLOCKED_BY_ARCHITECTURE -> READY | CANCELLED
```

相关上游输入变化时，尚未完成的 `READY` 必须退回 `DRAFT`；存在未决架构语义时转为 `BLOCKED_BY_ARCHITECTURE`。暂停受影响执行，更新输入版本并重新通过 READY 门禁后才能继续。具体 AC 映射和输入核验要求以 `task-contract` 为准。

- `DRAFT`：边界或权威输入尚不完整，不得分派。
- `READY`：已通过分派门禁，可以随任务发送。
- `BLOCKED_BY_ARCHITECTURE`：缺少必须由人类或上游设计流程决定的语义，不得分派。
- `COMPLETED`：实现及契约合规性均有证据支持。
- `CANCELLED`：任务被撤销、替代或转移；停止该契约下的执行并记录原因及已有变更的处置，不能用于掩盖验证失败。取消状态本身不代表残留变更可以交付。

终态 Contract 保留原输入版本和证据，后续变化使用新 Task ID 与新 Contract。父 Task 的交付完成要求全部有效 AC 已验证且对应 Contract 均为 `COMPLETED`；撤销或替代单独记录，不能把 `CANCELLED` 计为验收通过。

## 取消后的变更处置

取消时先停止原执行者继续写入，核对该任务已经产生的全部变更（包括已提交和未提交的部分），在 Contract 的 Required Evidence 中记录变更集定位及以下处置之一：

- **无变更**：记录核对依据，确认没有该任务留下的改动。
- **已撤回**：记录撤回范围、结果及必要验证；只处理该任务的变更，保留其他任务或用户的工作。
- **已接管**：引用后续 Task 和已接收这些具体变更的 `READY` Contract；新契约必须覆盖残留变更的行为、权限及验证，不能只写一个未来任务标题。原执行者的权限终止，后续修改按新契约执行。

暂未处置时可以先标记 `CANCELLED` 以终止执行，但必须显式记录“处置待完成”并同步 Stage 阻断项。取消后追加处置证据时保留原始变更记录，不覆盖历史。处置进展同步到 Stage，直至阻断解除。

接管不等于验收：原 Stage 封版时，仍保留在本次交付中的残留变更必须已由接管 Contract 验收至 `COMPLETED`；接管者尚未完成时不能随本次交付封版。若变更已从本次交付撤出，记录撤出及验证证据；跨 Stage 转移也适用，不能仅凭接收方存在就放行。

该处置规则以本节为事实来源，`task-contract` 提供证据字段，`stage` 消费处置结果作为终态检查依据。

发生以下事件时同步 `STAGE.md`：

1. Contract 首次落盘时新增索引行；即使状态为 `DRAFT` 或 `BLOCKED_BY_ARCHITECTURE` 也必须索引。
2. 状态变化时更新镜像状态。
3. `BLOCKED_BY_ARCHITECTURE` 时在摘要列记录阻断问题。
4. `COMPLETED` 时在摘要列链接或概括 Required Evidence。
5. `CANCELLED` 时记录取消原因及变更处置；任务转移到其他 Stage 时，在新 Stage 创建新的 Contract，不移动旧 Contract。
6. Contract 报告非 `none` 的 deviation 时，在摘要列记录，并把有意义的偏离写入 Stage 的“应然 vs 实然差异”表。
7. 上游相关变化导致 READY 失效时，同步回退状态及原因；恢复 READY 时同步新的核验依据。

需求、接口或架构约束偏离必须先获上游批准，并反映在当前有效来源及 Contract 中。Stage 的差异表只记录依据；临时例外须明确范围、期限和恢复条件。

## Stage 封版门禁

将 Stage 标记为 `done` 前：

首次封版和从 `revising` 再次封版适用同一组门禁。修订开始前同步 `done -> revising`，不得在保持 `done` 的同时新增未完成 Contract。

- `task-contract/` 下的每份 Contract 都已被 `STAGE.md` 索引，表中的每个链接也都指向真实文件。
- 所有 Contract 的正文状态均为 `COMPLETED` 或 `CANCELLED`。
- 所有 `CANCELLED` Contract 的变更处置都有证据；本次交付中不存在无人接管或未经验收的取消任务残留。仅有取消原因、接管链接或通过现有回归测试均不满足此门禁。
- 所有有效 Task 已通过 AC 验收和契约检查；撤销或替代的任务有明确原因，不作为已交付任务统计。
- 任一 `DRAFT`、`READY` 或 `BLOCKED_BY_ARCHITECTURE` 都会阻止封版。
- 所有 deviation、阻断结论、完成证据或取消原因已经同步到 Stage 的相应摘要或差异章节。

当 Stage 进入 `abandoned`、`superseded` 或 `split` 等其他终态时，也要先处理未完成 Contract：将其完成，或标记为 `CANCELLED` 并记录原因。不得仅修改 Stage 状态而遗留仍可执行的 Contract。

这些非交付终态同样需要明确取消变更的处置与归属；可以交给活动 Stage 的 READY Contract 继续完成，但不代表变更已通过验收或可交付。无人接管且未撤回的残留变更会阻止终态转换。
