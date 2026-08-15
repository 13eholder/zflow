# zflow

**面向基础架构工程（分布式系统、存储、网络）的生产级工程技能集合。**
基于项目[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)改造。
技能编码了资深基础架构工程师在构建分布式系统、存储引擎和网络服务时所遵循的工作流、质量关卡和最佳实践。这些技能被打包好，让 AI 智能体在开发的每个阶段都能一致地遵循它们。

```
  定义          规划           构建          验证          审查          发布
 ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
 │ 创意 │ ───▶ │ 规范 │ ───▶ │ 代码 │ ───▶ │ 测试 │ ───▶ │ 质量 │ ───▶ │ 上线 │
 │ 精炼 │      │ PRD │      │ 实现 │      │ 调试 │      │ 关卡 │      │ 运行 │
 └──────┘      └──────┘      └──────┘      └──────┘      └──────┘      └──────┘
  /spec          /plan          /build        /test         /review       /ship
```

---

## 斜杠命令

7 个映射到开发生命周期的斜杠命令。每个命令都会自动激活相应的技能。

| 你在做什么 | 命令 | 核心原则 |
|-------------------|---------|---------------|
| 定义要构建什么 | `/spec` | 规范先于代码 |
| 规划如何构建 | `/plan` | 小而原子的任务 |
| 增量构建 | `/build` | 一次一个切片 |
| 证明它能用 | `/test` | 测试即证明 |
| 合并前审查 | `/review` | 改善代码健康度 |
| 简化代码 | `/code-simplify` | 清晰优于聪明 |
| 发布到生产环境 | `/ship` | 更快更安全 |

想要在规范存在后减少手动步骤？**`/build auto`** 会生成计划并在一次批准中实现每个任务——你只需批准计划一次，然后它会自主运行。它去除了任务之间的人工介入，而非去除了验证：每个任务仍然是测试驱动的并单独提交，并且在失败或风险步骤时会暂停。

技能还会根据你正在做的事情自动激活——设计接口或协议会触发 `api-and-interface-design`，排查性能或延迟问题会触发 `performance-optimization`，依此类推。

---

## 快速入门

**最快路径——任何智能体，一条命令。** 开放的 [skills CLI](https://github.com/vercel-labs/skills) 可安装到 70 多种智能体中（Claude Code、Cursor、Codex、Copilot、Cline 等）：

```bash
npx skills add 13eholder/zflow            # 安装全部 24 个技能
npx skills add 13eholder/zflow --list     # 安装前浏览
```

或者单独获取某个技能：

```bash
npx skills add 13eholder/zflow --skill code-review-and-quality   # 合并前五轴审查
npx skills add 13eholder/zflow --skill interview-me              # 需求访谈，一次一个问题
npx skills add 13eholder/zflow --skill test-driven-development   # 红-绿-重构，强制执行
```

偏好原生集成？选择你使用的工具。

<details>
<summary><b>Oh My Pi(推荐)</b></summary>

**从MarketPlace安装**:

```
/marketplace add 13eholder/zflow
/marketplace install --scope=[user|project] zflow@13eholder-zflow
```

**直接从Github安装**:

```
omp plugin install github:13eholder/zflow
omp plugin install https://github.com/13eholder/zflow.git
```

**从本地克隆仓库安装**:

```bash
git clone https://github.com/13eholder/zflow.git
# 将本地目录以项目级符号链接加载（推荐，支持热重载）
omp install -l ./zflow
# 直接放入项目本地扩展目录，omp 启动时自动加载
mkdir -p .omp/extensions
cp -r ./zflow .omp/extensions/
# 运行 /reload-plugins 或重启 omp 
```
</details>

<details>
<summary><b>Claude Code</b></summary>

**从 Marketplace 安装：**

```
/plugin marketplace add 13eholder/zflow
/plugin install zflow@13eholder-zflow
```

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

作为原生技能安装以自动发现，或添加到 `GEMINI.md` 中以获得持久上下文。参见 [docs/gemini-cli-setup.md](docs/gemini-cli-setup.md)。

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

将技能内容添加到你的 Windsurf 规则配置中。参见 [docs/windsurf-setup.md](docs/windsurf-setup.md)。

</details>

<details>
<summary><b>OpenCode</b></summary>

通过 AGENTS.md 和 `skill` 工具使用智能体驱动的技能执行。

参见 [docs/opencode-setup.md](docs/opencode-setup.md)。

</details>

<details>
<summary><b>GitHub Copilot</b></summary>

将 `agents/` 中的智能体定义用作 Copilot 角色，并在 `.github/copilot-instructions.md` 中使用技能内容。参见 [docs/copilot-setup.md](docs/copilot-setup.md)。

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

已经安装了？如何在你的代码库中推广这个技能包取决于你的代码库。**[采纳指南](docs/adoption-guide.md)** 涵盖了两条路径：为全新项目从第一天开始的完整生命周期，或为已有代码库的渐进式、验证优先的滚动发布。

---

## 全部 23 个技能

上面的命令只是入口。这个技能包共包含 23 个技能——22 个生命周期技能加上 `using-agent-skills` 元技能。每个技能都是一个结构化的工作流，包含步骤、验证关卡和反合理化表格。你也可以直接引用任何技能。

### 元技能——发现哪个技能适用

| 技能 | 功能 | 何时使用 |
|-------|-------------|----------|
| [using-agent-skills](skills/using-agent-skills/SKILL.md) | 将传入的工作映射到正确的技能工作流，并定义共享的操作规则 | 开始会话或决定哪个技能适用时 |

### 定义——明确要构建什么

| 技能 | 功能 | 何时使用 |
|-------|-------------|----------|
| [interview-me](skills/interview-me/SKILL.md) | 一次一个问题的访谈，挖掘用户真正想要的，而非他们认为自己应该想要的，直到约 95% 置信度 | 需求不够明确，或用户使用"interview me"/"grill me"时 |
| [idea-refine](skills/idea-refine/SKILL.md) | 结构化的发散/收敛思维，将模糊的想法转化为具体方案 | 你有一个需要探索的大致概念时 |
| [spec-driven-development](skills/spec-driven-development/SKILL.md) | 在写任何代码之前编写涵盖目标、命令、结构、代码风格、测试和边界条件的 PRD | 开始一个新项目、功能或重大变更时 |

### 规划——分解任务

| 技能 | 功能 | 何时使用 |
|-------|-------------|----------|
| [planning-and-task-breakdown](skills/planning-and-task-breakdown/SKILL.md) | 将规范分解为小而可验证的任务，附带验收标准和依赖排序 | 你有一个规范，需要可实现的单元时 |

### 构建——编写代码

| 技能 | 功能 | 何时使用 |
|-------|-------------|----------|
| [incremental-implementation](skills/incremental-implementation/SKILL.md) | 细粒度垂直切片——实现、测试、验证、提交。功能开关、安全默认值、易于回滚的变更 | 任何涉及多个文件的变更 |
| [test-driven-development](skills/test-driven-development/SKILL.md) | 红-绿-重构，测试金字塔（80/15/5），测试规模，DAMP 优于 DRY，Beyonce 规则 | 实现逻辑、修复缺陷或变更行为时 |
| [context-engineering](skills/context-engineering/SKILL.md) | 在正确的时间给智能体提供正确的信息——规则文件、上下文打包、MCP 集成 | 开始会话、切换任务或输出质量下降时 |
| [source-driven-development](skills/source-driven-development/SKILL.md) | 每个框架决策都基于官方文档——验证、引用来源、标记未经验证的内容 | 你想要任何框架或库的权威、有源代码引证的代码 |
| [doubt-driven-development](skills/doubt-driven-development/SKILL.md) | 对每个非平凡决策进行对抗式全新上下文审查——声明→提取→质疑→调和→停止，可选用户授权的跨模型升级 | 风险较高（生产环境、安全性、不可逆），在陌生代码中工作，或者一个有信心的输出现在验证比以后调试更划算 |
| [api-and-interface-design](skills/api-and-interface-design/SKILL.md) | 契约优先设计、Hyrum 定律、单一版本规则、错误语义、边界验证 | 设计节点间 RPC、存储协议、模块边界或公共接口时 |

### 验证——证明它能用

| 技能 | 功能 | 何时使用 |
|-------|-------------|----------|
| [debugging-and-error-recovery](skills/debugging-and-error-recovery/SKILL.md) | 五步排查：复现、定位、缩小、修复、防范。停止一切规则、安全回退 | 测试失败、构建中断或行为异常时 |
| [failure-injection-testing](skills/failure-injection-testing/SKILL.md) | 不变量先行、稳态基线、单故障注入、kill point 枚举、爆炸半径控制 | 验证节点宕机、网络分区、慢盘、时钟漂移等故障路径时 |
| [consistency-and-durability-verification](skills/consistency-and-durability-verification/SKILL.md) | 承诺精确化、写路径持久化审计、崩溃恢复五层契约、副本对账、端到端校验和 | 验证已确认写入不丢、副本不发散、崩溃恢复一致时 |

### 审查——合并前的质量关卡

| 技能 | 功能 | 何时使用 |
|-------|-------------|----------|
| [code-review-and-quality](skills/code-review-and-quality/SKILL.md) | 五轴审查，变更规模（约 100 行），严重性标签（Nit/Optional/FYI），审查速度规范，拆分策略 | 合并任何变更之前 |
| [code-simplification](skills/code-simplification/SKILL.md) | Chesterton 栅栏、500 规则，在保持精确行为的同时降低复杂度 | 代码能用但比应有的更难读或更难维护时 |
| [performance-optimization](skills/performance-optimization/SKILL.md) | 度量优先的方法——p99/p999 尾延迟、IOPS 与读写放大、性能分析工作流、反模式检测 | 存在延迟或吞吐要求，或怀疑性能回归时 |

### 发布——自信部署

| 技能 | 功能 | 何时使用 |
|-------|-------------|----------|
| [git-workflow-and-versioning](skills/git-workflow-and-versioning/SKILL.md) | 基于主干的开发、原子提交、变更规模（约 100 行）、提交即保存点模式 | 进行任何代码变更时（始终） |
| [ci-cd-and-automation](skills/ci-cd-and-automation/SKILL.md) | 左移、更快更安全、功能开关、质量关卡流水线、失败反馈循环 | 设置或修改构建和部署流水线时 |
| [deprecation-and-migration](skills/deprecation-and-migration/SKILL.md) | 代码即负债思维、强制与建议性废弃、迁移模式、僵尸代码清理 | 移除旧系统、迁移用户或停用功能时 |
| [documentation-and-adrs](skills/documentation-and-adrs/SKILL.md) | 架构决策记录、API 文档、内联文档标准——记录*为什么* | 做架构决策、变更 API 或发布功能时 |
| [observability-and-instrumentation](skills/observability-and-instrumentation/SKILL.md) | 结构化日志、RED 指标、OpenTelemetry 追踪、基于症状的告警——边构建边埋点 | 添加遥测，或发布任何在生产环境运行的东西时 |
| [shipping-and-launch](skills/shipping-and-launch/SKILL.md) | 上线前检查清单、滚动升级与灰度计划、数据迁移与一致性校验、回滚与降级预案 | 准备升级分布式系统、存储引擎或网络组件时 |
| [stage](skills/stage/SKILL.md) | 串联一轮工作中的所有技能产出物（MISSION、应然/实然文档、ADR、验证结果），记录差异与学习摘要 | 用户显式请求"创建 Stage""封版 Stage"时 |

---

## 智能体角色

预配置的专业角色，用于有针对性的审查：

| 智能体 | 角色 | 审查视角 |
|-------|------|-------------|
| [code-reviewer](agents/code-reviewer.md) | 高级 Staff 工程师 | 以"Staff 工程师会批准这个吗？"为标准进行五轴代码审查 |
| [test-engineer](agents/test-engineer.md) | QA 专家 | 测试策略、覆盖率分析和 Prove-It 模式 |

参见 [docs/agents.md](docs/agents.md) 了解决策矩阵、编排规则以及角色如何与技能和斜杠命令组合。

---

## 参考资料检查清单

技能在需要时拉取的快速参考资料：

| 参考资料 | 涵盖内容 |
|-----------|--------|
| [definition-of-done.md](references/definition-of-done.md) | 项目范围内每个变更都应达到的通用标准，与每个任务的验收标准形成对比 |
| [testing-patterns.md](references/testing-patterns.md) | 测试结构、命名、Mock、故障路径与分布式场景示例、反模式（Go/Rust） |
| [performance-checklist.md](references/performance-checklist.md) | 延迟目标、延迟突刺诊断路径、存储/网络/分布式系统检查清单、度量命令 |
| [observability-checklist.md](references/observability-checklist.md) | 值班问题、结构化日志、RED/USE 指标、追踪、基于症状的告警、发布前关卡 |
| [orchestration-patterns.md](references/orchestration-patterns.md) | 经过认可的多角色编排模式、反模式以及"角色不调用角色"规则 |

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
├── skills/                            # 23 个技能（22 个生命周期 + 1 个元技能）
│   ├── interview-me/                  #   定义
│   ├── idea-refine/                   #   定义
│   ├── spec-driven-development/       #   定义
│   ├── planning-and-task-breakdown/   #   规划
│   ├── incremental-implementation/    #   构建
│   ├── context-engineering/           #   构建
│   ├── source-driven-development/     #   构建
│   ├── doubt-driven-development/      #   构建
│   ├── test-driven-development/       #   构建
│   ├── api-and-interface-design/      #   构建
│   ├── debugging-and-error-recovery/  #   验证
│   ├── failure-injection-testing/     #   验证
│   ├── consistency-and-durability-verification/ # 验证
│   ├── code-review-and-quality/       #   审查
│   ├── code-simplification/           #   审查
│   ├── performance-optimization/      #   审查
│   ├── git-workflow-and-versioning/   #   发布
│   ├── ci-cd-and-automation/          #   发布
│   ├── deprecation-and-migration/     #   发布
│   ├── documentation-and-adrs/        #   发布
│   ├── observability-and-instrumentation/ # 发布
│   ├── shipping-and-launch/           #   发布
│   └── using-agent-skills/            #   元技能：如何使用此技能包
├── agents/                            # 2 个专业角色
├── references/                        # 5 个补充检查清单
├── hooks/                             # 会话生命周期钩子
├── .claude/commands/                  # 7 个斜杠命令（Claude Code）
├── .gemini/commands/                  # 7 个斜杠命令（Gemini CLI）
├── commands/                          # 7 个斜杠命令（Antigravity CLI）
├── plugin.json                        # Antigravity 插件清单
└── docs/                              # 每个工具的设置指南
```

---

## 为什么选择 zflow？

AI 编程智能体默认选择最短路径——这通常意味着跳过规范、测试、安全审查以及使软件可靠的那些实践。zflow 为智能体提供了结构化的工作流，强制执行资深工程师为生产代码带来的同等纪律。

每个技能都编码了来之不易的工程判断力：*何时*写规范、*什么*要测试、*如何*审查以及*何时*发布。这些不是通用提示词——它们是那种将生产级工作与原型级工作区分开来的、有主见的、流程驱动的工作流。

技能融入了 Google 工程文化中的最佳实践——包括来自 [Software Engineering at Google](https://abseil.io/resources/swe-book) 和 Google [工程实践指南](https://google.github.io/eng-practices/) 中的概念。你会在 API 设计中看到 Hyrum 定律，在测试中看到 Beyonce 规则和测试金字塔，在代码审查中看到变更规模和审查速度规范，在简化中看到 Chesterton 栅栏，在 Git 工作流中看到基于主干的开发，在 CI/CD 中看到左移和功能开关，以及将代码视为负债的专用废弃技能。这些不是抽象原则——它们直接嵌入到智能体遵循的逐步工作流中。

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
