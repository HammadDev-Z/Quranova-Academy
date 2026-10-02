"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input, Select } from "@/components/form-fields";
import { Button } from "@/components/ui";
import type { Option } from "@/lib/admin/fields";
import { createRecurringClasses, type RecurringState } from "@/lib/admin/workflow-actions";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function RecurringForm({
  students,
  teachers,
  courses,
  defaultStudent,
  today,
}: {
  students: Option[];
  teachers: Option[];
  courses: Option[];
  defaultStudent?: string;
  today: string;
}) {
  const [state, action, pending] = useActionState(createRecurringClasses, {} as RecurringState);
  const e = state.errors ?? {};
  const toMap = (o: Option[]) => Object.fromEntries(o.map((x) => [x.value, x.label]));

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Student *" name="studentId" error={e.studentId}>
          <Select name="studentId" defaultValue={defaultStudent ?? ""} options={students.map((s) => s.value)} labels={toMap(students)} placeholder="Choose…" error={e.studentId} />
        </Field>
        <Field label="Teacher" name="teacherId" error={e.teacherId}>
          <Select name="teacherId" defaultValue="" options={teachers.map((s) => s.value)} labels={toMap(teachers)} emptyLabel="None yet" error={e.teacherId} />
        </Field>
        <Field label="Course" name="courseId">
          <Select name="courseId" defaultValue="" options={courses.map((s) => s.value)} labels={toMap(courses)} emptyLabel="None" />
        </Field>
        <Field label="Meeting link" name="meetingUrl" error={e.meetingUrl} hint="Optional. Used for every class">
          <Input name="meetingUrl" type="url" placeholder="https://meet.google.com/…" error={e.meetingUrl} />
        </Field>
        <Field label="First week starts on *" name="startDate" error={e.startDate}>
          <Input name="startDate" type="date" defaultValue={today} error={e.startDate} />
        </Field>
        <Field label="Class time (admin time zone) *" name="time" error={e.time}>
          <Input name="time" type="time" defaultValue="17:00" error={e.time} />
        </Field>
        <Field label="Number of weeks *" name="weeks" error={e.weeks}>
          <Input name="weeks" type="number" min={1} max={26} defaultValue="4" error={e.weeks} />
        </Field>
        <Field label="Minutes per class *" name="durationMin" error={e.durationMin}>
          <Input name="durationMin" type="number" min={5} max={240} defaultValue="30" error={e.durationMin} />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-brand-800">Days of the week *</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <label key={d} className="cursor-pointer">
              <input type="checkbox" name="days" value={i} className="peer sr-only" />
              <span className="inline-block rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-gold-500">
                {d}
              </span>
            </label>
          ))}
        </div>
        {e.days && (
          <p role="alert" className="mt-1 text-sm text-red-700">
            {e.days}
          </p>
        )}
      </fieldset>

      <div className="flex flex-wrap gap-3 border-t border-brand-100 pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create classes"}
        </Button>
        <Link href="/admin/classes" className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
