# 在 Windsurf 中使用 zflow

## 设置

### 项目规则

Windsurf 使用 `.windsurfrules` 来设置项目特定的智能体指令：

```bash
# 从最重要的技能创建组合规则文件
cat /path/to/zflow/skills/test-driven-development/SKILL.md > .windsurfrules
echo "\n---\n" >> .windsurfrules
cat /path/to/zflow/skills/incremental-implementation/SKILL.md >> .windsurfrules
echo "\n---\n" >> .windsurfrules
cat /path/to/zflow/skills/code-review-and-quality/SKILL.md >> .windsurfrules
```

### 全局规则

对于需要在所有项目中使用的技能，将其添加到 Windsurf 的全局规则中：

1. 打开 Windsurf → 设置 → AI → 全局规则
2. 粘贴你最常用技能的内容

## 推荐配置

保持 `.windsurfrules` 聚焦于 2-3 个核心技能，以保持在上下文限制之内：

```
# .windsurfrules
# 本项目的核心技能

[粘贴 test-driven-development SKILL.md]

---

[粘贴 incremental-implementation SKILL.md]

---

[粘贴 code-review-and-quality SKILL.md]
```

## 使用技巧

1. **有选择性**——Windsurf 的上下文有限。选择能解决你最大质量缺口的技能。
