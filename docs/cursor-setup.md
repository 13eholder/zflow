# 在 Cursor 中使用 zflow

如何使用当前支持的、不同于旧式单体文件或 Kaizen 特定布局的项目上下文，将 [zflow](../README.md) 接入 **Cursor**。

---

## Cursor 当前支持的功能

Cursor 结合了**规则**（简短策略）和**技能**（完整工作流）：

| 层次 | 路径 | 角色 |
|-------|------|------|
| **项目规则** | `.cursor/rules/*.mdc` | 始终启用或文件范围的指令（`alwaysApply`、`globs`） |
| **项目技能** | `.cursor/skills/<skill-name>/SKILL.md` | 智能体发现的工作流；当任务匹配技能 `description` 时读取 |
| **用户规则** | Cursor 设置 → 规则 | 账户范围的策略 |
| **用户技能**（可选） | `~/.cursor/skills/` | 每个工作区可用的全局技能 |

文档：[规则](https://docs.cursor.com/context/rules) · [技能](https://docs.cursor.com/context/skills)（URL 可能因 Cursor 更新文档而重定向）。

### 规则 vs 技能

- **规则**——简洁、稳定（"使用约定式提交"，"为公共 Python API 添加类型注解"）。每个文件关注一个关注点；避免粘贴大型指南。
- **技能**——来自本仓库的逐步流程（`test-driven-development`、`code-review-and-quality` 等）。**不要**将完整的 `SKILL.md` 正文复制到规则中；这会导致与 `.cursor/skills/` 重复并浪费上下文。

### 旧式用法（新设置应避免）

| 旧式 | 推荐 |
|--------|--------|
| 根目录 `.cursorrules` | `.cursor/rules/*.mdc` |
| 将 `SKILL.md` 复制到 `.cursor/rules/` | `.cursor/skills/<name>/SKILL.md` |
| "将 10 个技能作为始终启用的规则加载" | 1-2 个精简的 `alwaysApply` 规则 + 按需使用技能 |

---

## 推荐的项目布局

```text
your-project/
├── .cursor/
│   ├── rules/                    # 简短的 .mdc 策略（你的）
│   │   └── agent-skills.mdc      # 可选："使用项目技能"的指针
│   └── skills/                   # Cursor Agent 加载的内容
│       ├── using-zflow/
│       ├── test-driven-development/
│       ├── code-review-and-quality/
│       └── …                     # 从 zflow 同步 + 你自己的技能
└── zflow/                 # 可选：git submodule 或 vendor 克隆
    └── skills/                   # 仅作为上游源
```

**智能体的事实来源：** `.cursor/skills/`。
将 `zflow/skills/`（或克隆的 [13eholder/zflow](https://github.com/13eholder/zflow)）视为**上游**——同步到 `.cursor/skills/`，不要只编辑上游并期望 Cursor 能看到它。

---

## 设置（任何仓库）

### 1. 将技能安装到 `.cursor/skills/`

**从 zflow 的本地克隆**（在项目根目录或其他位置）：

```bash
mkdir -p .cursor/skills
rsync -a /path/to/zflow/skills/ .cursor/skills/
```

**首次复制，不覆盖你的自定义技能：**

```bash
rsync -a --ignore-existing /path/to/zflow/skills/ .cursor/skills/
```

**在上游更新之后：**

```bash
rsync -a /path/to/zflow/skills/ .cursor/skills/
```

每个技能文件夹必须包含至少带有以下 YAML 前置元数据的 `SKILL.md`：

```yaml
---
name: test-driven-development
description: 通过测试驱动开发。在实现逻辑、修复缺陷或变更行为时使用。
---
```

Cursor 使用 `description`（及相关元数据）来决定何时应用技能。

### 2. 添加最小的项目规则（可选但有用）

创建 `.cursor/rule./zflow.mdc`：

```markdown
---
description: 使用来自 .cursor/skills 的 zflow 工作流
alwaysApply: true
---

在进行非平凡的技术工作之前：

1. 通过 `.cursor/skills/using-zflow/SKILL.md` 进行路由。
2. 阅读并遵循 `.cursor/skills/<name>/SKILL.md` 下的匹配技能。
3. 当技能链接到该文件夹中的 `reference.md` 时打开它。
4. 优先使用项目技能而非猜测；用户不需要每次说出"阅读技能"。
```

为仓库特定标准（风格、语言、技术栈）添加**单独的** `.mdc` 文件，保持每个文件专注。

**规则文件格式：**

```markdown
---
description: 在 Cursor 规则界面中显示
alwaysApply: false
globs: "**/*.{go,rs,proto}"
---

# 你的规则内容
```

| 字段 | 用途 |
|-------|-----|
| `alwaysApply: true` | 此项目中的每次聊天 |
| `globs` | 当匹配文件在上下文中时 |
| `alwaysApply: false` + 无 globs | 智能体请求 / 手动规则（Cursor 界面） |

### 3. 用户级技能（可选）

将你希望在所有地方使用的技能复制或安装到 `~/.cursor/skills/` 下。用于不属于 zflow 的技术栈指南（例如语言模式）。

`.cursor/skills/` 中的项目技能对此仓库的工作流具有优先级。

### 4. 验证

1. **设置 → 规则**——列出项目的 `.mdc` 文件。
2. **Agent 聊天**——`.cursor/skills/` 中的技能出现在技能列表中（如果你的 Cursor 构建版本暴露了该功能）。
3. 运行一个映射到某个技能的任务（例如"添加一个带测试的功能"），不指明文件名——当路由正常工作时，智能体应打开 `test-driven-development`。

---

## 智能体应如何使用技能

1. **发现**——`using-agent-skills` 将任务阶段映射到技能名称。
2. **阅读**——`.cursor/skills/<name>/SKILL.md` 中的完整流程。
3. **深入**——当技能指示时，阅读 `reference.md`、`references/*.md` 或链接的检查清单。
4. **组合**——例如对于 API 切片，组合 `incremental-implementation` + `api-and-interface-design`。

如果智能体偏离，明确的用户说法（"遵循 TDD"，"使用 code-review-and-quality"）仍然有帮助。

### 阶段 → 技能（快速映射）

| 你正在… | 技能 |
|----------|--------|
| 澄清需求 | `interview-me`、`idea-refine`、`spec-driven-development` |
| 规划任务 | `planning-and-task-breakdown` |
| 实现 | `incremental-implementation`、`api-and-interface-design` |
| 测试 | `test-driven-development` |
| 调试 | `debugging-and-error-recovery` |
| 审查 | `code-review-and-quality`、`code-simplification` |
| 性能 | `performance-optimization` |
| Git / CI / 发布 | `git-workflow-and-versioning`、`ci-cd-and-automation`、`shipping-and-launch` |

完整树：仓库中的 `skills/using-zflow/SKILL.md`。

---

## 不应做的

| 避免 | 替代做法 |
|-------|------------|
| 将所有技能粘贴到一个规则中 | 同步到 `.cursor/skills/` |
| 维护两个分歧的副本 | 从上游 `rsync`；提交 `.cursor/skills/` |
| 许多 `alwaysApply: true` 规则 | 一个路由规则 + 专注的 globs 规则 |
| 仅依赖 `.cursorrules` | 迁移到 `.mdc` + 技能 |
| 期望 `zflow/agents/*.md` 自动加载 | 粘贴到聊天中，或提炼为简短规则 |

---

## 上下文技巧

- 保持**始终启用**的规则小而精（路由 + 1-2 个不可商量的规则）。
- 让**技能**承载长检查清单和合理化借口表格。
- 仅在需要时添加阶段特定的 **globs** 规则（例如 `**/*.go`、`**/handler/**`）。
- 如果验证步骤被跳过，按技能名称进行提示。

---

## `agents/` 目录

`zflow/agents/` 下的文件（例如代码审查者角色）**不会**被 Cursor 自动加载。可选方案：

- 引用等效的技能（`code-review-and-quality`）。
- 将智能体 markdown 粘贴到聊天中进行一次性审查。
- 提取**简短**的检查清单到 `.mdc` 规则中。

---

## 故障排除

| 症状 | 检查 |
|---------|--------|
| 技能从未使用 | `SKILL.md` 是否在 `.cursor/skills/<name>/` 下？前置元数据 `description` 是否有效？ |
| 规则被忽略 | 扩展名是否为 `.mdc`？`alwaysApply` / `globs` 是否正确？ |
| 工作流过时 | 从 `zflow/skills/` 重新 `rsync` |
| 指令重复 | 从规则中删除技能内容；保持一个来源 |
| 选错了技能 | 在自定义技能中缩小 `description`；在聊天中提示 |

---

## 检查清单（新项目）

- [ ] `mkdir -p .cursor/skills` 并从 `zflow/skills/` 同步
- [ ] 可选：`.cursor/rule./zflow.mdc` 带路由提示
- [ ] 将仓库特定规则添加为单独的小 `.mdc` 文件
- [ ] 提交 `.cursor/skills/` 和 `.cursor/rules/`（团队共享行为）
- [ ] 除非旧工具需要，否则跳过巨大的 `.cursorrules`

---

## 参见

- [getting-started.md](getting-started.md)
- [../README.md](../README.md)——Cursor 快速简介
- 上游：[github.com/13eholder/zflow](https://github.com/13eholder/zflow)
