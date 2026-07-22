# 在 Codex 中使用 zflow

本仓库也是一个 [Codex 插件](https://developers.openai.com/codex/plugins/build)。Claude Code 使用的同一根级 `skills/` 目录也被 Codex 消费，因此无需复制或重复文件。

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

安装后，在 Codex 聊天中使用 `@` 调用技能（例如 `@spec-driven-development`），或直接描述任务让 Codex 选择合适的技能。`skills/` 下的全部 24 个技能均可用。

## 工作原理

- `.codex-plugin/plugin.json`——仓库根目录下的 Codex 插件清单。将 `skills` 指向 `./skills/` 并声明空的 Codex 钩子配置，以便 Codex 不会从 `hooks/hooks.json` 自动加载面向 Claude 的钩子。
- `.agents/plugins/marketplace.json`——声明仓库根目录（`./`）为插件源的 marketplace 条目。
- `skills/<name>/SKILL.md`——保持不变。Codex 和 Claude Code 共享相同的 `name` + `description` 前置元数据格式，因此一个文件同时服务于两个平台。

`.claude/commands/` 中的斜杠命令和 `agents/` 中的角色保持为 Claude Code 专属——Codex 对两者都没有原生等价物。在 Codex 上，直接调用底层技能而非斜杠命令（例如 `@spec-driven-development` 而非 `/spec`）。
