// 「下一步引导」纯函数：根据项目已产生的数据判断当前该做什么。
// 返回 { text, href }：text 为提示文案，href 为跳转目标（页内锚点或路由）。

export type NextAction = {
  text: string;
  href: string;
};

// 入参为「项目 + 已加载的相关数据」。数组有元素即代表该阶段已产出内容。
export function getNextAction(project: {
  id: string;
  pmAnalyses?: unknown[];
  researchItems?: unknown[];
  concepts?: unknown[];
  critiques?: unknown[];
  decisions?: unknown[];
  plans?: unknown[];
  budgets?: unknown[];
  copies?: unknown[];
  posters?: unknown[];
  finalQas?: unknown[];
  approvals?: unknown[];
}): NextAction {
  const has = (arr?: unknown[]): boolean => !!arr && arr.length > 0;

  if (!has(project.pmAnalyses)) {
    return { text: "先做项目经理分析", href: "#panel-pm" };
  }
  if (!has(project.researchItems)) {
    return { text: "先联网调研资料", href: "#panel-research" };
  }
  if (!has(project.concepts)) {
    return { text: "让小莫出活动方案", href: "#panel-concept" };
  }
  if (!has(project.critiques)) {
    return { text: "让小莫评审方案", href: "#panel-critic" };
  }
  if (!has(project.decisions)) {
    return { text: "选择活动方向", href: "#panel-decision" };
  }
  if (!has(project.plans)) {
    return { text: "生成正式活动方案", href: "#panel-plan" };
  }
  if (!has(project.budgets) || !has(project.copies) || !has(project.posters)) {
    return { text: "生成预算、文案、海报", href: "#panel-budget" };
  }
  // 发布前检查与最终审批都在独立的审批页上完成。
  if (!has(project.finalQas)) {
    return { text: "做发布前检查", href: `/projects/${project.id}/approve` };
  }
  if (!has(project.approvals)) {
    return { text: "最终审批", href: `/projects/${project.id}/approve` };
  }
  const approval = (project.approvals ?? [])[0] as { decision?: string } | undefined;
  if (approval?.decision === "APPROVED") {
    return { text: "全部完成", href: "" };
  }
  return { text: "审批未通过，需修改后重新审批", href: `/projects/${project.id}/approve` };
}
