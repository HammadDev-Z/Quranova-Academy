"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/form-fields";
import { Button } from "@/components/ui";
import { uploadMaterial, type MaterialState } from "@/lib/admin/materials-actions";

const initial: MaterialState = {};

export function MaterialUploadForm() {
  const [state, action, pending] = useActionState(uploadMaterial, initial);
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Title" name="title" error={e.title}>
          <Input name="title" error={e.title} placeholder="e.g. Tajweed rules cheat sheet" />
        </Field>
        <Field label="Category" name="category" hint="e.g. Qaida, Tajweed, Duas">
          <Input name="category" placeholder="General" />
        </Field>
        <Field label="File" name="file" error={e.file} hint="PDF, image, MP3 or MP4, up to 20MB">
          <input
            name="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.mp3,.m4a,.mp4"
            className="block w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700"
          />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
