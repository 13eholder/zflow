# simplify-ignore 钩子

`/code-simplify` 的块级保护。标记绝不应被简化的代码——模型不会看到它。

## 设置

1. 对你想保护的块进行注释：

```js
/* simplify-ignore-start: perf-critical */
// 手动展开的 XOR——比循环快 3 倍
result[0] = buf[0] ^ key[0];
result[1] = buf[1] ^ key[1];
result[2] = buf[2] ^ key[2];
result[3] = buf[3] ^ key[3];
/* simplify-ignore-end */
```

2. 将钩子添加到 `.claude/settings.json`：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read",
        "hooks": [{ "type": "command", "command": "bash \"${CLAUDE_PROJECT_DIR}/hooks/simplify-ignore.sh\"" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "bash \"${CLAUDE_PROJECT_DIR}/hooks/simplify-ignore.sh\"" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "bash \"${CLAUDE_PROJECT_DIR}/hooks/simplify-ignore.sh\"" }]
      }
    ]
  }
}
```

3. 运行 `/code-simplify`——受保护的块变成 `/* BLOCK_de115a1d: perf-critical */` 占位符。模型在不看到受保护实现的情况下对周围代码进行推理。

> **注意：** 钩子在 `.claude/.simplify-ignore-cache/` 中存储临时备份。请确保此路径在你的 `.gitignore` 中。

## 工作原理

一个脚本，三个钩子事件：

| 事件 | 动作 |
|---|---|
| `PreToolUse Read` | 备份文件，用 `BLOCK_<hash>` 占位符在原处替换块 |
| `PostToolUse Edit\|Write` | 将占位符展开回真实代码，保存模型的更改，重新过滤 |
| `Stop` | 会话结束时从备份恢复所有文件 |

每个块通过 `shasum`/`sha1sum` 进行内容哈希（8 个十六进制字符），因此即使模型复制或重新排列占位符，往返也是无歧义的。缓存是项目范围的，防止跨会话干扰。

## 注释语法

```js
/* simplify-ignore-start */           // 基本——隐藏该块
/* simplify-ignore-start: reason */   // 带原因——显示在占位符中
/* simplify-ignore-end */
```

任何注释风格都适用（`//`、`/*`、`#`、`<!--`）。支持每个文件多个块和单行块。占位符保留原始注释语法（例如 Python 的 `# BLOCK_xxx`，HTML 的 `<!-- BLOCK_xxx -->`）。

## 崩溃恢复

如果 Claude Code 崩溃而没有触发 Stop 钩子，磁盘上的文件可能仍然有 `BLOCK_<hash>` 占位符。手动恢复：

```bash
echo '{}' | bash hooks/simplify-ignore.sh
```

备份存储在项目目录下的 `.claude/.simplify-ignore-cache/` 中。

## 已知局限

- **单行块隐藏整行。** 如果 `simplify-ignore-start` 和 `simplify-ignore-end` 与其他代码在同一行，整行（不仅仅是注释部分）对模型隐藏。为注释使用专用行。
- **注释后缀检测仅涵盖 `*/` 和 `-->`。** 具有非标准注释闭合符的模板引擎（ERB `%>`、Blade `--}}`）可能产生不平衡的占位符。改用 `#` 或 `//` 风格注释。
- **回退展开是渐进式的，而非精确的。** 如果模型改变了占位符的格式（例如更改了原因文本），钩子尝试逐步简单的匹配：完整占位符 → 前缀+哈希+后缀 → 仅哈希。仅哈希回退可能留下外观碎片（例如多余的 `:` 或原因文本）。发生此情况时会向 stderr 打印警告。
- **文件重命名留下占位符。** 如果模型通过 shell 命令重命名或移动文件，新文件将保留 `BLOCK_<hash>` 占位符。会话停止时原始代码保存为 `<old-filename>.recovered`。你必须手动将恢复的代码还原到新文件中。

## 要求

- `jq`、`shasum` 或 `sha1sum`（自动检测）、Bash 3.2+
