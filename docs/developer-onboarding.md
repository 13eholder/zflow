# 开发者入门指南

本指南面向**在** zflow 仓库本身上工作的人：贡献技能、修复文档、改进评估工具。如果你想要在自己的项目中*使用*这些技能，你需要的是 [getting-started.md](getting-started.md)。

这是一次导览，而非规则手册。规则位于 [CONTRIBUTING.md](../CONTRIBUTING.md)（贡献工作流）、[skill-anatomy.md](skill-anatomy.md)（技能格式）和 [evals/README.md](../evals/README.md)（评估框架）中；本文档告诉你何时阅读每个以及各组成部分如何组合在一起。

---

## 1. 思维模型

该仓库有五个可组合的层次。理解每个层次*的目的*可以防止最常见的贡献错误（将参考资料放在技能中、构建路由到其他角色的角色、在不同技能间重复内容）。

| 层次 | 位置 | 职责 | 一句话 |
|---|---|---|---|
| **技能** | `skills/<name>/SKILL.md` | 带有验证关卡的逐步工作流 | *如何做* |
| **角色** | `agents/<role>.md` | 具有视角和输出格式的角色 | *谁来做* |
| **命令** | `.claude/commands/`、`.gemini/commands/`、`commands/` | 面向用户的入口点；编排层 | *何时做* |
| **参考资料** | `references/*.md` | 技能按需拉取的检查清单 | *检查什么* |
| **评估** | `evals/cases/<name>.json` | 技能正确触发和行为的证明 | *它是否有用* |

两条值得早期内化的结构规则：

- **用户（或斜杠命令）是编排者。** 角色从不调用其他角色；唯一认可的多角色模式是带有合并步骤的并行发散（参见 [references/orchestration-patterns.md](../references/orchestration-patterns.md)）。
- **不重复，而是引用。** 技能链接到其他技能和 `references/`，而不是重述内容。同样的规则适用于文档，包括本文档。

一个容易让人困惑的范围提示：仓库根目录下的 `AGENTS.md` 和 `CLAUDE.md` 配置的是在*本仓库*上工作的智能体。它们不是可复用资产，设置指南绝不能告诉用户将它们复制到自己的项目中；可复用资产是技能。

请注意，斜杠命令存在于三个平行的目录中（Claude Code、Gemini CLI、Antigravity）。触碰其中一个，CI 会检查所有三者之间的对等性，参见第三节。

## 2. 本地设置

```bash
git clone https://github.com/13eholder/zflow.git
cd zflow
```

没有构建步骤，也没有 `package.json`；验证器是纯 Node 脚本。你需要：

- **Node 20+**（CI 运行的版本）用于 `scripts/` 中的验证器
- **bash**（+ 推荐 `jq`）用于钩子回归测试
- **`gh` CLI** 用于在提议技能前的重复 PR 检查
- **Claude Code** 仅在你想要本地运行第三层行为评估时需要

要针对本地检出实时试用该技能包：

```bash
claude --plugin-dir /path/to/zflow
```

## 3. 验证循环

该仓库自我实践："验证不可妥协"适用于技能，同样适用于对该仓库的贡献。所有 CI 运行的内容，你都可以在几秒内本地运行：

```bash
# 第一层，结构化：前置元数据、命名、必需的章节
node scripts/validate-skills.js

# 三个命令目录之间的命令对等性和描述同步
node scripts/validate-commands.js

# 第二层，触发和路由：正向提示词排名靠前，负向不会冲突
node scripts/run-evals.js

# 第三层，行为评估（按需，消耗 Token；--dry-run 打印计划）
node scripts/run-evals.js --behavioral <skill-name> --dry-run

# 钩子回归测试，如果你触碰到 hooks/session-start.sh
# 或 skills/using-agent-skills/SKILL.md 则是必需的
bash hooks/session-start-test.sh
```

即使你从不触碰评估工具，三个评估层次也值得理解，因为第二层报红通常意味着*修复你的技能描述*，而不是修复评估：第二层是路由的词汇近似（基于描述的词干化 TF-IDF），其两个目标失败模式是描述缺少用户实际说的词汇，以及过于宽泛的描述压过了正确的技能。完整设计、模式定义和信任级别规则在 [evals/README.md](../evals/README.md) 中。

在每个 PR 之前运行相关子集。一个通过第一层 + 第二层 + 命令对等性验证的 PR 是可审查的；一个没有通过的将在任何人阅读内容之前因机制问题被驳回。

## 4. 贡献路径

### 路径 1：修复或改进现有技能（最常见，最佳首个 PR）

1. 保持变更专注和最小化；保留技能的结构和语气。
2. 如果你更改了前置元数据 `description`，预期会有第二层影响；运行 `node scripts/run-evals.js` 并检查技能的触发提示词是否仍然排名靠前。
3. 运行第一层以确认前置元数据仍然有效。

### 路径 2：提议新技能（门槛更高，请执行预检）

目录已经覆盖了生命周期的大部分，所以举证责任落在缺口上。在写任何东西之前，运行 [CONTRIBUTING.md](../CONTRIBUTING.md#before-proposing-a-new-skill) 中的预检：搜索目录，检查开放的 PR（`gh pr list --state open`；近似重复的集群已经存在），确认想法符合 [skill-anatomy.md](skill-anatomy.md)，并在 PR 描述中明确论证缺口。如果它与现有技能重叠，对该技能进行专注的编辑优于新建一个目录。

一个新技能作为一套完整资产发布，而非单个文件：`skills/<kebab-case-name>/SKILL.md`、匹配的 `evals/cases/<name>.json`，以及一个 `scripts/` 目录——仅当技能包含可运行辅助脚本时（参考资料放在 `references/`，绝不放在技能内部）。确切的前置元数据规则、章节结构和评估用例的最低要求见 [CONTRIBUTING.md](../CONTRIBUTING.md#structure) 和 [skill-anatomy.md](skill-anatomy.md)；从那里获取而非从本导览中获取，以防两者出现偏差。

有一点值得内化而不必查阅：在编写触发提示词时，转述用户实际说话的方式；将描述复制到提示词中是对评估的作弊，对你没有帮助。

### 路径 3：文档、参考资料、评估工具

- 文档和技能**仅限英文**；不接受翻译，因为它们会过时（[CONTRIBUTING.md](../CONTRIBUTING.md#translations) 有理由说明）。
- 对 `scripts/run-evals.js` 或评估模式的变更应与技能创建者的 `evals.json` 模式保持兼容（为行为评估层逐字采用；该兼容性是特性，而非巧合）。
- 任何触及会话启动钩子或其嵌入的元技能的内容都需要钩子回归测试（第三节）。

## 5. PR 前检查清单

- [ ] 第一层通过：`node scripts/validate-skills.js`
- [ ] 第二层通过：`node scripts/run-evals.js`
- [ ] 如果你触碰了任何命令目录，命令对等性通过：`node scripts/validate-commands.js`
- [ ] 如果你触碰了 `hooks/` 或 `using-agent-skills`，钩子测试通过
- [ ] 新技能 → 评估用例文件存在，满足最低触发/行为数量
- [ ] 新技能 → PR 描述中论证了缺口；检查了目录和开放 PR
- [ ] 无重复内容；使用交叉引用替代
- [ ] 变更是小而专注的（仓库自身的 `code-review-and-quality` 变更规模指南也适用于此处的贡献）

## 6. 建议阅读顺序

1. [README.md](../README.md)：目录和生命周期图（10 分钟）
2. `skills/using-agent-skills/SKILL.md`：从智能体侧理解路由如何工作
3. 从头到尾阅读一个成熟的技能（例如 `test-driven-development`）：通过示例内化结构
4. [skill-anatomy.md](skill-anatomy.md)：格式规范，现在有了上下文
5. [evals/README.md](../evals/README.md)：三个层次和用例格式
6. [CONTRIBUTING.md](../CONTRIBUTING.md) + [AGENTS.md](../AGENTS.md)：规则和仓库范围的智能体配置
