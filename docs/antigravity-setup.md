# 在 Antigravity CLI (agy) 中使用 zflow

`zflow` 包可以作为原生插件安装到 Antigravity CLI (`agy`) 中，使智能体能够访问结构化工作流、角色和自定义斜杠命令。

## 设置

### 选项 1：原生插件安装（推荐）

Antigravity CLI 拥有一流的插件系统，用于注册技能、智能体和自定义命令。

**从远程仓库安装：**

```bash
agy plugin install https://github.com/13eholder/zflow.git
```

**从本地克隆安装：**

1. 克隆仓库：
   ```bash
   git clone https://github.com/13eholder/zflow.git
   ```
2. 使用 `agy` 安装插件：
   ```bash
   agy plugin install /path/to/zflow
   ```

这将验证插件并将其安装到你的全局 Antigravity 配置目录中（`~/.gemini/antigravity-cli/plugin./zflow/`）。

### 选项 2：从 Gemini CLI 导入

如果你已经在旧版 Gemini CLI 安装下安装了 `zflow`，可以直接导入它：
```bash
agy plugin import gemini
```

安装完成后，验证活跃的插件：
```bash
agy plugin list
```

---

## 斜杠命令

该插件注册了 7 个自定义斜杠命令，与生命周期阶段一一映射：

| 命令 | 功能 | 激活的技能 |
|---------|--------------|-----------------|
| `/spec` | 在编写代码之前编写结构化规范 | `spec-driven-development` |
| `/planning` | 将工作分解为小而可验证的任务 | `planning-and-task-breakdown` |
| `/build` | 增量实现下一个任务 | `incremental-implementation` |
| `/test` | 运行 TDD 工作流——红、绿、重构 | `test-driven-development` |
| `/review` | 五轴代码审查 | `code-review-and-quality` |
| `/code-simplify` | 不改变行为的情况下降低复杂度 | `code-simplification` |
| `/ship` | 通过并行角色发散执行发布前检查清单 | `shipping-and-launch` |

每个命令自动调用相应的技能并逐步引导智能体。

> **注意：** 使用 `/planning` 而非 `/plan`，以避免与 Antigravity 的内部计划生成命令冲突。

---

## 技能与发现

Antigravity 自动发现插件 `skills/` 目录中的技能。
* Antigravity 将用户任务和意图按需匹配到相关技能。
* 如果任务匹配某个技能，智能体会加载该技能并在执行前提示你授予权限。

---

## 验证与校验

要验证你的本地插件是否正确结构化并包含所有技能，运行：
```bash
agy plugin validate /path/to/zflow
```

---

## 工作原理

### 1. 按需技能激活
Antigravity CLI 自动发现已安装插件 `skills/` 目录中的 `SKILL.md` 文件。使用每个技能前置元数据中的触发描述，智能体在检测到匹配的开发者意图时会动态激活合适的工作流。

例如，当你要求智能体：
- **设计一个新系统** &rarr; 它会建议/激活 `spec-driven-development`。
- **实现一个功能** &rarr; 它会激活 `incremental-implementation` 和 `test-driven-development`。
- **修复一个缺陷** &rarr; 它会激活 `debugging-and-error-recovery`。

### 2. 专业智能体角色
插件从 `agents/` 目录注册可复用的子智能体定义：
- `code-reviewer.md`
- `test-engineer.md`

你可以在会话中或在使用子智能体委派任务时直接调用这些角色。

---

## 配置与定制

### 项目特定强制规则（`AGENTS.md`）
要强制严格的技能合规性（例如要求在编写代码之前有规范或计划），将 `AGENTS.md` 复制或链接到你的工作区根目录。Antigravity CLI 读取此文件以使智能体的行为和规划阶段与你的团队约定保持一致。

### 沙盒模式
如果你希望以受限的终端权限运行技能或脚本（为了在运行第三方验证测试时的安全性），使用以下命令启动 CLI：

```bash
agy --sandbox
```

---

## 使用技巧

1. **保持插件最新：** 你可以使用以下命令更新 CLI 或检查更新的插件版本：
   ```bash
   agy update
   ```
2. **执行前审查：** 当智能体使用这些技能执行复杂重构任务时，使用 `Ctrl+r` 进入**产物审查**屏幕，在代码提交之前审查、编辑或批准它。
3. **控制权限：** 你可以在受信任的本地项目中使用 `--dangerously-skip-permissions` 标志，仅在你想绕过手动工具批准提示时使用。
