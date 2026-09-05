# 在 Antigravity CLI (agy) 中使用 zflow

zflow 可作为原生插件安装，提供 13 个按需技能、两个专业角色和三个自定义命令。

## 安装

从远程仓库安装：

```bash
agy plugin install https://github.com/13eholder/zflow.git
```

从本地克隆安装：

```bash
git clone https://github.com/13eholder/zflow.git
agy plugin install /path/to/zflow
```

验证：

```bash
agy plugin list
agy plugin validate /path/to/zflow
```

## 命令

| 命令 | 功能 | 技能 |
|------|------|------|
| `/spec` | 创建结构化规范 | `spec-driven-development` |
| `/planning` | 创建依赖排序的计划与任务清单 | `planning-and-task-breakdown` |
| `/ship` | 并行发布前审查并形成 go/no-go | `shipping-and-launch` |

Antigravity 使用 `/planning`，避免与内置计划命令冲突。普通实现、测试、调试、重构和 Git 操作由智能体原生工作流处理，不提供额外命令包装。

## 技能发现

Antigravity 从插件的 `skills/` 目录发现技能，并根据前置元数据中的 `description` 按需加载。推荐边界：

- 公共接口、数据承诺、故障注入、性能、可观测性、迁移和生产发布使用对应专业技能。
- 规范、持久化计划、ADR、官方来源证据和 Stage 只在明确需要这些产物时使用。
- 同一请求默认只加载一个主技能，不自动串联。
- 日常编码请求不加载技能。

例如：

| 请求 | 行为 |
|------|------|
| “实现这个函数并运行测试” | 直接完成，不加载技能 |
| “设计跨节点 RPC 的兼容契约” | `api-and-interface-design` |
| “验证断电恢复后确认写不丢” | `consistency-and-durability-verification` |
| “准备灰度和回滚方案” | `shipping-and-launch` |

## 专业角色

插件从 `agents/` 注册：

- `code-reviewer`：独立代码审查。
- `test-engineer`：测试策略与覆盖缺口分析。

可直接调用任一角色。`/ship` 会并行调用两者，并由主智能体合并为发布决策。

## 项目规则

仓库根目录的 `AGENTS.md` 只用于维护 zflow 本身，不应复制到你的项目。请为自己的项目编写简短规则，包含真实构建命令、目录边界、安全约束，以及以下选择原则：

```markdown
普通开发任务使用模型原生工作流。
只有明确匹配 zflow 专业领域或文档产物时才加载对应技能。
同一请求默认只使用一个主技能。
```

## 权限与审查

使用第三方验证脚本或不受信任项目时可启用 Antigravity 的沙盒模式。绕过权限提示只适用于你完全信任的本地项目；生产部署、破坏性迁移和外部写入仍应保留显式确认。
