"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/form-fields";
import { Button } from "@/components/ui";
import { changeOwnPassword, createAdminUser, createTeacherLogin, login, loginTeacher, resetUserPassword, type AuthState } from "@/lib/auth/actions";

const initial: AuthState = {};

function Notice({ state }: { state: AuthState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={
        state.ok
          ? "rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"
          : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      }
    >
      {state.message}
    </p>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);
  return (
    <form action={action} className="space-y-5" noValidate>
      <Notice state={state} />
      <Field label="Email" name="email">
        <Input name="email" type="email" autoComplete="username" defaultValue={state.email} required />
      </Field>
      <Field label="Password" name="password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function TeacherLoginForm() {
  const [state, action, pending] = useActionState(loginTeacher, initial);
  return (
    <form action={action} className="space-y-5" noValidate>
      <Notice state={state} />
      <Field label="Email" name="email">
        <Input name="email" type="email" autoComplete="username" defaultValue={state.email} required />
      </Field>
      <Field label="Password" name="password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, initial);
  const e = state.errors ?? {};
  return (
    <form action={action} className="max-w-md space-y-5" noValidate>
      <Notice state={state} />
      <Field label="Current password" name="current" error={e.current}>
        <Input name="current" type="password" autoComplete="current-password" error={e.current} />
      </Field>
      <Field label="New password" name="next" error={e.next} hint="At least 10 characters, with letters and numbers">
        <Input name="next" type="password" autoComplete="new-password" error={e.next} />
      </Field>
      <Field label="Confirm new password" name="confirm" error={e.confirm}>
        <Input name="confirm" type="password" autoComplete="new-password" error={e.confirm} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}

export function CreateAdminForm() {
  const [state, action, pending] = useActionState(createAdminUser, initial);
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Notice state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Name" name="name" error={e.name}>
          <Input name="name" autoComplete="off" error={e.name} />
        </Field>
        <Field label="Email" name="email" error={e.email}>
          <Input name="email" type="email" autoComplete="off" error={e.email} />
        </Field>
        <Field label="Temporary password" name="password" error={e.password} hint="10+ characters, letters and numbers">
          <Input name="password" type="text" autoComplete="off" error={e.password} />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create admin account"}
      </Button>
    </form>
  );
}

export function CreateTeacherLoginForm({ teacherId }: { teacherId: string }) {
  const [state, action, pending] = useActionState(createTeacherLogin.bind(null, teacherId), initial);
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-3" noValidate>
      <Notice state={state} />
      <Field label="Temporary password" name="password" error={e.password} hint="10+ characters, letters and numbers. Share it with the teacher securely.">
        <Input name="password" type="text" autoComplete="off" error={e.password} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create portal login"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(resetUserPassword.bind(null, userId), initial);
  const e = state.errors ?? {};
  return (
    <form action={action} className="flex flex-wrap items-start gap-2" noValidate>
      <div>
        <input
          name="password"
          type="text"
          autoComplete="off"
          placeholder="New password"
          aria-label="New password"
          className="w-44 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm"
        />
        {e.password && <p className="mt-1 text-xs text-red-700">{e.password}</p>}
        {state.message && <p className={`mt-1 text-xs ${state.ok ? "text-brand-700" : "text-red-700"}`}>{state.message}</p>}
      </div>
      <button type="submit" disabled={pending} className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
        {pending ? "…" : "Reset"}
      </button>
    </form>
  );
}
