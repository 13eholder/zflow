# 为 zflow 做贡献

感谢你有兴趣参与贡献！本项目是面向 AI 编程智能体的生产级工程技能集合。

刚来这里？[docs/developer-onboarding.md](docs/developer-onboarding.md) 是一个关于仓库如何组织的导览（五层架构、验证循环和贡献路径），并告诉你何时阅读本文档、[skill-anatomy.md](docs/skill-anatomy.md) 和 [evals/README.md](evals/README.md)。本文件是权威规则手册；入门指南是地图。

## 添加新技能

### 在提出新技能之前

此技能包已经覆盖了开发生命周期的大部分内容，许多提案与现有技能或其他开放 PR 重叠。在开启新 PR 之前，请完成以下检查，以免审查者花费时间处理重复内容：

1. **搜索目录。** 浏览 [README 中的技能列表](README.md) 并浏览 `skills/`，寻找覆盖你的想法的现有技能（全部或部分）。
2. **检查开放 PR。** 运行 `gh pr list --state open`（或浏览 PR 标签页），寻找相同主题的提案。近似重复技能的集群已经存在；不要增加它们。
3. **阅读结构规范。** 确认你的想法符合 [docs/skill-anatomy.md](docs/skill-anatomy.md) 的格式，即带有验证的、可操作的工作流，而非模糊的建议。
4. **在 PR 描述中论证缺口。** 明确说明为什么现有技能或开放 PR 没有覆盖此内容。如果有重叠，建议扩展现有技能而非新增一个。

如果你的想法是对现有技能的改进，优先选择对该技能进行专注的编辑，而非新建一个目录。

### 创建技能

1. 在 `skills/` 下以 kebab-case 名称创建目录
2. 按照 [docs/skill-anatomy.md](docs/skill-anatomy.md) 的格式添加 `SKILL.md`
3. 包含 YAML 前置元数据，含 `name` 和 `description` 字段
4. 确保 `description` 以技能的功能开头（第三人称），然后包含一个或多个 `Use when` 触发条件

### 技能质量标准

技能应该：

- **具体的**——可操作的步骤，而非模糊的建议
- **可验证的**——明确的退出标准及证据要求
- **久经考验的**——基于真实的工程工作流，而非理论理想
- **最小化的**——仅包含正确引导智能体所需的内容

### 结构

每个新技能必须有：

- 技能目录中的 `SKILL.md`
- 包含有效 `name` 和 `description` 的 YAML 前置元数据
- 位于 `evals/cases/<skill-name>.json` 的评估用例文件——至少 3 个正向触发、2 个负向触发（尽可能带有 `owner`），以及 1 个行为评估。执行评估必须由 `evals/fixtures/` 下的真实文件支持；对话型技能可以使用评审者把关的 `kind: "dialogue"` 评估作为替代（参见 [evals/README.md](evals/README.md)）。CI 强制执行这些要求。

新技能一般应遵循标准结构：

- **概述**——该技能做什么以及为什么重要
- **何时使用**——触发条件
- **流程**——逐步工作流
- **常见合理化借口**——智能体用来跳过步骤的借口及反驳
- **危险信号**——技能被错误应用的警告信号
- **验证**——如何确认技能被正确应用

上述前置元数据字段是必需的。章节结构是推荐的模式：等效的标题如 `How It Works`、`Workflow` 或 `Core Process` 在保持相同意图并使技能易于理解时是可以的。

### 不应做的

- 不要在不同技能间重复内容——应引用其他技能
- 不要添加模糊建议而非可操作流程的技能
- 不要创建支持文件，除非内容超过 100 行
- 不要仅仅为了匹配另一个技能而创建空的 `scripts/` 目录——仅当技能包含可运行辅助脚本时才添加 `scripts/`
- 不要将参考资料放在技能目录内——改用 `references/`

## 修改现有技能

- 保持变更专注和最小化
- 保留现有结构和语气
- 测试编辑后 YAML 前置元数据仍然有效

## 仓库范围的文件

仓库根目录下的 `AGENTS.md` 和 `CLAUDE.md` 配置的是在 [`13eholder/zflow`](https://github.com/13eholder/zflow) 仓库本身上工作的智能体。在编写设置指南或文档时，不要指导用户将这些文件复制到他们自己的项目或全局智能体配置中；可复用资产是 `skills/` 中的技能。

## 翻译

我们不接受文档（README、`docs/`）或技能及其内容的翻译。翻译后的副本会随着技能和文档的演进而过时，而我们没有办法长期维护它们，即使依靠智能体翻译加社区校正，也增加了维护成本而价值有限。请将所有技能、文档和贡献保持为英文。

## 测试钩子

会话启动钩子（`hooks/session-start.sh`）将 `using-agent-skills` 元技能注入每个新的 Claude Code 会话中。位于 `hooks/session-start-test.sh` 的回归测试验证钩子的 JSON 负载——无论是在 `jq` 可用还是不可用时。

在开启涉及以下内容的任何 PR 之前运行它：

- `hooks/session-start.sh`
- `skills/using-agent-skills/SKILL.md`（钩子嵌入的元技能内容）

```bash
bash hooks/session-start-test.sh
```

期望输出：`session-start JSON payload OK`。脚本在任何断言失败时以非零退出码退出。

### 复现无 jq 的回退

当 `jq` 不在 `PATH` 上时，钩子会优雅降级为 `INFO` 优先级的负载。要在本地测试该分支，从 `PATH` 中移除 `jq` 的目录以进行测试调用：

```bash
JQ_DIR=$(dirname "$(command -v jq)")
PATH=$(echo "$PATH" | tr ':' '\n' | grep -v "^${JQ_DIR}$" | tr '\n' ':' | sed 's/:$//') \
  bash hooks/session-start-test.sh
```

当 `jq` 存在于自己的目录中时（例如来自 Homebrew 的 `/opt/homebrew/bin`，来自手动安装的 `/usr/local/bin`），这种方法能干净地工作。如果你的 `jq` 与测试依赖的其他工具共享系统 bin（例如 `/usr/bin` 中的 `mktemp`），更简单的方法是通过单独的包管理器安装 `jq`，使其拥有自己的 bin 目录，然后重新运行。

钩子的 `command -v jq` 检查在剥离后的 `PATH` 下失败，`INFO` 优先级的回退运行，测试断言 `jq is required` 指导消息而非正常负载。

## 报告问题

如果发现以下情况，请开启 issue：

- 技能给出的指导不正确或已过时
- 某个常见工程工作流的覆盖缺失
- 技能之间存在不一致

如果技能的指导是错误的、过时的，或在你的项目中不适用（例如在 Maven 或 Gradle 仓库中假设了 `npm test`），请使用
[Skill gap](https://github.com/13eholder/zflow/issues/new?template=skill-gap.yml)
issue 表单。它会询问受影响的技能、相关摘录、你的项目上下文以及你实际采取了什么做法——足以让维护者进行分类而无需自由格式的叙述。

## 许可证

通过贡献，你同意你的贡献将在 MIT 许可证下授权。
