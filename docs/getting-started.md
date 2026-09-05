# zflow 入门指南

zflow 适用于任何能够发现或加载 Markdown 技能的 AI 编程智能体。它只补充专业领域和明确文档产物；代码探索、实现、测试、调试、重构、diff 自审与 Git 操作继续使用智能体的原生能力。

## 最快开始

```bash
git clone https://github.com/13eholder/zflow.git
npx skills add 13eholder/zflow
```

也可以只安装一个技能：

```bash
npx skills add 13eholder/zflow --skill api-and-interface-design
```

各平台的原生安装方式见本目录中的对应设置指南。

## 什么时候加载技能

默认不加载技能。仅当请求清晰匹配以下领域或产物时，加载一个主技能：

| 任务 | 技能 |
|------|------|
| 公共 API、RPC、协议或模块契约 | `api-and-interface-design` |
| 一致性、持久性或崩溃恢复承诺 | `consistency-and-durability-verification` |
| 故障注入、故障演练或混沌工程 | `failure-injection-testing` |
| 延迟、吞吐、IOPS 或放大问题 | `performance-optimization` |
| 日志、指标、追踪或告警设计 | `observability-and-instrumentation` |
| 废弃、迁移或安全下线 | `deprecation-and-migration` |
| 生产发布、灰度与回滚决策 | `shipping-and-launch` |
| 工程文档或 ADR | `documentation-and-adrs` |
| 需要官方来源验证 | `source-driven-development` |
| 明确要求结构化规范 | `spec-driven-development` |
| 明确要求持久化计划或任务清单 | `planning-and-task-breakdown` |
| 显式创建或封版一轮工作的 Stage | `stage` |

如果请求只是“实现这个功能”“修复这个错误”“写测试”“简化代码”或“审查 diff”，不需要额外技能。

## 如何加载

优先使用平台原生的技能目录和自动发现机制。平台没有技能机制时，可把当前任务所需的单个 `SKILL.md` 放入会话上下文；不要把全部技能永久拼接进规则文件。

显式调用示例：

```text
请使用 api-and-interface-design 设计这个公共 RPC 契约。
请使用 documentation-and-adrs 把这项架构决策记录为 ADR。
```

每个技能都包含触发条件、流程、危险信号和验证标准。技能引用补充清单时，再按需读取 `references/` 中的对应文件。

## 斜杠命令

当前命令集只保留三个明确入口：

| 命令 | 产物或关卡 |
|------|------------|
| `/spec` | 生成并确认 `SPEC.md` |
| `/plan` 或 Antigravity 的 `/planning` | 生成 `tasks/plan.md` 与 `tasks/todo.md` |
| `/ship` | 并行审查并形成 go/no-go 与回滚方案 |

规范和计划是可选的持久化产物，不是所有编码请求的前置条件。日常实现直接由智能体完成，并使用仓库已有命令验证。

## 专业角色

`agents/` 提供两个可直接选择的角色：

| 角色 | 用途 |
|------|------|
| `code-reviewer` | 对具体变更做独立代码审查 |
| `test-engineer` | 分析测试策略与覆盖缺口 |

`/ship` 会在发布前并行调用两个角色并由主智能体合并结果。其他情况下直接选择需要的角色即可。

## 参考资料

| 文件 | 用途 |
|------|------|
| `definition-of-done.md` | 通用完成标准 |
| `testing-patterns.md` | 基础设施与分布式系统测试模式 |
| `performance-checklist.md` | 性能测量与诊断清单 |
| `observability-checklist.md` | 可观测性设计与发布检查 |
| `orchestration-patterns.md` | 多角色编排边界 |

## 使用原则

1. 先判断任务是否真的需要专业技能。
2. 默认只加载一个主技能，避免技能链和重复流程。
3. 文档类技能只在用户需要相应产物时触发。
4. 修改代码后仍应运行相关测试、检查 diff 并报告证据；这些属于智能体原生工作流。
5. 高风险迁移和生产发布必须保留显式确认与回滚边界。
