import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/components/ui";
import { Icon, type IconName } from "@/components/teacher/icons";
import { safeZone } from "@/lib/admin/time";
import { formatTimePadded } from "@/lib/admin/time-family";

/** Soft contour-map lines drawn behind hero cards. */
function Topo() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill="none" stroke="#ffffff" strokeWidth="2">
        {Array.from({ length: 11 }, (_, i) => (
          <path key={`a${i}`} strokeOpacity={0.07 + (i % 3) * 0.015} transform={`translate(0 ${i * 38 - 140})`} d="M-60 300C60 210 140 350 270 275S450 110 570 205 750 335 880 215" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <path key={`b${i}`} strokeOpacity="0.06" transform={`translate(${i * 14 - 40} ${i * 52 - 60})`} d="M520 -20C600 60 560 140 640 190S760 230 840 330" />
        ))}
      </g>
    </svg>
  );
}

export function Hero({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b3f33] via-[#12604b] to-[#2a8c72] text-white shadow-[0_22px_44px_-20px_rgba(11,63,51,0.7)]",
        className,
      )}
    >
      <Topo />
      <div className="relative">{children}</div>
    </section>
  );
}

export function SCard({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("min-w-0 rounded-3xl bg-white p-5 shadow-[0_6px_24px_-12px_rgba(15,60,45,0.25)] sm:p-6", className)}>{children}</section>;
}

/** Page heading used on inner pages: back arrow, small label and title. */
export function SubHeader({ eyebrow, title, back = "/student" }: { eyebrow: string; title: string; back?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3 lg:pr-56">
      <Link
        href={back}
        aria-label="Back"
        className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white text-slate-800 shadow-[0_4px_14px_-6px_rgba(15,60,45,0.3)] transition hover:bg-emerald-50 print:hidden"
      >
        <Icon name="arrow-left" className="h-5 w-5" />
      </Link>
      <div>
        <p className="text-xs font-bold text-slate-400">{eyebrow}</p>
        <h1 className="font-sans text-xl font-extrabold text-slate-900">{title}</h1>
      </div>
    </div>
  );
}

const avatarTones = ["bg-emerald-100 text-emerald-700", "bg-teal-100 text-teal-700", "bg-amber-100 text-amber-700", "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700", "bg-violet-100 text-violet-700"];

/** Initial-letter avatar. The colour is stable per name, so each child keeps their own. */
export function ChildAvatar({ name, className = "h-16 w-16 text-xl" }: { name: string; className?: string }) {
  const tone = avatarTones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarTones.length];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
  return (
    <span className={cn("flex flex-none items-center justify-center rounded-full font-extrabold ring-4 ring-white/70", tone, className)} aria-hidden>
      {initials}
    </span>
  );
}

export type DonutSegment = { label: string; value: number; color: string };

export function Donut({ segments, total, caption = "Classes" }: { segments: DonutSegment[]; total: number; caption?: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-44 w-44 flex-none" role="img" aria-label={`${total} classes this month`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#eef2f0" strokeWidth="16" />
      {total > 0 &&
        segments
          .filter((s) => s.value > 0)
          .map((s) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 60 60)"
              />
            );
            offset += len;
            return el;
          })}
      <text x="60" y="58" textAnchor="middle" className="fill-slate-900 text-[22px] font-extrabold">
        {total}
      </text>
      <text x="60" y="74" textAnchor="middle" className="fill-slate-500 text-[9px] font-semibold">
        {caption}
      </text>
    </svg>
  );
}

export const sBtnDark =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition duration-200 hover:bg-emerald-800 active:scale-[0.97] disabled:opacity-60";
export const sBtnMint =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 transition duration-200 hover:bg-emerald-100 active:scale-[0.97] disabled:opacity-60";
export const sBtnWhite =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-emerald-900 transition duration-200 hover:bg-emerald-50 active:scale-[0.97] disabled:opacity-60";
export const sBtnGreen =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-green-500 to-green-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:from-green-600 hover:to-green-700 active:scale-[0.97] disabled:opacity-60";
export const sInput =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 transition duration-200 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";

const chipTone: Record<string, string> = {
  scheduled: "bg-emerald-50 text-emerald-700",
  completed: "bg-green-100 text-green-700",
  student_leave: "bg-amber-100 text-amber-700",
  teacher_leave: "bg-sky-100 text-sky-700",
  missed_student: "bg-rose-100 text-rose-600",
  missed_teacher: "bg-rose-100 text-rose-600",
  cancelled: "bg-slate-100 text-slate-500",
};
const chipLabel: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  student_leave: "On leave",
  teacher_leave: "Teacher on leave",
  missed_student: "Absent",
  missed_teacher: "Missed by teacher",
  cancelled: "Cancelled",
};

export function ClassStatusChip({ status }: { status: string }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold", chipTone[status] ?? "bg-slate-100 text-slate-600")}>{chipLabel[status] ?? status}</span>;
}

/** The one-line banner shown after "Mark as On Leave" succeeds or is refused. */
export function LeaveNotice({ result }: { result?: string }) {
  if (!result) return null;
  const map: Record<string, [string, string]> = {
    ok: ["bg-emerald-50 text-emerald-800", "Marked as on leave. Your teacher will arrange a make-up class."],
    late: ["bg-amber-50 text-amber-800", "This class starts too soon to mark as on leave. Please contact the academy directly."],
    invalid: ["bg-rose-50 text-rose-700", "That class can no longer be marked as on leave."],
  };
  const [tone, text] = map[result] ?? map.invalid;
  return (
    <p role="status" className={cn("mb-5 rounded-2xl px-5 py-3 text-sm font-bold", tone)}>
      {text}
    </p>
  );
}

/** Calendar-style tile: weekday, day number and month of a class, in the family's time zone. */
export function DateBadge({ date, tz, className }: { date: Date; tz: string; className?: string }) {
  const part = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: safeZone(tz), ...opts }).format(date);
  return (
    <div className={cn("flex h-16 w-14 flex-none flex-col items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800", className)} aria-hidden>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">{part({ weekday: "short" })}</span>
      <span className="font-sans text-xl font-extrabold leading-none">{part({ day: "numeric" })}</span>
      <span className="text-[10px] font-bold uppercase text-emerald-600/80">{part({ month: "short" })}</span>
    </div>
  );
}

/** The class time as short chips: yours first, then the teacher's when their time zone differs. */
export function TimePair({
  startsAt,
  familyTz,
  teacherTz,
  tone = "soft",
  className,
}: {
  startsAt: Date;
  familyTz: string;
  teacherTz: string | null;
  tone?: "soft" | "light";
  className?: string;
}) {
  const mine = formatTimePadded(startsAt, familyTz);
  const theirs = teacherTz && teacherTz !== familyTz ? formatTimePadded(startsAt, teacherTz) : null;
  const both = theirs !== null && theirs !== mine;
  const chip = tone === "light" ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-800";
  const second = tone === "light" ? "bg-white/10 text-emerald-100" : "bg-slate-100 text-slate-600";
  return (
    <div className={cn("flex flex-wrap gap-1.5 text-xs font-bold", className)}>
      <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5", chip)}>
        <Icon name="clock" className="h-3.5 w-3.5" />
        {both ? "You " : ""}
        {mine}
      </span>
      {both && <span className={cn("inline-flex items-center whitespace-nowrap rounded-lg px-2.5 py-1.5", second)}>Teacher {theirs}</span>}
    </div>
  );
}

const statTone = {
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
  amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700",
} as const;

/** Small headline number with an icon, used in the row at the top of the dashboard. */
export function StatTile({
  icon,
  label,
  value,
  hint,
  tone,
  progress,
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  hint: string;
  tone: keyof typeof statTone;
  /** 0 to 1; draws a thin bar under the hint. */
  progress?: number;
}) {
  return (
    <div className="min-w-0 rounded-3xl bg-white p-4 shadow-[0_6px_24px_-12px_rgba(15,60,45,0.25)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(15,60,45,0.35)]">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-10 w-10 flex-none items-center justify-center rounded-2xl", statTone[tone])}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <p className="min-w-0 text-xs font-bold leading-tight text-slate-500">{label}</p>
      </div>
      <p className="mt-3 truncate font-sans text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs leading-snug text-slate-400">{hint}</p>
      {progress !== undefined && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
