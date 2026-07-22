# 技能评估

本仓库如何衡量其技能是否真正有效：能否在应该触发时**触发**、彼此之间是否**保持清晰界限**、以及是否如每个技能所承诺的那样**改变智能体行为**。

## 先前的实践（以及我们借鉴了什么）

对于 `SKILL.md` 技能的评估，社区中尚无单一明确的标准，但有两种主流方法：

- **Anthropic 的 skill-creator v2** 定义了每个技能的 `evals.json`（包含提示词 + `expectations[]`，从转录记录中进行评分），以及根据示例提示词对描述进行的触发准确性测试。我们的行为评估层级采用了其 [`evals.json` 模式](https://github.com/anthropics/skills/tree/main/skills/skill-creator)，并添加了一个可选的 `kind` 字段来选择被评分的工作产物。
- **Superpowers**（obra）使用 bash + `claude -p` + 提示词测试夹具和评分器脚本来测试技能。我们的行为评估运行器遵循相同的无界面 `claude` 模式，评分标准从 `expectations[]` 中提取。

两者都缺少的是：对多技能**目录**进行**确定性的、CI 安全的**检查——每个技能的描述是否包含了用户实际会使用的词汇？两个技能的描述是否会发生冲突？这就是下面的第二层级，也是本仓库的补充。

## 三个层级

| 层级 | 检查内容 | 运行方式 | 成本 |
|---|---|---|---|
| 1. 结构 | 前置元数据、命名、必需章节、命令对等性 | CI（`validate-skills.js`、`validate-commands.js`） | 免费 |
| 2. 触发与路由 | 正面提示词将其技能排在前 k 名；负面提示词不会排到；没有两个描述近似冲突 | CI（`run-evals.js`） | 免费 |
| 3. 行为 | 遵循该技能的智能体满足其 `expectations[]` | 按需运行（`run-evals.js --behavioral`） | Token |

第二层级是对路由的**词汇近似**（对描述进行词干化 TF-IDF）。它无法判断语义——那是第三层级的任务——但它能捕获实际触发缺陷中占主导地位的两种失败模式：描述缺少用户实际使用的词汇（假阴性），以及过于宽泛的描述凌驾于正确的技能之上（假阳性）。第二层级的失败通常意味着**修复描述**，而非修复评估。

## 运行

```bash
# 第二层级——确定性，在 CI 中运行
node scripts/run-evals.js
node scripts/run-evals.js --min-rank1 80  # 强制执行当前路由下限

# 第三层级——行为评估，通过无界面 claude 运行每个评估，然后评分
node scripts/run-evals.js --behavioral test-driven-development            # 消耗 Token
node scripts/run-evals.js --behavioral test-driven-development --dry-run  # 仅打印计划
```

第三层级支持两种行为工作产物类型。`execution` 是默认类型：每个评估在一次性 git 仓库中运行，来自 `files[]` 的真实项目输入从 `evals/fixtures/` 中被物化并作为基线提交，评分器根据完整的 `--output-format stream-json --verbose` 执行轨迹进行评判，包括工具调用。`dialogue` 保留给那些交付物本身就是对话本身的技能；它不需要测试夹具，评分器评判助手的对话回合，而不要求文件编辑或命令执行。声明 `dialogue` 需要人工审核豁免，不是执行技能逃避评分的通用后门。

执行器以显式权限模式运行（`--permission-mode acceptEdits` 加上预批准的工具列表），以便执行评估能够真正编辑文件、运行命令、检查 diff 以及进行提交，而不是被拒绝后仅以文字描述代替。执行轨迹在评分器提示词中被视为不受信任的数据，并通过 stdin 管道传输给评分器（可能达到 MB 级别；argv 会触及操作系统参数大小限制），执行器和评分器调用都带有超时设置，评分器输出在被写入 `evals/results/`（已 gitignore）之前会被验证为符合 skill-creator 的 `grading.json` 格式的 JSON。纪律类技能还包括针对时间压力、沉没成本和权威压力的压力测试用例；这些用例验证当提示词有争议地要求跳过工作流时，工作流是否仍然有效。

## 评估用例格式

每个技能一个文件：`evals/cases/<skill-name>.json`。

```json
{
  "skill_name": "test-driven-development",
  "trigger": {
    "positive": [
      { "prompt": "Write a failing test for this bug before fixing it", "top_k": 3 }
    ],
    "negative": [
      { "prompt": "Update the architecture diagram in the docs", "owner": "documentation-and-adrs" }
    ]
  },
  "evals": [
    {
      "id": 1,
      "kind": "execution",
      "prompt": "Fix the reported rounding bug in the invoice totals, test-first.",
      "expected_output": "A failing test demonstrating the bug, a minimal fix turning it green, full suite passing",
      "files": [
        "test-driven-development"
      ],
      "expectations": [
        "A failing test is written and shown failing before the fix",
        "The implementation is the minimum needed to pass",
        "The full suite is run after the fix to catch regressions"
      ]
    }
  ]
}
```

- `evals[]` 使用 skill-creator 的核心模式（`id`、`prompt`、`expected_output`、可选的 `files[]`、`expectations[]`）以及本仓库的可选 `kind`。`kind` 必须是 `execution` 或 `dialogue`，默认为 `execution` 以保持兼容性。执行评估需要非空的 `files[]`；路径相对于 `evals/fixtures/`，可以是文件或项目目录。对话评估可以省略 `files[]`，因为转录记录本身就是工作产物。期望项是评分器对照相关产物进行检查的可验证陈述——侧重于行为，而非措辞。
- `trigger` 是本仓库的扩展。`positive` 提示词是真实的用户请求，应该路由到此技能（`top_k` 默认为 3；对于某个技能的特征性请求可以收紧到 1）。`negative` 提示词属于**不同**的技能；此技能绝不能在这些提示词中排第一。尽可能在 `owner` 中声明该技能：运行器随后会断言该拥有者**排名高于**此技能，从而将负面测试变成真正的成对路由测试，而不是可能在提示词匹配不到任何内容时虚晃一枪的测试。

**编写良好的触发提示词：**转述用户实际说话的方式；不要复制描述（那是在人为操纵评估）。如果一个真实的提示词由于描述缺少其词汇而无法排名，那是一个真正的发现——应该改进描述。

## 添加技能

每个技能都附带一个评估文件。当你添加 `skills/<name>/` 时，添加 `evals/cases/<name>.json`，其中包含至少 3 个正面触发、2 个负面触发和 1 个行为评估。执行评估必须有 `evals/fixtures/<name>/` 作为支撑；仅当技能的交付物确实是对话本身时才使用 `kind: "dialogue"`。缺少用例文件、用例数量不完整、未知的 kind、无效的测试夹具路径以及缺失必需测试夹具均视为 CI 错误。

## 需要关注的指标

第二层级的运行会打印**触发首位排名率**（正面提示词中将其技能排在第一名的比例，而不仅仅是前 k 名）。CI 使用 `--min-rank1 80` 运行，在已登记的 86% 基线之下留出有用的缓冲空间，这样不相关的描述编辑不会立即导致 CI 变红。随着路由的改善提高下限；永远不要为了通过回归而降低它。下降的数字意味着描述正在趋同。冲突检查会在成对描述相似度 ≥75% 时报错，在 ≥50% 时发出警告。这些评估所揭示的已知描述词汇缺口记录在 [#351](https://github.com/13eholder/zflow/issues/351) 中。
