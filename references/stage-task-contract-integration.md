# Stage 与 Task Contract 联动规则

本文件是 `stage` 与 `delegated-task-contract` 的共享事实来源。两个技能只保留各自工作流所需的摘要；目录归属、单向索引、状态同步和封版门禁以本文件为准。

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

- `DRAFT`：边界或权威输入尚不完整，不得分派。
- `READY`：已通过分派门禁，可以随任务发送。
- `BLOCKED_BY_ARCHITECTURE`：缺少必须由人类或上游设计流程决定的语义，不得分派。
- `COMPLETED`：实现及契约合规性均有证据支持。
- `CANCELLED`：任务被撤销、替代或转移；必须记录原因，不能用于掩盖验证失败。

发生以下事件时同步 `STAGE.md`：

1. Contract 首次落盘时新增索引行；即使状态为 `DRAFT` 或 `BLOCKED_BY_ARCHITECTURE` 也必须索引。
2. 状态变化时更新镜像状态。
3. `BLOCKED_BY_ARCHITECTURE` 时在摘要列记录阻断问题。
4. `COMPLETED` 时在摘要列链接或概括 Required Evidence。
5. `CANCELLED` 时记录取消原因；任务转移到其他 Stage 时，在新 Stage 创建新的 Contract，不移动旧 Contract。
6. Contract 报告非 `none` 的 deviation 时，在摘要列记录，并把有意义的偏离写入 Stage 的“应然 vs 实然差异”表。

## Stage 封版门禁

将 Stage 标记为 `done` 前：

- `task-contract/` 下的每份 Contract 都已被 `STAGE.md` 索引，表中的每个链接也都指向真实文件。
- 所有 Contract 的正文状态均为 `COMPLETED` 或 `CANCELLED`。
- 任一 `DRAFT`、`READY` 或 `BLOCKED_BY_ARCHITECTURE` 都会阻止封版。
- 所有 deviation、阻断结论、完成证据或取消原因已经同步到 Stage 的相应摘要或差异章节。

当 Stage 进入 `abandoned`、`superseded` 或 `split` 等其他终态时，也要先处理未完成 Contract：将其完成，或标记为 `CANCELLED` 并记录原因。不得仅修改 Stage 状态而遗留仍可执行的 Contract。
