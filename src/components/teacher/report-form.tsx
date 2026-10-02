"use client";

import { useActionState } from "react";
import { btnGreen, btnSoft, inputBase } from "./ui";
import { saveReport, type ReportState } from "@/lib/teacher/actions";

type Student = { id: string; name: string };

const label = "mb-1.5 block text-sm font-semibold text-slate-600";

export function ReportForm({
  reportId,
  students,
  locked,
  defaults,
}: {
  reportId: string;
  students: Student[];
  locked: boolean;
  defaults: Record<string, string>;
}) {
  const [state, action, pending] = useActionState(saveReport.bind(null, reportId), {} as ReportState);
  const e = state.errors ?? {};
  const v = { ...defaults, ...(state.values ?? {}) };
  const isNew = reportId === "new";

  if (locked) {
    return (
      <p role="status" className="rounded-2xl bg-green-50 px-5 py-4 font-medium text-green-700">
        This report has been verified by the admin and can no longer be edited.
      </p>
    );
  }

  const err = (name: string) => (e[name] ? <p className="mt-1 text-sm text-rose-600">{e[name]}</p> : null);

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={`rounded-2xl px-5 py-3 text-sm font-medium ${state.ok ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"}`}>
          {state.message}
        </p>
      )}

      {/* Disabled controls are not submitted, so an existing report keeps its student and month in hidden fields. */}
      {!isNew && (
        <>
          <input type="hidden" name="studentId" value={v.studentId ?? ""} />
          <input type="hidden" name="month" value={v.month ?? ""} />
        </>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label htmlFor="studentId" className={label}>Student *</label>
          <select id="studentId" name={isNew ? "studentId" : undefined} defaultValue={v.studentId ?? ""} disabled={!isNew} className={inputBase} aria-invalid={!!e.studentId}>
            <option value="" disabled>Choose a student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {err("studentId")}
        </div>
        <div>
          <label htmlFor="month" className={label}>Month *</label>
          <input id="month" name={isNew ? "month" : undefined} type="month" defaultValue={v.month ?? ""} disabled={!isNew} className={inputBase} aria-invalid={!!e.month} />
          {err("month")}
        </div>
        <div>
          <label htmlFor="rating" className={label}>Overall rating</label>
          <select id="rating" name="rating" defaultValue={v.rating ?? ""} className={inputBase}>
            <option value="">No rating</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} / 5</option>
            ))}
          </select>
          {err("rating")}
        </div>
      </div>

      <div>
        <label htmlFor="covered" className={label}>What was covered this month *</label>
        <textarea id="covered" name="covered" rows={4} defaultValue={v.covered ?? ""} className={inputBase} aria-invalid={!!e.covered} />
        {err("covered")}
      </div>
      <div>
        <label htmlFor="strengths" className={label}>Strengths</label>
        <textarea id="strengths" name="strengths" rows={3} defaultValue={v.strengths ?? ""} className={inputBase} />
      </div>
      <div>
        <label htmlFor="improvements" className={label}>Areas to improve</label>
        <textarea id="improvements" name="improvements" rows={3} defaultValue={v.improvements ?? ""} className={inputBase} />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
        <button type="submit" name="intent" value="draft" disabled={pending} className={btnSoft}>
          {pending ? "Saving…" : "Save draft"}
        </button>
        <button type="submit" name="intent" value="submit" disabled={pending} className={btnGreen}>
          {pending ? "Submitting…" : "Submit for review"}
        </button>
      </div>
    </form>
  );
}
