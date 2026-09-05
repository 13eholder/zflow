# zflow

**面向基础架构工程（分布式系统、存储、网络）的生产级工程技能集合。**
基于项目[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)改造。
技能只保留两类模型难以稳定内化的能力：需要领域判断的基础设施工作流，以及必须生成或维护明确文档产物的工作流。
代码探索、任务拆分、实现、测试、调试、diff 自审和 Git 操作由现代智能体的原生工作流完成，不再额外包装成技能。

---

## 斜杠命令

3 个面向明确产物或高风险关卡的斜杠命令：

| 你在做什么     | 命令    | 核心原则                           |
| -------------- | ------- | ---------------------------------- |
| 定义要构建什么 | `/spec` | 生成并确认结构化规范               |
| 规划如何构建   | `/plan` | 生成依赖排序的可执行计划           |
| 发布到生产环境 | `/ship` | 并行检查并形成 go/no-go 与回滚方案 |

其余技能按需直接调用。例如，设计接口或协议时使用 `api-and-interface-design`，排查性能或延迟问题时使用 `performance-optimization`。一个请求默认只使用一个主技能；普通编码任务无需技能。

---

## 快速入门

**最快路径——任何智能体，一条命令。** 开放的 [skills CLI](https://github.com/vercel-labs/skills) 可安装到多个智能体中（Cursor、Codex、Copilot、Cline 等）：

```bash
npx skills add 13eholder/zflow            # 安装全部 13 个技能
npx skills add 13eholder/zflow --list     # 安装前浏览
```

或者单独获取某个技能：

```bash
npx skills add 13eholder/zflow --skill api-and-interface-design  # 公共 API 与协议契约
npx skills add 13eholder/zflow --skill performance-optimization  # 基于测量的性能优化
npx skills add 13eholder/zflow --skill documentation-and-adrs    # 文档与架构决策记录
```

偏好原生集成？选择你使用的工具。

<details>
<summary><b>Oh My Pi（首要原生支持）</b></summary>

插件仓库内置 OMP 优先的 `.omp-plugin/marketplace.json`，并提供
`.claude-plugin/marketplace.json` 作为旧版 OMP 的兼容回退。Marketplace
安装后会自动加载 `hooks/pre/documentation-skill-prompt.ts`，在每次 Agent
回合前注入文档技能选择提示；普通编码任务仍按需使用技能。

**从 Marketplace 安装**:

```
/marketplace add 13eholder/zflow
/marketplace install --scope=[user|project] zflow@13eholder-zflow
```

**直接从 GitHub 安装**:

```
omp plugin install github:13eholder/zflow
omp plugin install https://github.com/13eholder/zflow.git
```

**从本地克隆仓库安装**:

```bash
git clone https://github.com/13eholder/zflow.git
# 以项目级符号链接加载（支持热重载）
omp plugin link ./zflow
# 或放入项目本地扩展目录，omp 启动时自动加载
mkdir -p .omp/extensions
cp -r ./zflow .omp/extensions/
# 运行 /reload-plugins；Hook/Extension 变更需重启 omp
```

Marketplace 子系统在 OMP 的较新版本中提供；`v0.18.x` 属于尚未包含
Marketplace 的旧版 pi-coding-agent，无法执行上述 Marketplace 命令。
</details>

<details>
<summary><b>Cursor</b></summary>

将工作流技能放在 `.cursor/skills/` 下（从 `zflow/skills/` 同步），将简短策略放在 `.cursor/rules/*.mdc` 中——不要将完整技能粘贴到规则中。参见 [docs/cursor-setup.md](docs/cursor-setup.md)。

</details>

<details>
<summary><b>Antigravity CLI</b></summary>

作为原生插件安装，获得技能、子智能体和斜杠命令支持。参见 [docs/antigravity-setup.md](docs/antigravity-setup.md)。

**从仓库安装：**

```bash
agy plugin install https://github.com/13eholder/zflow.git
```

**从本地克隆安装：**

```bash
git clone https://github.com/13eholder/zflow.git
agy plugin install ./zflow
```

</details>

<details>
<summary><b>Gemini CLI</b></summary>

作为原生技能安装以按需发现；`GEMINI.md` 只保留项目自身的长期约定。参见 [docs/gemini-cli-setup.md](docs/gemini-cli-setup.md)。

**从仓库安装：**

```bash
gemini skills install https://github.com/13eholder/zflow.git --path skills
```

**从本地克隆安装：**

```bash
gemini skills install ./zflow/skills/
```

</details>

<details>
<summary><b>Windsurf</b></summary>

在项目规则中保留选择边界，并按任务提供单个技能。参见 [docs/windsurf-setup.md](docs/windsurf-setup.md)。

</details>

<details>
<summary><b>OpenCode</b></summary>

通过 `skill` 工具按需加载，并在项目自己的规则中声明选择边界。

参见 [docs/opencode-setup.md](docs/opencode-setup.md)。

</details>

<details>
<summary><b>GitHub Copilot</b></summary>

将技能安装到 Copilot 支持的技能目录，把 `agents/` 中的定义用作专业角色；项目指令保持简短。参见 [docs/copilot-setup.md](docs/copilot-setup.md)。

</details>

<details>
  <summary><b>Kiro IDE & CLI </b></summary>
  Kiro 的技能存放在 ".kiro/skills/" 下，可以放在项目级别或全局级别。Kiro 也支持 Agents.md。参见 Kiro 文档 https://kiro.dev/docs/skills/
</details>

<details>
<summary><b>Codex</b></summary>

作为原生 Codex 插件安装（需要 Codex CLI v0.122+）：

```bash
codex plugin marketplace add 13eholder/zflow
```

Codex 通过 `.codex-plugin/plugin.json` 直接读取根目录下的 `skills/` 目录。安装后，在聊天中使用 `@` 调用技能（例如 `@spec-driven-development`）。参见 [docs/codex-setup.md](docs/codex-setup.md) 了解本地安装和故障排除。

</details>

<details>
<summary><b>其他智能体</b></summary>

技能是纯 Markdown——它们适用于任何接受系统提示词或指令文件的智能体。参见 [docs/getting-started.md](docs/getting-started.md)。

</details>



---

## 采纳

已经安装了？**[采纳指南](docs/adoption-guide.md)** 说明如何只加载当前任务真正需要的技能，并让智能体原生能力处理日常开发。

---

## 全部 13 个技能

### 文档与明确产物

| 技能                                                                       | 功能                                     | 何时使用                           |
| -------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------- |
| [documentation-and-adrs](skills/documentation-and-adrs/SKILL.md)           | 创建和维护工程文档与 ADR                 | 交付物本身是文档或决策记录时       |
| [source-driven-development](skills/source-driven-development/SKILL.md)     | 依据官方来源验证框架或库相关决策         | 需要当前、可引用的权威资料时       |
| [spec-driven-development](skills/spec-driven-development/SKILL.md)         | 生成目标、约束、验收标准与边界明确的规范 | 用户明确需要功能规范时             |
| [planning-and-task-breakdown](skills/planning-and-task-breakdown/SKILL.md) | 从规范生成依赖排序的实施计划             | 用户明确需要持久化计划或任务清单时 |
| [delegated-task-contract](skills/delegated-task-contract/SKILL.md)         | 在具体 Stage 内固化子智能体的执行权限与边界 | 委派受架构约束的可写实现任务前     |
| [stage](skills/stage/SKILL.md)                                             | 串联一轮工作的规范、Contract、ADR、验证与学习摘要 | 用户显式要求创建或封版 Stage 时    |

### 作为拓展的核心能力

| 技能                                                                                               | 功能                                    | 何时使用                         |
| -------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------- |
| [api-and-interface-design](skills/api-and-interface-design/SKILL.md)                               | 契约优先的 API、RPC、协议和模块边界设计 | 设计公共接口或跨节点协议时       |
| [consistency-and-durability-verification](skills/consistency-and-durability-verification/SKILL.md) | 审计并验证一致性、持久性与崩溃恢复承诺  | 数据正确性需要故障条件下的证据时 |
| [failure-injection-testing](skills/failure-injection-testing/SKILL.md)                             | 不变量驱动的故障注入与爆炸半径控制      | 验证节点、网络、磁盘或时钟故障时 |
| [performance-optimization](skills/performance-optimization/SKILL.md)                               | 基于测量的延迟、吞吐、IOPS 和放大分析   | 有性能目标或确认过的回归时       |
| [observability-and-instrumentation](skills/observability-and-instrumentation/SKILL.md)             | 结构化日志、指标、追踪与基于症状的告警  | 设计生产可观测性时               |
| [deprecation-and-migration](skills/deprecation-and-migration/SKILL.md)                             | 兼容窗口、消费者迁移与安全下线          | 移除旧接口、数据结构或功能时     |
| [shipping-and-launch](skills/shipping-and-launch/SKILL.md)                                         | 上线检查、灰度、容量、回滚和降级预案    | 准备生产发布时                   |


---

## 智能体角色

预配置的专业角色，用于有针对性的审查：

| 智能体                                   | 角色              | 审查视角                                             |
| ---------------------------------------- | ----------------- | ---------------------------------------------------- |
| [code-reviewer](agents/code-reviewer.md) | 高级 Staff 工程师 | 以"Staff 工程师会批准这个吗？"为标准进行六轴代码审查 |
| [test-engineer](agents/test-engineer.md) | QA 专家           | 测试策略、覆盖率分析和 Prove-It 模式                 |

参见 [docs/agents.md](docs/agents.md) 了解决策矩阵、编排规则以及角色如何与技能和斜杠命令组合。

---

## 参考资料检查清单

技能在需要时拉取的快速参考资料：

| 参考资料                                                            | 涵盖内容                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [definition-of-done.md](references/definition-of-done.md)           | 项目范围内每个变更都应达到的通用标准，与每个任务的验收标准形成对比   |
| [testing-patterns.md](references/testing-patterns.md)               | 测试结构、命名、Mock、故障路径与分布式场景示例、反模式（Go/Rust）    |
| [performance-checklist.md](references/performance-checklist.md)     | 延迟目标、延迟突刺诊断路径、存储/网络/分布式系统检查清单、度量命令   |
| [observability-checklist.md](references/observability-checklist.md) | 值班问题、结构化日志、RED/USE 指标、追踪、基于症状的告警、发布前关卡 |
| [orchestration-patterns.md](references/orchestration-patterns.md)   | 经过认可的多角色编排模式、反模式以及"角色不调用角色"规则             |
| [stage-task-contract-integration.md](references/stage-task-contract-integration.md) | Stage 与 Task Contract 的归属、单向索引、状态同步和封版门禁 |

---

## 技能如何运作

每个技能遵循一致的结构：

```
┌─────────────────────────────────────────────────┐
│  SKILL.md                                       │
│                                                 │
│  ┌─ 前置元数据 ─────────────────────────────┐  │
│  │ name: 小写连字符名称                    │  │
│  │ description: 引导智能体完成[任务]。     │  │
│  │              在以下情况使用…             │  │
│  └───────────────────────────────────────────┘  │                                                                                                
│  概述             → 该技能做什么                │
│  何时使用         → 触发条件                    │
│  流程             → 逐步工作流                  │
│  常见合理化借口   → 借口 + 反驳                 │
│  危险信号         → 出错的迹象                  │
│  验证             → 证据要求                    │
└─────────────────────────────────────────────────┘
```

**关键设计选择：**

- **流程而非散文。** 技能是智能体遵循的工作流，而非它们阅读的参考文档。每个技能都有步骤、检查点和退出标准。
- **反合理化。** 每个技能都包含一个表格，列出了智能体跳过步骤时使用的常见借口（例如"我稍后会加测试"），并附有有据可查的反驳。
- **验证不可妥协。** 每个技能都以证据要求结尾——测试通过、构建输出、运行时数据。"看起来正确"永远不够。
- **渐进式披露。** `SKILL.md` 是入口。支持性参考资料仅在需要时加载，保持 Token 用量最小。

---

## 项目结构

```
zflow/
├── skills/                            # 13 个按需加载的专业技能
├── agents/                            # 2 个专业审查角色
├── references/                        # 6 个共享参考资料
├── commands/                          # 3 个 Antigravity CLI 命令
├── evals/                             # 每个技能的触发和行为评估
└── docs/                              # 安装、采纳与贡献指南
```

---

## 为什么选择 zflow？

现代模型已经能可靠完成代码探索、规划、实现、测试、调试和自审。zflow 不重复这些基础能力，只补充需要稳定领域约束、外部证据或持久化文档的工作流，因此触发更少、上下文更轻、技能边界也更清楚。

保留的核心技能聚焦基础设施中的高代价问题：公共契约、故障路径、数据承诺、性能、可观测性、迁移与上线。文档类技能则确保规范、计划、ADR 和来源证据形成可审查产物。

---

## 与其他方案对比

想知道这与 [Superpowers](https://github.com/obra/superpowers) 或 [Matt Pocock 的技能](https://github.com/mattpocock/skills) 相比如何？参见 **[docs/comparison.md](docs/comparison.md)**，了解对三者不同形态的诚实并排对比，以及何时选择哪个——包括一个受控的[正面交锋实验](https://www.linkedin.com/pulse/superpowers-vs-zflow-faster-shipping-safer-reasoning-om-mishra-dzakf/)的链接。

---

## 贡献

技能应该是**具体的**（可操作的步骤，而非模糊的建议）、**可验证的**（明确的退出标准及证据要求）、**久经考验的**（基于真实工作流）和**最小化的**（仅包含引导智能体所需的内容）。

参见 [docs/skill-anatomy.md](docs/skill-anatomy.md) 了解格式规范，参见 [CONTRIBUTING.md](CONTRIBUTING.md) 了解指南。

---

## 许可证

MIT——在你的项目、团队和工具中使用这些技能。
