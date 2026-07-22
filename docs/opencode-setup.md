# OpenCode 设置

本指南说明如何在 OpenCode 中使用 zflow，使其紧密镜像 Claude Code 的体验（自动技能选择、生命周期驱动的工作流和严格的流程执行）。

## 概述

OpenCode 支持自定义 `/commands`，但没有像 Claude Code 那样的原生插件系统或自动技能路由。

相反，我们通过以下方式实现功能对等：

- 强大的系统提示词（`AGENTS.md`）
- 内置的 `skill` 工具
- 从 `/skills` 目录进行一致的技能发现

这创建了一个**智能体驱动的工作流**，技能被自动选择和执行。

虽然在 OpenCode 中可能重建 `/spec`、`/plan` 和其他命令，但此集成有意使用智能体驱动的方法替代：

- 技能基于意图自动选择
- 工作流通过 `AGENTS.md` 强制执行
- 不需要手动命令调用

这更接近 Claude Code 在实践中的行为——技能是自动触发的，而非手动触发。

---

## 安装

1. 克隆仓库：

```bash
git clone https://github.com/13eholder/zflow.git
```

2. 在 OpenCode 中打开项目。

3. 确保以下文件存在于你的工作区中：

- `AGENTS.md`（根目录）
- `skills/` 目录

无需额外安装。

---

## 工作原理

### 1. 技能发现

所有技能位于：

```
skills/<skill-name>/SKILL.md
```

OpenCode 智能体被指示（通过 `AGENTS.md`）：

- 检测何时有技能适用
- 调用 `skill` 工具
- 严格遵循技能

### 2. 自动技能调用

智能体评估每个请求并将其映射到合适的技能。

示例：

- "构建一个功能" → `incremental-implementation` + `test-driven-development`
- "设计一个系统" → `spec-driven-development`
- "修复一个缺陷" → `debugging-and-error-recovery`
- "审查这段代码" → `code-review-and-quality`

用户**不需要**显式请求技能。

### 3. 生命周期映射（隐式命令）

开发生命周期被隐式编码：

- 定义 → `spec-driven-development`
- 规划 → `planning-and-task-breakdown`
- 构建 → `incremental-implementation` + `test-driven-development`
- 验证 → `debugging-and-error-recovery`
- 审查 → `code-review-and-quality`
- 发布 → `shipping-and-launch`

这替代了 `/spec`、`/plan` 等斜杠命令。

---

## 使用示例

### 示例 1：功能开发

用户：
```
为这个应用添加认证
```

智能体行为：
- 检测到功能开发
- 调用 `spec-driven-development`
- 在编写代码之前生成规范
- 转向规划和实现技能

---

### 示例 2：缺陷修复

用户：
```
这个端点返回 500 错误
```

智能体行为：
- 调用 `debugging-and-error-recovery`
- 复现 → 定位 → 修复 → 添加防护

---

### 示例 3：代码审查

用户：
```
审查这个 PR
```

智能体行为：
- 调用 `code-review-and-quality`
- 应用结构化审查（正确性、设计、可读性等）

---

## 智能体预期行为（关键）

要使 OpenCode 正确工作，智能体必须遵循以下规则：

- 在行动之前始终检查是否有技能适用
- 如果有技能适用，必须使用它
- 绝不要跳过必需的工作流（规范、计划、测试等）
- 不要直接跳到实现

这些规则通过 `AGENTS.md` 强制执行。

---

## 局限性

- 没有原生斜杠命令（通过意图映射替代）
- 没有插件系统（通过提示词 + 结构替代）
- 技能调用依赖于模型遵从性

尽管存在这些限制，工作流在实践中紧密匹配 Claude Code。

---

## 推荐工作流

只需使用自然语言：

- "设计一个功能"
- "规划此变更"
- "实现这个"
- "修复这个缺陷"
- "审查这个"

智能体将自动选择并执行正确的技能。

---

## 总结

OpenCode 集成通过结合以下内容工作：

- 结构化的技能（本仓库）
- 强大的智能体规则（`AGENTS.md`）
- 通过推理自动调用技能

这产生了**完全智能体驱动的、生产级工程工作流**，无需插件或手动命令。
