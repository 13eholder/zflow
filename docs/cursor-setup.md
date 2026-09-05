# 在 Cursor 中使用 zflow

Cursor 将简短项目规则和按需技能分开管理。zflow 应放在技能目录中；项目规则只保存仓库自身长期有效的事实。

## 推荐布局

```text
your-project/
├── .cursor/
│   ├── rules/                  # 简短、稳定的项目规则
│   └── skills/                 # 按需发现的 SKILL.md
│       ├── api-and-interface-design/
│       ├── performance-optimization/
│       └── …
└── zflow/                     # 可选的上游克隆或 submodule
    └── skills/
```

不要把完整技能正文复制到 `.cursor/rules/`；这会使每次会话都加载无关内容。

## 安装技能

从本地 zflow 克隆同步：

```bash
mkdir -p .cursor/skills
rsync -a /path/to/zflow/skills/ .cursor/skills/
```

首次复制且不覆盖自定义技能：

```bash
rsync -a --ignore-existing /path/to/zflow/skills/ .cursor/skills/
```

每个目录必须包含带有效前置元数据的 `SKILL.md`：

```yaml
---
name: api-and-interface-design
description: Designs stable public APIs and protocols. Use when defining a public interface, RPC, or wire contract.
---
```

Cursor 通过 `description` 判断是否需要读取完整技能。

## 最小项目规则

在 `.cursor/rules/zflow.mdc` 中只写选择边界：

```markdown
---
description: zflow 技能选择边界
alwaysApply: true
---

普通代码探索、实现、测试、调试、重构、审查和 Git 操作使用模型原生工作流。
只有任务明确匹配 `.cursor/skills/` 中的专业领域或要求其文档产物时，才读取对应 SKILL.md。
同一请求默认只加载一个主技能，不自动串联生命周期。
```

仓库的构建命令、目录含义和安全边界应放在单独的小型 `.mdc` 规则中。

## 快速映射

| 任务 | 技能 |
|------|------|
| 公共 API、RPC 或协议 | `api-and-interface-design` |
| 一致性、持久性或恢复承诺 | `consistency-and-durability-verification` |
| 故障注入或演练 | `failure-injection-testing` |
| 性能目标或回归 | `performance-optimization` |
| 日志、指标、追踪或告警 | `observability-and-instrumentation` |
| 废弃或迁移 | `deprecation-and-migration` |
| 生产发布 | `shipping-and-launch` |
| 文档或 ADR | `documentation-and-adrs` |
| 当前官方来源验证 | `source-driven-development` |
| 明确要求规范 | `spec-driven-development` |
| 明确要求持久化计划 | `planning-and-task-breakdown` |
| 显式创建或封版 Stage | `stage` |

普通功能实现、缺陷修复、测试和代码审查不映射到技能。

## 验证

1. 在 Cursor 的规则界面确认 `.mdc` 文件已加载。
2. 确认 `.cursor/skills/` 中显示技能。
3. 用“实现这个函数”验证不会加载技能。
4. 用“设计一个向外公开的 gRPC 契约”验证会加载 `api-and-interface-design`。

如果技能选错，优先收紧技能 `description` 或项目规则，不要增加一个常驻路由技能。

## 角色

`zflow/agents/` 不一定会被 Cursor 自动加载。需要专业审查时，把 [code-reviewer](../agents/code-reviewer.md) 或 [test-engineer](../agents/test-engineer.md) 作为一次性角色提示提供给 Agent；不要把完整角色永久复制进规则。

## 故障排除

| 症状 | 检查 |
|------|------|
| 技能未出现 | 文件是否位于 `.cursor/skills/<name>/SKILL.md`，前置元数据是否有效 |
| 所有请求都触发技能 | 是否把完整技能放进 always-on 规则，描述是否过宽 |
| 工作流过时 | 从 zflow 上游重新同步 |
| 指令重复 | 删除规则中的技能正文，只保留一个来源 |
| 角色未发现 | 作为一次性角色提示显式加载 |

## 参见

- [入门指南](getting-started.md)
- [技能目录](../README.md#全部-12-个技能)
- [Cursor Rules 文档](https://docs.cursor.com/context/rules)
- [Cursor Skills 文档](https://docs.cursor.com/context/skills)
