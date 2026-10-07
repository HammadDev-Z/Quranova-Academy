"use client";

import { useActionState } from "react";
import { Field, Input, Select } from "@/components/form-fields";
import { Button } from "@/components/ui";
import { uploadLessonPages, type LessonUploadState } from "@/lib/admin/lesson-actions";

export function LessonUploadForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(uploadLessonPages, {} as LessonUploadState);
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={state.ok ? "rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800" : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"}
        >
          {state.message}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Course *" name="courseId" error={e.courseId}>
          <Select name="courseId" defaultValue="" options={courses.map((c) => c.id)} labels={Object.fromEntries(courses.map((c) => [c.id, c.title]))} placeholder="Choose…" error={e.courseId} />
        </Field>
        <Field label="Part" name="part" hint="e.g. Para 01. Must match the part set on the student">
          <Input name="part" placeholder="Para 01" />
        </Field>
        <Field label="First page number *" name="startPage" error={e.startPage}>
          <Input name="startPage" type="number" min={1} defaultValue="1" error={e.startPage} />
        </Field>
        <Field label="Label prefix" name="prefix" hint="Pages are labelled like B-Quran-P-09">
          <Input name="prefix" placeholder="B-Quran-P" />
        </Field>
      </div>
      <Field label="Page images *" name="files" error={e.files} hint="PNG, JPG or WebP, up to 8MB each and 100 per upload. Name them 01, 02, 03… so they are numbered in order.">
        <input
          name="files"
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          className="block w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700"
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload pages"}
      </Button>
    </form>
  );
}
