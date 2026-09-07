# 在 Gemini CLI 中使用 zflow

## 作为技能安装

Gemini CLI 可以从技能目录发现 `SKILL.md`，并在任务匹配时按需激活。推荐把 zflow 作为技能安装，而不是把全部正文放进持久上下文。

```bash
gemini skills install https://github.com/13eholder/zflow.git --path skills
```

从本地克隆安装：

```bash
git clone https://github.com/13eholder/zflow.git
gemini skills install /path/to/zflow/skills/
```

只为当前工作区安装时，按你的 Gemini CLI 版本使用工作区作用域选项。安装后运行 `/skills list`，确认 14 个技能均可发现。

## GEMINI.md 的用途

`GEMINI.md` 应保存项目长期有效的约定，例如构建命令、目录边界、代码风格和安全限制。不要把完整技能集拼接进去；技能正文按需加载可以显著减少上下文占用。

一个最小示例：

```markdown
# 项目约定

- 构建：`go build ./...`
- 测试：`go test ./... -race`
- 修改前先检查相邻实现和测试；修改后运行相关验证并检查 diff。
- 只有任务明确匹配 zflow 的专业领域或文档产物时才加载对应技能。
- 同一请求默认只使用一个主技能。
```

## 按需使用

| 请求 | 技能 |
|------|------|
| 设计公共 RPC 或协议 | `api-and-interface-design` |
| 验证确认写在崩溃后不丢失 | `consistency-and-durability-verification` |
| 设计故障演练 | `failure-injection-testing` |
| 分析尾延迟或 I/O 放大 | `performance-optimization` |
| 设计日志、指标、追踪和告警 | `observability-and-instrumentation` |
| 规划废弃和消费者迁移 | `deprecation-and-migration` |
| 准备生产发布 | `shipping-and-launch` |
| 创建规范、计划、ADR 或来源证据 | 对应的文档技能 |
| 简化可运行但难读的代码并保持行为不变 | `code-simplification` |

普通实现、缺陷修复、测试编写和 diff 审查直接使用 Gemini 的原生能力；明确要求保持行为不变地简化复杂代码时，加载 `code-simplification`。

## 显式加载

自动发现不稳定或你希望确保边界时，在提示中点名当前所需技能：

```text
使用 api-and-interface-design 为这个公共端点定义兼容契约。
```

不要一次点名多个技能，除非任务确实包含两个独立交付物，并明确哪个是主流程。

## MCP 与角色

性能测量、监控系统或官方资料访问可以通过你已配置的 MCP 工具提供证据；技能不会自行赋予外部访问权限。

`agents/code-reviewer.md` 和 `agents/test-engineer.md` 可作为一次性角色提示使用。生产发布需要两种独立视角时，可参考 `/ship` 的并行发散与合并模式。

## 使用技巧

1. 优先按需技能，而非持久加载。
2. 让项目规则保存项目事实，让技能保存专业工作流。
3. 用普通编码请求验证不会误触发技能。
4. 用明确的公共接口、故障或发布请求验证对应技能能被发现。
