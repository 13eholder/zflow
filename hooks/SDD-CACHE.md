# sdd-cache 钩子

[`source-driven-development`](../skills/source-driven-development/SKILL.md) 的跨会话引用缓存。跳过冗余的 `WebFetch` 调用，而不削弱技能"对照当前文档验证"的保障。

## 为什么

`source-driven-development` 为每个框架特定决策获取官方文档。跨会话在同一项目上工作意味着反复获取相同的页面。将内容缓存为本地记忆会与技能相矛盾——文档会变化，而过时的缓存隐藏了这一点。

此钩子将获取的内容缓存在磁盘上，但通过 HTTP `If-None-Match` / `If-Modified-Since` **在每次复用时与源服务器进行重新验证**。内容仅在服务器响应 `304 Not Modified` 时从缓存提供，这是一个新鲜的验证——而非内存读取。

## 设置

1. 将钩子添加到 `.claude/settings.json`（或个人的 `.claude/settings.local.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "WebFetch",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"${CLAUDE_PROJECT_DIR}/hooks/sdd-cache-pre.sh\"",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "WebFetch",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"${CLAUDE_PROJECT_DIR}/hooks/sdd-cache-post.sh\"",
            "async": true,
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

   `${CLAUDE_PROJECT_DIR}` 解析为你启动 Claude Code 的目录。当钩子存在于同一项目中时，上述代码段有效。如果你在其他位置安装了 `zflow`（例如作为共享插件在 `~/zflow` 下），将 `${CLAUDE_PROJECT_DIR}/hooks/...` 替换为每个脚本的绝对路径。

2. 确保 `.claude/sdd-cache/` 在你的 `.gitignore` 中（已包含在本仓库中）。

3. 像往常一样使用 `/source-driven-development`（或该技能）。无需对技能或智能体工作流做任何更改——缓存是透明的。

## 思维模型

以 URL 为键的 HTTP 资源缓存。新鲜度通过 `ETag` / `Last-Modified` 委托给源服务器；无 TTL，键中无提示词。

存储的正文不是原始 HTML——`WebFetch` 通过调用者的提示词使用模型对每个响应进行后处理，因此我们缓存的是一个智能体对该页面的解读。键仅保留 URL，因此读取跨会话复用；原始提示词作为元数据保留，并在命中消息中显示，以便下一个智能体可以判断先前的解读是否适用。

## 工作原理

每个 URL 一个缓存条目，存储为 `.claude/sdd-cache/<sha>.json` 中的 JSON：

| 事件 | 动作 |
|---|---|
| `PreToolUse WebFetch` | 如果条目存在，发送带有 `If-None-Match` / `If-Modified-Since` 的 `HEAD` 请求。在 `304` 时，阻止获取并通过 stderr 向智能体返回缓存内容，原始提示词作为元数据显示。否则允许获取。 |
| `PostToolUse WebFetch` | 捕获响应，发出 `HEAD` 请求记录当前的 `ETag` / `Last-Modified`，并存储 `{url, prompt, etag, last_modified, content, fetched_at}`。 |

**新鲜度规则：**

- 仅在源确认 `304 Not Modified` 时提供条目。
- 没有 `ETag` 或 `Last-Modified` 头的条目永远不会被缓存——没有验证器，钩子无法稍后验证新鲜度，缓存意味着信任记忆。
- 缓存键是 `sha256(url)`。使用不同提示词请求相同 URL 命中同一条目；缓存的正文反映了首次获取时使用的提示词，该提示词与命中一同显示，以便智能体决定是复用还是手动重新获取。

**智能体看到的内容：**

- 缓存命中：`WebFetch` 通过退出码 2 被阻止。Claude Code 将钩子的 stderr 负载作为工具错误传递给智能体——这是缓存命中的有意信号，而非失败。负载以 `[sdd-cache] Cache hit for <url>` 为前缀，并将缓存的正文包裹在 `----- BEGIN CACHED CONTENT -----` / `----- END CACHED CONTENT -----` 标记之间，以便智能体可以像 `WebFetch` 刚刚返回它一样使用它。
- 缓存未命中或过期：`WebFetch` 正常运行；结果存储供下次使用。

技能本身不变。它继续遵循 `DETECT → FETCH → IMPLEMENT → CITE`。钩子仅改变 `FETCH` 运行时底层发生的事情。

## 本地测试

### 1. 直接对脚本进行冒烟测试

```bash
# 模拟 PostToolUse 负载：缓存一个页面
echo '{
  "tool_input": {
    "url": "https://pkg.go.dev/github.com/hashicorp/raft#NewRaft",
    "prompt": "extract the signature"
  },
  "tool_response": "func NewRaft(conf *Config, fsm FSM, logs LogStore, stable StableStore, snaps SnapshotStore, trans Transport) (*Raft, error)"
}' | bash hooks/sdd-cache-post.sh

# 检查存储的条目
ls .claude/sdd-cache/
cat .claude/sdd-cache/*.json | jq .

# 模拟相同 URL + 提示词的下一次 PreToolUse
echo '{
  "tool_input": {
    "url": "https://pkg.go.dev/github.com/hashicorp/raft#NewRaft",
    "prompt": "extract the signature"
  }
}' | bash hooks/sdd-cache-pre.sh
echo "exit=$?"
```

预期：

- 第一个命令在 `.claude/sdd-cache/` 下创建一个文件（仅当服务器返回 `ETag` 或 `Last-Modified` 时）。
- 当源回复 `304` 时，第二个命令以 `2` 退出，并在 stderr 上返回缓存内容；否则静默以 `0` 退出。

### 2. 在真实会话中端到端测试

1. 在 `.claude/settings.local.json` 中注册钩子，如上所示。
2. 在本仓库中启动 Claude Code 会话。
3. 要求智能体获取一个文档页面（例如"fetch `https://pkg.go.dev/github.com/hashicorp/raft#NewRaft` and summarize"）。
4. 验证 `.claude/sdd-cache/` 下出现一个文件。
5. 再次要求智能体以相同提示词获取相同页面。
6. 验证第二个 `WebFetch` 被阻止，缓存内容被返回（在会话记录中可见，带有 `[sdd-cache]` 前缀的工具错误）。

### 3. 新鲜度验证

要确认缓存何时失效，强制一个 `ETag` 不匹配。选择一个特定条目——一旦缓存包含多个文件，`*.json` 是不安全的：

```bash
# 选择你想要破坏的条目（替换为实际文件名）
ENTRY=.claude/sdd-cache/e49c9f378670cfbb1d7d871b6dee16d9.json

# 将其 ETag 修补为源不会识别的内容
jq '.etag = "W/\"stale-etag-forced\""' "$ENTRY" > "$ENTRY.tmp" && mv "$ENTRY.tmp" "$ENTRY"

# 下一次 PreToolUse 应未命中（服务器返回 200，而非 304）
echo '{"tool_input":{"url":"...", "prompt":"..."}}' | bash hooks/sdd-cache-pre.sh
echo "exit=$?"   # 期望 0（允许获取）
```

### 4. 调试

当调试模式开启时，两个钩子将带时间戳的事件写入 `.claude/sdd-cache/.debug.log`。使用以下任一方式启用：

```bash
# 选项 A：环境变量（每次会话）
SDD_CACHE_DEBUG=1 claude

# 选项 B：哨兵文件（持久）
mkdir -p .claude/sdd-cache && touch .claude/sdd-cache/.debug
# …禁用：rm .claude/sdd-cache/.debug
```

日志捕获 URL、检测到的 `tool_response` 形状、HEAD 状态以及每次调用命中或未命中的原因。当缓存未命中看起来意外时很有用（通常情况：源停止了发出验证器）。

## 已知局限

- **正文受提示词影响。** 命中返回的是先前智能体对该页面的解读，原始提示词被显示以便当前智能体判断是否适用。如果不适用，删除 `.claude/sdd-cache/` 下的文件以强制重新获取。
- **每次缓存写入都消耗一次额外的 HEAD。** Claude Code 不暴露 `WebFetch` 已接收的响应头，因此 post hook 重新查询源以捕获 `ETag` / `Last-Modified`。每次未命中一次额外往返——这是将此保持为纯钩子而无需核心更改的代价。
- **没有 `ETag` 或 `Last-Modified` 的服务器永远不会被缓存。** 大多数官方文档站点（pkg.go.dev、docs.rs、kubernetes.io）发出验证器。不发出验证器的站点总是重新获取。
- **行为不当的服务器可能返回错误的 `304`。** 那是需要诊断的服务器缺陷，而非需要防范的缓存不变量；我们不会用 TTL 掩盖它。如果你发现了过时条目，删除它。
- **缓存是本地的且按项目划分。** 没有团队共享缓存。添加它需要一个签名内容寻址的存储层，超出范围。

## 要求

- `jq`
- `curl`
- `shasum` 或 `sha256sum`（自动检测）
- Bash 3.2+
