"use client";

import { useActionState } from "react";
import { Field, Input, Select, Textarea } from "@/components/form-fields";
import { Button } from "@/components/ui";
import { saveReport, type ReportState } from "@/lib/teacher/actions";

type Student = { id: string; name: string };

const ratingOptions = ["1", "2", "3", "4", "5"];
const ratingLabels = Object.fromEntries(ratingOptions.map((n) => [n, `${n} / 5`]));

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

  if (locked) {
    return (
      <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        This report has been reviewed by the admin and can no longer be edited.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      )}
      {state.ok && state.message && (
        <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Student *" name="studentId" error={e.studentId}>
          <Select
            name="studentId"
            defaultValue={v.studentId ?? ""}
            options={students.map((s) => s.id)}
            labels={Object.fromEntries(students.map((s) => [s.id, s.name]))}
            placeholder="Choose a student"
            disabled={reportId !== "new"}
            error={e.studentId}
          />
        </Field>
        <Field label="Month *" name="month" error={e.month}>
          <Input name="month" type="month" defaultValue={v.month ?? ""} disabled={reportId !== "new"} error={e.month} />
        </Field>
        <Field label="Overall rating" name="rating" error={e.rating}>
          <Select name="rating" defaultValue={v.rating ?? ""} options={ratingOptions} labels={ratingLabels} emptyLabel="No rating" error={e.rating} />
        </Field>
      </div>

      <Field label="What was covered this month *" name="covered" error={e.covered}>
        <Textarea name="covered" rows={4} defaultValue={v.covered ?? ""} error={e.covered} />
      </Field>
      <Field label="Strengths" name="strengths">
        <Textarea name="strengths" rows={3} defaultValue={v.strengths ?? ""} />
      </Field>
      <Field label="Areas to improve" name="improvements">
        <Textarea name="improvements" rows={3} defaultValue={v.improvements ?? ""} />
      </Field>

      <div className="flex flex-wrap gap-3 border-t border-brand-100 pt-5">
        <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save draft"}
        </Button>
        <Button type="submit" name="intent" value="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
