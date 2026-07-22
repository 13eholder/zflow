# 在 Gemini CLI 中使用 zflow

## 设置

### 选项 1：作为技能安装（推荐）

Gemini CLI 具有原生技能系统，可自动发现 `.gemini/skills/` 或 `.agents/skills/` 目录中的 `SKILL.md` 文件。每个技能在匹配你的任务时按需激活。

**从仓库安装：**

```bash
gemini skills install https://github.com/13eholder/zflow.git --path skills
```

**或从本地克隆安装：**

```bash
git clone https://github.com/13eholder/zflow.git
gemini skills install /path/to/zflow/skills/
```

**仅为特定工作区安装：**

```bash
gemini skills install /path/to/zflow/skills/ --scope workspace
```

在工作区范围安装的技能放入 `.gemini/skills/`（或 `.agents/skills/`）。用户级技能放入 `~/.gemini/skills/`。

安装后，使用以下命令验证：

```
/skills list
```

Gemini CLI 自动将技能名称和描述注入提示词。当它识别到匹配的任务时，会在加载完整指令之前请求激活技能的权限。

### 选项 2：GEMINI.md（持久上下文）

对于你希望始终作为持久项目上下文加载（而非按需激活）的技能，将其添加到项目的 `GEMINI.md` 中：

```bash
# 创建 GEMINI.md，将核心技能作为持久上下文
cat /path/to/zflow/skills/incremental-implementation/SKILL.md > GEMINI.md
echo -e "\n---\n" >> GEMINI.md
cat /path/to/zflow/skills/code-review-and-quality/SKILL.md >> GEMINI.md
```

你也可以通过从单独文件导入来实现模块化：

```markdown
# 项目指令

@skills/test-driven-development/SKILL.md
@skills/incremental-implementation/SKILL.md
```

使用 `/memory show` 验证加载的上下文，使用 `/memory reload` 在更改后刷新。

> **技能 vs GEMINI.md：** 技能是按需的专业知识，仅在与任务相关时激活，保持你的上下文窗口清洁。GEMINI.md 为每次提示词提供持久上下文。将技能用于阶段特定的工作流，将 GEMINI.md 用于始终开启的项目约定。

## 推荐配置

### 始终开启（GEMINI.md）

将这些作为每个会话的持久上下文添加：

- `incremental-implementation`——以小而可验证的切片构建
- `code-review-and-quality`——五轴审查

### 按需（技能）

将这些安装为技能，以便它们仅在相关时激活：

- `test-driven-development`——在实现逻辑或修复缺陷时激活
- `spec-driven-development`——在开始新项目或功能时激活
- `performance-optimization`——在性能工作期间激活

## 高级配置

### MCP 集成

本技能包中的许多技能利用 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 工具与环境交互。例如：

- `performance-optimization` 可以受益于与性能相关的 MCP 工具。

要启用这些功能，请确保在你的 Gemini CLI 配置（`~/.gemini/config.json`）中安装了相关的 MCP 扩展。

### 会话钩子

Gemini CLI 支持会话生命周期钩子。你可以使用这些在会话开始时自动注入上下文或运行验证脚本。

要复制其他工具中的 `zflow` 体验，你可以配置一个 `SessionStart` 钩子，提醒你可用技能或加载元技能。

### 显式上下文加载

你可以通过在提示词中使用 `@` 符号引用，将任何技能显式加载到当前会话中：

```markdown
使用 @skills/test-driven-development/SKILL.md 技能来实现此修复。
```

当你想确保遵循特定工作流而不等待自动发现时，这很有用。

## 斜杠命令

仓库在 `.gemini/commands/` 下提供 7 个斜杠命令，与生命周期阶段一一映射。Gemini CLI 在你从项目根目录运行时自动发现它们。

| 命令 | 功能 |
|---------|--------------|
| `/spec` | 在编写代码之前编写结构化规范 |
| `/planning` | 将工作分解为小而可验证的任务 |
| `/build` | 增量实现下一个任务 |
| `/test` | 运行 TDD 工作流——红、绿、重构 |
| `/review` | 五轴代码审查 |
| `/code-simplify` | 不改变行为的情况下降低复杂度 |
| `/ship` | 通过并行角色发散执行发布前检查清单 |

每个命令自动调用相应的技能——无需手动加载技能。

> **注意：** 使用 `/planning` 而非 `/plan`——`/plan` 与 Gemini CLI 内部命令名称冲突。

## 使用技巧

1. **优先使用技能而非 GEMINI.md**——技能按需激活，保持你的上下文窗口专注。只有在你希望它们始终加载时才将技能放入 GEMINI.md。
2. **技能描述很重要**——每个 SKILL.md 在其前置元数据中有一个 `description` 字段，告诉智能体何时激活它。本仓库中的描述经过优化，适用于所有支持工具的自动发现（Claude Code、Gemini CLI 等），通过清晰说明技能做什么*以及*何时应触发。
3. **使用智能体进行审查**——在请求结构化代码审查时，复制 `agents/code-reviewer.md` 的内容。
4. **与参考资料结合**——在处理测试或性能等特定质量领域时，引用 `references/` 中的检查清单。
