import { WORKFLOW_STEPS } from "@/lib/steps";

// 面板标题：根据步骤 id 从 WORKFLOW_STEPS 自动取序号与名称，
// 渲染统一的「N. 名称」h2，避免序号在各面板硬编码。
export function StepHeading({ id }: { id: string }) {
  const index = WORKFLOW_STEPS.findIndex((s) => s.id === id);
  const step = WORKFLOW_STEPS[index];
  if (!step) return null;
  return (
    <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">
      {index + 1}. {step.label}
    </h2>
  );
}
