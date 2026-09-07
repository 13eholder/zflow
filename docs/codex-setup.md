# 在 Codex 中使用 zflow

本仓库是一个 [Codex 插件](https://developers.openai.com/codex/plugins/build)，Codex 直接消费根级 `skills/` 目录，无需复制或重复文件。

## 安装（一条命令）

```bash
codex plugin marketplace add 13eholder/zflow
```

> 需要 Codex CLI v0.122 或更高版本。在较旧的版本上，命令是 `codex marketplace add`。参见 [Codex CLI 文档](https://developers.openai.com/codex/cli)。

Codex 将仓库克隆到 `~/.codex/plugin./zflow/`，在 `~/.codex/config.toml` 中注册 marketplace，并使插件可用。如果 Codex 已在运行，请重启它。

本地克隆也可以使用：

```bash
codex plugin marketplace add /path/to/your/clone
```

## 使用

安装后，在 Codex 聊天中使用 `@` 调用技能（例如 `@spec-driven-development` 或 `@code-simplification`），或直接描述专业任务让 Codex 选择合适的技能。`skills/` 下的 14 个技能均可用；普通实现、测试、调试和审查继续使用 Codex 原生工作流。

## 工作原理

- `.codex-plugin/plugin.json`——仓库根目录下的 Codex 插件清单。将 `skills` 指向 `./skills/` 并声明空的 Codex 钩子配置；zflow 不安装自动会话注入钩子。
- `.agents/plugins/marketplace.json`——声明仓库根目录（`./`）为插件源的 marketplace 条目。
- `skills/<name>/SKILL.md`——保持不变。每个技能通过 `name` + `description` 前置元数据被 Codex 发现。

`agents/` 和 `commands/` 面向其他支持角色或命令的工具；Codex 插件当前只加载 `skills/`。在 Codex 上直接调用底层技能（例如 `@spec-driven-development`）。
