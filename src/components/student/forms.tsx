"use client";

import { useActionState } from "react";
import { changeOwnPassword, loginParent, type AuthState } from "@/lib/auth/actions";
import { requestNewStudent, saveTimezone, type SimpleState, type StudentRequestState } from "@/lib/student/actions";
import { sBtnDark, sBtnGreen, sInput } from "./ui";

const label = "mb-1.5 block text-sm font-bold text-slate-700";

function Notice({ ok, message }: { ok?: boolean; message?: string }) {
  if (!message) return null;
  return (
    <p role={ok ? "status" : "alert"} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
      {message}
    </p>
  );
}

export function FamilyLoginForm() {
  const [state, action, pending] = useActionState(loginParent, {} as AuthState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <Notice message={state.message} />
      <div>
        <label htmlFor="identifier" className={label}>Username or email</label>
        <input id="identifier" name="identifier" autoComplete="username" autoCapitalize="none" defaultValue={state.email} className={sInput} required />
      </div>
      <div>
        <label htmlFor="password" className={label}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" className={sInput} required />
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <input type="checkbox" name="remember" className="h-4 w-4 accent-emerald-700" />
        Keep me signed in on this device for 10 days
      </label>
      <button type="submit" disabled={pending} className={sBtnGreen + " w-full"}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, {} as AuthState);
  const e = state.errors ?? {};
  const field = (name: string, text: string, auto: string, hint?: string) => (
    <div>
      <label htmlFor={name} className={label}>{text}</label>
      <input id={name} name={name} type="password" autoComplete={auto} className={sInput} aria-invalid={!!e[name]} />
      {hint && !e[name] && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {e[name] && <p className="mt-1 text-sm font-semibold text-rose-600">{e[name]}</p>}
    </div>
  );
  return (
    <form action={action} className="space-y-4" noValidate>
      <Notice ok={state.ok} message={state.message} />
      {field("current", "Current password", "current-password")}
      {field("next", "New password", "new-password", "At least 10 characters, with letters and numbers")}
      {field("confirm", "Confirm new password", "new-password")}
      <button type="submit" disabled={pending} className={sBtnGreen + " w-full"}>
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

export function TimezoneForm({ current, zones }: { current: string; zones: string[] }) {
  const [state, action, pending] = useActionState(saveTimezone, {} as SimpleState);
  return (
    <form action={action} className="space-y-4">
      <Notice ok={state.ok} message={state.message} />
      <div>
        <label htmlFor="timezone" className={label}>Your time zone</label>
        <input id="timezone" name="timezone" list="zone-list" defaultValue={current} className={sInput} autoComplete="off" />
        <datalist id="zone-list">
          {zones.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-slate-400">Class times across the portal are shown in this time zone, next to your teacher&apos;s time.</p>
      </div>
      <button type="submit" disabled={pending} className={sBtnDark}>
        {pending ? "Saving…" : "Save time zone"}
      </button>
    </form>
  );
}

export function NewStudentForm({ courses }: { courses: string[] }) {
  const [state, action, pending] = useActionState(requestNewStudent, {} as StudentRequestState);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (state.ok) return <Notice ok message={state.message} />;

  return (
    <form action={action} className="space-y-5" noValidate>
      <Notice message={state.message} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="studentName" className={label}>Child&apos;s name *</label>
          <input id="studentName" name="studentName" defaultValue={v.studentName} className={sInput} aria-invalid={!!e.studentName} />
          {e.studentName && <p className="mt-1 text-sm font-semibold text-rose-600">{e.studentName}</p>}
        </div>
        <div>
          <label htmlFor="age" className={label}>Age</label>
          <input id="age" name="age" type="number" inputMode="numeric" min={3} max={100} defaultValue={v.age} className={sInput} aria-invalid={!!e.age} />
          {e.age && <p className="mt-1 text-sm font-semibold text-rose-600">{e.age}</p>}
        </div>
        <div>
          <label htmlFor="course" className={label}>Course</label>
          <select id="course" name="course" defaultValue={v.course ?? ""} className={sInput}>
            <option value="">Not sure yet</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="preferredTime" className={label}>Preferred class times</label>
          <input id="preferredTime" name="preferredTime" defaultValue={v.preferredTime} placeholder="e.g. weekdays after 5pm" className={sInput} />
        </div>
      </div>
      <div>
        <label htmlFor="note" className={label}>Anything we should know?</label>
        <textarea id="note" name="note" rows={3} defaultValue={v.note} className={sInput} />
      </div>
      <button type="submit" disabled={pending} className={sBtnGreen}>
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
