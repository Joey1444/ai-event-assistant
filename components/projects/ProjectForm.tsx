import type { ReactNode } from "react";
import { Field, inputClass } from "@/components/ui/Field";

export type ProjectFormValues = {
  projectName?: string;
  organization?: string;
  eventType?: string;
  eventDate?: string;
  expectedParticipants?: string;
  budget?: string;
  location?: string;
  targetAudience?: string;
  objective?: string;
  requirements?: string;
  notes?: string;
};

export function ProjectForm({
  action,
  defaultValues = {},
  projectId,
  submitLabel,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: ProjectFormValues;
  projectId?: string;
  submitLabel: string;
  children?: ReactNode;
}) {
  return (
    <form action={action} className="space-y-6">
      {projectId ? <input type="hidden" name="id" value={projectId} /> : null}

      <Field label="项目名称" required>
        <input
          name="projectName"
          className={inputClass}
          placeholder="例如：莫伊大学孔子学院 2026 年中秋节活动"
          defaultValue={defaultValues.projectName ?? ""}
          required
        />
      </Field>

      <Field label="主办机构" required>
        <input
          name="organization"
          className={inputClass}
          placeholder="例如：莫伊大学孔子学院"
          defaultValue={defaultValues.organization ?? ""}
          required
        />
      </Field>

      <Field label="活动类型">
        <input
          name="eventType"
          className={inputClass}
          placeholder="例如：文化体验 / 讲座 / 晚会"
          defaultValue={defaultValues.eventType ?? ""}
        />
      </Field>

      <Field label="活动目的">
        <textarea
          name="objective"
          className={inputClass}
          rows={3}
          placeholder="例如：让师生了解中秋节文化，增进交流"
          defaultValue={defaultValues.objective ?? ""}
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="活动日期">
          <input
            name="eventDate"
            className={inputClass}
            placeholder="例如：2026 年 9 月"
            defaultValue={defaultValues.eventDate ?? ""}
          />
        </Field>
        <Field label="预计人数">
          <input
            name="expectedParticipants"
            className={inputClass}
            placeholder="例如：100 人"
            defaultValue={defaultValues.expectedParticipants ?? ""}
          />
        </Field>
        <Field label="预算">
          <input
            name="budget"
            className={inputClass}
            placeholder="例如：5000 元，或 待定"
            defaultValue={defaultValues.budget ?? ""}
          />
        </Field>
        <Field label="活动地点">
          <input
            name="location"
            className={inputClass}
            placeholder="例如：莫伊大学主校区礼堂"
            defaultValue={defaultValues.location ?? ""}
          />
        </Field>
      </div>

      <Field label="目标人群">
        <input
          name="targetAudience"
          className={inputClass}
          placeholder="例如：莫伊大学学生与教职工"
          defaultValue={defaultValues.targetAudience ?? ""}
        />
      </Field>

      <Field label="已知要求">
        <textarea
          name="requirements"
          className={inputClass}
          rows={3}
          placeholder="例如：需要中英双语，控制在 2 小时内"
          defaultValue={defaultValues.requirements ?? ""}
        />
      </Field>

      <Field label="其他备注">
        <textarea
          name="notes"
          className={inputClass}
          rows={3}
          placeholder="其他任何需要 AI 知道的背景信息"
          defaultValue={defaultValues.notes ?? ""}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-gold"
        >
          {submitLabel}
        </button>
        {children}
      </div>
    </form>
  );
}
