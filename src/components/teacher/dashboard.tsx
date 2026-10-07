import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/components/ui";
import { Icon, type IconName } from "./icons";

const tones = {
  green: { icon: "bg-green-100 text-green-600", bar: "bg-green-500" },
  blue: { icon: "bg-blue-100 text-blue-600", bar: "bg-blue-500" },
  pink: { icon: "bg-pink-100 text-pink-600", bar: "bg-pink-500" },
  amber: { icon: "bg-amber-100 text-amber-600", bar: "bg-amber-400" },
} as const;

export type KpiTone = keyof typeof tones;

/** Headline number with a tinted icon, an optional progress bar and a link to the full list. */
export function KpiCard({
  href,
  label,
  value,
  hint,
  icon,
  tone,
  progress,
}: {
  href: string;
  label: string;
  value: ReactNode;
  hint: string;
  icon: IconName;
  tone: KpiTone;
  /** 0 to 1; draws a bar under the hint. */
  progress?: number;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,27,61,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60"
    >
      <div className="flex items-start justify-between">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", tones[tone].icon)}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <Icon name="arrow-right" className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
      </div>
      <p className="mt-4 font-sans text-4xl font-extrabold tracking-tight text-navy">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
          <div className={cn("h-full rounded-full transition-all duration-700", tones[tone].bar)} style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </Link>
  );
}

/** Card with a title row used by every block on the dashboard. */
export function Block({ title, action, children, className }: { title: string; action?: { href: string; label: string }; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,27,61,0.04)] sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-sans text-lg font-bold text-navy">{title}</h2>
        {action && (
          <Link href={action.href} className="tap flex items-center gap-1 text-sm font-semibold text-green-600 transition hover:text-green-700">
            {action.label}
            <Icon name="arrow-right" className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export type WeekDay = { key: string; label: string; count: number; today: boolean };

/** Seven columns, one per day, with bar height showing how many classes that day has. */
export function WeekChart({ days }: { days: WeekDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <ol className="grid grid-cols-7 gap-2" aria-label="Classes in the next seven days">
      {days.map((d) => (
        <li key={d.key} className="flex flex-col items-center gap-2">
          <span className={cn("text-xs font-bold", d.count ? "text-navy" : "text-slate-300")}>{d.count}</span>
          <div className="flex h-24 w-full items-end rounded-xl bg-slate-50">
            <div
              className={cn("w-full rounded-xl transition-all duration-700", d.today ? "bg-green-500" : "bg-sage-300")}
              style={{ height: `${d.count ? Math.max(12, (d.count / max) * 100) : 0}%` }}
              title={`${d.count} class${d.count === 1 ? "" : "es"}`}
            />
          </div>
          <span className={cn("text-[11px] font-semibold", d.today ? "text-green-600" : "text-slate-400")}>{d.label}</span>
        </li>
      ))}
    </ol>
  );
}

export type MixSegment = { label: string; value: number; color: string };

/** One stacked bar plus a legend, showing how the teacher's students split by status. */
export function MixBar({ segments }: { segments: MixSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return <p className="py-2 text-sm text-slate-400">No students assigned yet.</p>;
  return (
    <>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={segments.map((s) => `${s.value} ${s.label}`).join(", ")}>
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div key={s.label} className={cn("h-full transition-all duration-700", s.color)} style={{ width: `${(s.value / total) * 100}%` }} />
          ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2 text-slate-600">
            <span className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", s.color)} />
              {s.label}
            </span>
            <span className="font-bold text-navy">{s.value}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export type AttentionItem = { href: string; text: string; /** Wording used when the count is exactly 1. */ one: string; count: number; icon: IconName };

/** Things that need the teacher, most urgent first. Shows a calm message when there is nothing. */
export function AttentionList({ items }: { items: AttentionItem[] }) {
  const open = items.filter((i) => i.count > 0);
  if (open.length === 0) {
    return (
      <p className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-4 text-sm font-semibold text-green-700">
        <Icon name="check" className="h-5 w-5" /> You are all caught up.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {open.map((i) => (
        <li key={i.href + i.text}>
          <Link href={i.href} className="group flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <Icon name={i.icon} className="h-[1.1rem] w-[1.1rem]" />
            </span>
            <span className="min-w-0 flex-1 text-sm text-slate-600">
              <b className="text-navy">{i.count}</b> {i.count === 1 ? i.one : i.text}
            </span>
            <Icon name="chevron-right" className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
