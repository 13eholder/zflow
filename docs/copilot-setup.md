# 在 GitHub Copilot 中使用 zflow

## 设置

### Copilot 指令

Copilot 支持在仓库中使用 `.github/skills`、`.claude/skills` 或 `.agents/skills` 目录创建智能体技能。

```bash
mkdir -p .github/skills/test-driven-development .github/skills/code-review-and-quality

# 为核心技能创建文件
cat /path/to/zflow/skills/test-driven-development/SKILL.md > .github/skills/test-driven-development/SKILL.md
cat /path/to/zflow/skills/code-review-and-quality/SKILL.md > .github/skills/code-review-and-quality/SKILL.md
```

更多详细信息，参见[为 GitHub Copilot 创建智能体技能](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-skills)。

### 智能体角色（*.agent.md）

Copilot 支持专业智能体角色。使用 zflow 的智能体：

> **重要：** GitHub Copilot 要求自定义智能体文件命名为 `*.agent.md`。
> 命名为 `*.md` 的文件会被 Copilot 静默忽略。
> 参见 [VS Code 自定义智能体文档](https://code.visualstudio.com/docs/copilot/customization/custom-agents#_custom-agent-file-structure) 了解详情。

```bash
# 创建 agents 目录并复制智能体定义
mkdir -p .github/agents
cp /path/to/zflow/agents/code-reviewer.md .github/agents/code-reviewer.agent.md
cp /path/to/zflow/agents/test-engineer.md .github/agents/test-engineer.agent.md
```

在 Copilot Chat 中调用智能体：
- `@code-reviewer 审查这个 PR`
- `@test-engineer 分析此模块的测试覆盖率`
- `@code-reviewer 检查此更改`

### 自定义指令（用户级别）

对于需要在所有仓库中使用的技能：

1. 打开 VS Code → 设置 → GitHub Copilot → 自定义指令
2. 添加你最常用的技能摘要

## 推荐配置

### .github/copilot-instructions.md

GitHub Copilot 通过 `.github/copilot-instructions.md` 支持项目级别的指令。

```markdown
# 项目编码标准

## 测试
- 在代码之前编写测试（TDD）
- 对于缺陷：首先编写一个失败测试，然后修复（Prove-It 模式）
- 测试层次：单元 > 集成 > e2e（使用能捕捉行为的最低层级）
- 每次变更后运行 `go test ./... -race` 或 `cargo test`

## 代码质量
- 沿五个轴审查：正确性、可读性、架构、安全性、性能
- 每个 PR 必须通过：lint、类型检查、测试、构建
- 代码或版本控制中不得有密钥

## 实现
- 以小而可验证的增量构建
- 每个增量：实现 → 测试 → 验证 → 提交
- 绝不混合格式变更与行为变更

## 边界
- 始终：提交前运行测试，验证用户输入
- 先问：数据库模式变更、新依赖项
- 绝不：提交密钥、删除失败的测试、跳过验证
```

### 专业智能体

在 Copilot Chat 中使用智能体进行有针对性的审查工作流。

## 使用技巧

1. **保持指令简洁**——Copilot 指令在专注时效果最好。总结关键规则，而非包含完整技能文件。
2. **使用智能体进行审查**——code-reviewer 和 test-engineer 智能体是为 Copilot 的智能体模型设计的。
3. **在聊天中引用**——在特定阶段工作时，将相关技能内容粘贴到 Copilot Chat 中以获得上下文。
4. **与 PR 审查结合**——设置 Copilot 使用 code-reviewer 智能体角色审查 PR。
