"use client";

import { useActionState } from "react";
import { btnGreen, inputBase } from "./ui";
import {
  rescheduleToSlot,
  saveAvailability,
  saveClassNotes,
  swapClasses,
  updateProgress,
  type AvailabilityState,
  type NotesState,
  type ProgressState,
  type RescheduleState,
} from "@/lib/teacher/actions";
import { changeOwnPassword, loginTeacher, type AuthState } from "@/lib/auth/actions";
import type { Slot } from "@/lib/teacher/slots";

function Message({ ok, message }: { ok?: boolean; message?: string }) {
  if (!message) return null;
  return (
    <p role={ok ? "status" : "alert"} className={`rounded-2xl px-4 py-3 text-sm font-medium ${ok ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"}`}>
      {message}
    </p>
  );
}

const label = "mb-1.5 block text-sm font-semibold text-slate-600";

export function ClassNotesForm({ classId, lessonNotes, homework }: { classId: string; lessonNotes: string; homework: string }) {
  const [state, action, pending] = useActionState(saveClassNotes.bind(null, classId), {} as NotesState);
  return (
    <form action={action} className="space-y-5">
      <Message ok={state.ok} message={state.message} />
      <div>
        <label htmlFor="lessonNotes" className={label}>What was covered</label>
        <textarea id="lessonNotes" name="lessonNotes" rows={5} defaultValue={lessonNotes} className={inputBase} placeholder="Pages read, rules taught, mistakes to watch…" />
      </div>
      <div>
        <label htmlFor="homework" className={label}>Homework</label>
        <textarea id="homework" name="homework" rows={3} defaultValue={homework} className={inputBase} placeholder="What the student should practise before the next class" />
      </div>
      <button type="submit" disabled={pending} className={btnGreen}>
        {pending ? "Saving…" : "Save notes"}
      </button>
    </form>
  );
}

export function ProgressForm({
  studentId,
  values,
  basicTitle,
  additionalTitle,
}: {
  studentId: string;
  values: { basicPart: string; basicPage: number; tajweedStep: number; additionalPart: string; additionalPage: number };
  basicTitle: string;
  additionalTitle: string;
}) {
  const [state, action, pending] = useActionState(updateProgress.bind(null, studentId), {} as ProgressState);
  const e = state.errors ?? {};
  const field = (name: string, text: string, value: string | number, type: "text" | "number" = "number", hint?: string) => (
    <div>
      <label htmlFor={name} className={label}>{text}</label>
      <input id={name} name={name} type={type} inputMode={type === "number" ? "numeric" : undefined} defaultValue={value} className={inputBase} aria-invalid={!!e[name]} />
      {hint && !e[name] && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {e[name] && <p className="mt-1 text-xs text-rose-600">{e[name]}</p>}
    </div>
  );
  return (
    <form action={action} className="space-y-5">
      <Message ok={state.ok} message={state.message} />
      <div>
        <p className="mb-3 font-sans font-bold text-navy">{basicTitle}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {field("basicPart", "Current part", values.basicPart, "text", "e.g. Para 01")}
          {field("basicPage", "Current page", values.basicPage)}
          {field("tajweedStep", "Tajweed step", values.tajweedStep)}
        </div>
      </div>
      <div>
        <p className="mb-3 font-sans font-bold text-navy">{additionalTitle}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("additionalPart", "Current part", values.additionalPart, "text")}
          {field("additionalPage", "Current page", values.additionalPage)}
        </div>
      </div>
      <button type="submit" disabled={pending} className={btnGreen}>
        {pending ? "Saving…" : "Save progress"}
      </button>
    </form>
  );
}

export function SwapForm({ classId, options }: { classId: string; options: { id: string; label: string; sub: string }[] }) {
  const [state, action, pending] = useActionState(swapClasses.bind(null, classId), {} as RescheduleState);
  return (
    <form action={action} className="space-y-4">
      <Message ok={state.ok} message={state.message} />
      <fieldset className="space-y-2">
        <legend className="sr-only">Choose a class to swap with</legend>
        {options.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 px-5 py-4 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
            <input type="radio" name="otherId" value={o.id} className="h-4 w-4 accent-green-600" />
            <span>
              <span className="block font-bold uppercase text-navy">{o.label}</span>
              <span className="text-sm text-slate-500">{o.sub}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={pending || options.length === 0} className={btnGreen}>
        {pending ? "Swapping…" : "Swap these classes"}
      </button>
    </form>
  );
}

export function SlotPicker({ classId, slots, studentName }: { classId: string; slots: Slot[]; studentName: string }) {
  const [state, action, pending] = useActionState(rescheduleToSlot.bind(null, classId), {} as RescheduleState);
  const open = slots.filter((s) => s.available).length;
  return (
    <form action={action} className="space-y-5">
      <Message ok={state.ok} message={state.message} />
      <p className="text-sm text-slate-500">
        {open} of {slots.length} slots are open. Greyed-out slots show why they cannot be chosen.
      </p>
      <fieldset>
        <legend className="sr-only">Time slots for {studentName}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {slots.map((s) => (
            <label
              key={s.iso}
              title={s.reason ?? "Available"}
              className={`rounded-2xl border px-4 py-3 text-center ${
                s.available
                  ? "cursor-pointer border-slate-200 bg-white hover:border-green-400 has-[:checked]:border-green-500 has-[:checked]:bg-green-500 has-[:checked]:text-white"
                  : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
              }`}
            >
              <input type="radio" name="slot" value={s.iso} disabled={!s.available} className="sr-only" />
              <span className="block text-base font-bold">{s.label}</span>
              {s.studentLabel && s.available && <span className="block text-xs opacity-70">Student: {s.studentLabel}</span>}
              {!s.available && <span className="mt-0.5 block text-[11px] leading-tight">{s.reason}</span>}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="note" className={label}>Note (optional)</label>
        <input id="note" name="note" maxLength={300} className={inputBase} placeholder="Reason for the change" />
      </div>
      <button type="submit" disabled={pending || open === 0} className={btnGreen}>
        {pending ? "Saving…" : "Confirm new time"}
      </button>
    </form>
  );
}

export function TeacherSignInForm() {
  const [state, action, pending] = useActionState(loginTeacher, {} as AuthState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <Message message={state.message} />
      <div>
        <label htmlFor="email" className={label}>Email</label>
        <input id="email" name="email" type="email" autoComplete="username" defaultValue={state.email} className={inputBase} required />
      </div>
      <div>
        <label htmlFor="password" className={label}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" className={inputBase} required />
      </div>
      <button type="submit" disabled={pending} className={btnGreen + " w-full py-3.5 text-base"}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function TeacherPasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, {} as AuthState);
  const e = state.errors ?? {};
  const field = (name: string, text: string, auto: string, hint?: string) => (
    <div>
      <label htmlFor={name} className={label}>{text}</label>
      <input id={name} name={name} type="password" autoComplete={auto} className={inputBase} aria-invalid={!!e[name]} />
      {hint && !e[name] && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {e[name] && <p className="mt-1 text-sm text-rose-600">{e[name]}</p>}
    </div>
  );
  return (
    <form action={action} className="max-w-md space-y-5" noValidate>
      <Message ok={state.ok} message={state.message} />
      {field("current", "Current password", "current-password")}
      {field("next", "New password", "new-password", "At least 10 characters, with letters and numbers")}
      {field("confirm", "Confirm new password", "new-password")}
      <button type="submit" disabled={pending} className={btnGreen}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function AvailabilityForm({ slots }: { slots: Record<number, { start: string; end: string }> }) {
  const [state, action, pending] = useActionState(saveAvailability, {} as AvailabilityState);
  return (
    <form action={action} className="space-y-5">
      <Message ok={state.ok} message={state.message} />
      <div className="space-y-3">
        {DAYS.map((day, i) => (
          <div key={day} className="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 px-5 py-4">
            <span className="w-28 flex-none font-sans font-bold text-navy">{day}</span>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              From
              <input type="time" name={`start_${i}`} defaultValue={slots[i]?.start ?? ""} className="rounded-xl border border-transparent bg-white px-3 py-2 text-slate-800 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              To
              <input type="time" name={`end_${i}`} defaultValue={slots[i]?.end ?? ""} className="rounded-xl border border-transparent bg-white px-3 py-2 text-slate-800 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200" />
            </label>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-400">
        Leave both times empty for a day you are off. These hours decide which slots the reschedule picker offers you.
      </p>
      <button type="submit" disabled={pending} className={btnGreen}>
        {pending ? "Saving…" : "Save availability"}
      </button>
    </form>
  );
}
