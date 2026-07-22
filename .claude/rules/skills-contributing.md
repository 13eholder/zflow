---
description: 添加或更改技能的反重复护栏
paths:
  - "skills/**"
---

# 添加或更改技能

本仓库已经覆盖了开发生命周期的大部分内容，因此大多数新技能想法与现有技能或开放 PR 重叠。在创建新的 `skills/<name>/` 目录或大幅修改现有技能之前：

- 运行 [CONTRIBUTING.md](../../CONTRIBUTING.md#before-proposing-a-new-skill) 中的预检检查：搜索目录，检查开放 PR（`gh pr list --state open`），论证缺口。
- 优先扩展现有技能而非添加近似重复的技能。如果想法与现有技能重叠，编辑该技能而非添加新目录。
- 使 `SKILL.md` 保持在 [docs/skill-anatomy.md](../../docs/skill-anatomy.md) 格式内，绝不在技能间重复内容，改为引用其他技能。

CONTRIBUTING.md 是完整工作流的唯一事实来源；本规则指向它而非重述其检查清单。
