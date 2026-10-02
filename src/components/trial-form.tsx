"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitTrial } from "@/app/actions";
import { NOT_SURE_COURSE, teacherPreferences, type FormState } from "@/lib/validation";
import { Consent, Field, Honeypot, Input, Select, Textarea, Turnstile } from "./form-fields";
import { Button } from "./ui";

const initial: FormState = { ok: false };

export function TrialForm({ courseTitles, defaultCourse }: { courseTitles: string[]; defaultCourse?: string }) {
  const [state, action, pending] = useActionState(submitTrial, initial);
  const tz = useRef<HTMLInputElement>(null);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  // Pre-fill the visitor's timezone so we can match a teacher at sensible hours.
  useEffect(() => {
    if (tz.current && !tz.current.value) {
      try {
        tz.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        /* leave blank */
      }
    }
  }, []);

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <Honeypot />

      {state.message && !state.ok && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Parent / guardian name" name="parentName" error={e.parentName}>
          <Input name="parentName" autoComplete="name" defaultValue={v.parentName} error={e.parentName} />
        </Field>
        <Field label="Student name" name="studentName" error={e.studentName}>
          <Input name="studentName" defaultValue={v.studentName} error={e.studentName} />
        </Field>
        <Field label="Student age" name="studentAge" error={e.studentAge}>
          <Input name="studentAge" type="number" inputMode="numeric" min={3} max={100} defaultValue={v.studentAge} error={e.studentAge} />
        </Field>
        <Field label="Country" name="country" error={e.country}>
          <Input name="country" autoComplete="country-name" defaultValue={v.country} error={e.country} />
        </Field>
        <Field label="Email" name="email" error={e.email}>
          <Input name="email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} />
        </Field>
        <Field label="WhatsApp number" name="whatsapp" error={e.whatsapp} hint="Include the country code, e.g. +44 7700 900123">
          <Input name="whatsapp" type="tel" autoComplete="tel" defaultValue={v.whatsapp} error={e.whatsapp} />
        </Field>
        <Field label="Course" name="course" error={e.course}>
          <Select
            name="course"
            options={[...courseTitles, NOT_SURE_COURSE]}
            placeholder="Choose a course"
            defaultValue={v.course ?? defaultCourse ?? ""}
            error={e.course}
          />
        </Field>
        <Field label="Teacher preference" name="teacherPreference" error={e.teacherPreference}>
          <Select name="teacherPreference" options={teacherPreferences} defaultValue={v.teacherPreference ?? "No preference"} />
        </Field>
      </div>

      <Field
        label="Preferred class times"
        name="preferredTime"
        error={e.preferredTime}
        hint="For example: weekdays after 5pm, or Saturday mornings"
      >
        <Input name="preferredTime" defaultValue={v.preferredTime} error={e.preferredTime} />
      </Field>

      <Field label="Anything else we should know? (optional)" name="message" error={e.message}>
        <Textarea name="message" defaultValue={v.message} error={e.message} />
      </Field>

      <input ref={tz} type="hidden" name="timezone" defaultValue={v.timezone} />

      <Consent error={e.consent} />
      <Turnstile />

      <Button type="submit" size="lg" variant="gold" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : "Book my free trial"}
      </Button>
    </form>
  );
}
