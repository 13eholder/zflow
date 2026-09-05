# 技能评估

本仓库如何衡量其技能是否真正有效：能否在应该触发时**触发**、彼此之间是否**保持清晰界限**、以及是否如每个技能所承诺的那样**改变智能体行为**。

## 评估范围

本仓库将评估拆成确定性检查和行为用例两部分。确定性检查在 CI 中运行；行为用例只描述需要验证的产物和验收标准，实际执行由外部评估平台负责。本仓库不绑定任何特定模型或命令行客户端。

## 检查层级

| 层级 | 检查内容 | 运行方式 | 成本 |
|---|---|---|---|
| 1. 结构与用例契约 | 前置元数据、命名、必需章节、命令清单、行为用例 schema 和测试夹具 | CI（`validate-skills.js`、`validate-commands.js`、`run-evals.js`） | 免费 |
| 2. 触发与路由 | 正面提示词将其技能排在前 k 名；负面提示词不会排到；没有两个描述近似冲突 | CI（`run-evals.js`） | 免费 |
| 3. 行为 | 外部执行器根据 `expectations[]` 检查真实产物；本仓库只校验用例契约 | 外部评估平台 | 由平台决定 |

第二层级是对路由的**词汇近似**（对描述进行词干化 TF-IDF）。它无法判断语义——那是外部行为评估的任务——但它能捕获实际触发缺陷中占主导地位的两种失败模式：描述缺少用户实际使用的词汇（假阴性），以及过于宽泛的描述凌驾于正确的技能之上（假阳性）。第二层级的失败通常意味着**修复描述**，而非修复评估。

## 运行

```bash
# 确定性检查，在 CI 中运行
node scripts/run-evals.js
node scripts/run-evals.js --min-rank1 80  # 强制执行当前路由下限
```

行为用例支持两种产物类型：`execution` 需要 `files[]` 测试夹具，`dialogue` 将对话本身作为产物。`run-evals.js` 只验证这些字段、路径和验收标准；执行和评分由外部平台完成。纪律类技能仍可包含针对时间压力、沉没成本和权威压力的用例。

## 评估用例格式

每个技能一个文件：`evals/cases/<skill-name>.json`。

```json
{
  "skill_name": "api-and-interface-design",
  "trigger": {
    "positive": [
      { "prompt": "Design a stable public RPC contract for object storage", "top_k": 3 }
    ],
    "negative": [
      { "prompt": "Record this architecture decision as an ADR", "owner": "documentation-and-adrs" }
    ]
  },
  "evals": [
    {
      "id": 1,
      "kind": "execution",
      "prompt": "Design the public RPC contract for an object-storage service.",
      "expected_output": "A versioned contract with request/response shapes, error semantics, idempotency, and compatibility rules",
      "files": [
        "api-and-interface-design"
      ],
      "expectations": [
        "Retryable and non-retryable errors are distinguishable",
        "Write operations define idempotency behavior",
        "Rolling-upgrade compatibility is explicit"
      ]
    }
  ]
}
```

- `evals[]` 使用统一的核心字段（`id`、`prompt`、`expected_output`、可选的 `files[]`、`expectations[]`）以及本仓库的可选 `kind`。`kind` 必须是 `execution` 或 `dialogue`，默认为 `execution` 以保持兼容性。执行评估需要非空的 `files[]`；路径相对于 `evals/fixtures/`，可以是文件或项目目录。对话评估可以省略 `files[]`，因为转录记录本身就是工作产物。期望项是外部评估器对照相关产物进行检查的可验证陈述——侧重于行为，而非措辞。
- `trigger` 是本仓库的扩展。`positive` 提示词是真实的用户请求，应该路由到此技能（`top_k` 默认为 3；对于某个技能的特征性请求可以收紧到 1）。`negative` 提示词属于**不同**的技能；此技能绝不能在这些提示词中排第一。尽可能在 `owner` 中声明该技能：运行器随后会断言该拥有者**排名高于**此技能，从而将负面测试变成真正的成对路由测试，而不是可能在提示词匹配不到任何内容时虚晃一枪的测试。

**编写良好的触发提示词：**转述用户实际说话的方式；不要复制描述（那是在人为操纵评估）。如果一个真实的提示词由于描述缺少其词汇而无法排名，那是一个真正的发现——应该改进描述。

## 添加技能

每个技能都附带一个评估文件。当你添加 `skills/<name>/` 时，添加 `evals/cases/<name>.json`，其中包含至少 3 个正面触发、2 个负面触发和 1 个行为评估。执行评估必须有 `evals/fixtures/<name>/` 作为支撑；仅当技能的交付物确实是对话本身时才使用 `kind: "dialogue"`。缺少用例文件、用例数量不完整、未知的 kind、无效的测试夹具路径以及缺失必需测试夹具均视为 CI 错误。

## 需要关注的指标

第二层级的运行会打印**触发首位排名率**（正面提示词中将其技能排在第一名的比例，而不仅仅是前 k 名）。CI 使用 `--min-rank1 80` 运行，在已登记的 83% 基线之下留出少量缓冲空间。随着路由改善应提高下限；永远不要为了通过回归而降低它。下降的数字意味着描述正在趋同。冲突检查会在成对描述相似度 ≥75% 时报错，在 ≥50% 时发出警告。这些评估所揭示的已知描述词汇缺口记录在 [#351](https://github.com/13eholder/zflow/issues/351) 中。
