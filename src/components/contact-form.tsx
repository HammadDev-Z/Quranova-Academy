"use client";

import { useActionState } from "react";
import { submitContact } from "@/app/actions";
import type { FormState } from "@/lib/validation";
import { Consent, Field, Honeypot, Input, Textarea, Turnstile } from "./form-fields";
import { Button } from "./ui";

const initial: FormState = { ok: false };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 text-brand-800">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <Honeypot />

      {state.message && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" error={e.name}>
          <Input name="name" autoComplete="name" defaultValue={v.name} error={e.name} />
        </Field>
        <Field label="Email" name="email" error={e.email}>
          <Input name="email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} />
        </Field>
      </div>
      <Field label="Phone / WhatsApp (optional)" name="phone" error={e.phone}>
        <Input name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} error={e.phone} />
      </Field>
      <Field label="Message" name="message" error={e.message}>
        <Textarea name="message" defaultValue={v.message} error={e.message} />
      </Field>

      <Consent error={e.consent} />
      <Turnstile />

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
