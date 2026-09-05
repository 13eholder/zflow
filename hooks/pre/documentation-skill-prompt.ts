import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

const INJECTION_MARKER = "[zflow documentation-and-adrs hook]";

const DOCUMENTATION_PROMPT = [
  INJECTION_MARKER,
  "当任务涉及架构决策、公共 API、用户可见行为、README、ADR、Stage，或需要为未来工程师/智能体保存上下文时，使用 `documentation-and-adrs` 技能。",
  "先读取该技能的完整 SKILL.md，并遵循仓库已有的文档目录、命名、编号和格式约定；记录决策背景、约束、权衡与后果，而不是重复代码。涉及 Stage/task-contract 时，遵循 STAGE.md 的单向索引规则：Contract 与 tasks/spec 平级，Contract 不回链 Stage。",
  "普通编码、测试、调试和 Git 操作继续使用 Oh My Pi 的原生工作流；本提示只在相关任务中要求文档技能，不要求每个任务都生成文档。",
].join("\n");

export default function documentationSkillPrompt(pi: ExtensionAPI): void {
  pi.on("before_agent_start", async (event) => {
    // ExtensionRunner supplies the current system prompt as an array. Append
    // one section so the instruction is present before every agent turn and
    // remains idempotent if another loader encounters the hook twice.
    if (Array.isArray(event.systemPrompt)) {
      if (event.systemPrompt.some((section) => section.includes(INJECTION_MARKER))) return;
      return { systemPrompt: [...event.systemPrompt, DOCUMENTATION_PROMPT] };
    }

    // Older OMP HookAPI runners do not expose systemPrompt. Their
    // before_agent_start contract still accepts a context message, which keeps
    // the same instruction available on those Marketplace-capable versions.
    return {
      message: {
        customType: "zflow-documentation-skill-prompt",
        content: DOCUMENTATION_PROMPT,
        display: false,
        details: { skill: "documentation-and-adrs", source: "zflow" },
        attribution: "agent",
      },
    };
  });
}
