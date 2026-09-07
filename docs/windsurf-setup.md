# 在 Windsurf 中使用 zflow

Windsurf 的长期规则应保持简短。不要把全部 zflow 技能拼接进 `.windsurfrules`；只在当前任务需要时加载一个专业技能。

## 项目规则

在 `.windsurfrules` 中保存项目事实和选择边界：

```markdown
# 项目约定

- 构建、测试与 lint 命令：按本仓库文档执行。
- 修改前检查相邻实现和测试；修改后运行验证并检查 diff。
- 普通实现、测试、调试、普通重构和审查使用模型原生工作流。
- 只有任务明确匹配 zflow 的专业领域或文档产物时才加载对应技能。
- 同一请求默认只使用一个主技能。
```

## 按需加载

平台无法自动发现技能时，把当前任务所需的单个 `SKILL.md` 放入会话。例如：

```text
公共 API 或 RPC 契约 → skills/api-and-interface-design/SKILL.md
尾延迟或吞吐问题   → skills/performance-optimization/SKILL.md
代码可运行但复杂难读 → skills/code-simplification/SKILL.md
ADR 或工程文档      → skills/documentation-and-adrs/SKILL.md
生产发布            → skills/shipping-and-launch/SKILL.md
```

不要把这些文件永久合并到一个全局规则中。任务结束后移除临时上下文。

## 使用技巧

1. 优先让 Windsurf 使用原生代码探索与验证能力。
2. 技能只补充领域约束，不替代仓库中的真实命令和证据。
3. 如果多个技能看似适用，先选择决定主要交付物的那个；只有明确独立缺口时再添加第二个。
