import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/components/ui";
import { Icon } from "./icons";

export function PageTitle({
  title,
  crumb = "Dashboards",
  subtitle,
  actions,
  upper,
}: {
  title: string;
  crumb?: string;
  subtitle?: string;
  actions?: ReactNode;
  upper?: boolean;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        {crumb && (
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Icon name="home" className="h-4 w-4" />
            <Icon name="chevron-right" className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-600">{crumb}</span>
          </p>
        )}
        <h1 className={cn("font-sans text-3xl font-extrabold tracking-tight text-navy sm:text-4xl", upper && "uppercase")}>{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function TCard({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("min-w-0 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,27,61,0.04)] sm:p-7", className)}>{children}</section>;
}

type Tone = "green" | "blue" | "purple" | "red" | "amber" | "slate" | "rose" | "sky";

const tones: Record<Tone, string> = {
  green: "bg-green-500 text-white",
  blue: "bg-blue-600 text-white",
  purple: "bg-purple-600 text-white",
  red: "bg-rose-500 text-white",
  amber: "bg-amber-400 text-amber-950",
  slate: "bg-slate-100 text-slate-700",
  rose: "bg-rose-100 text-rose-600",
  sky: "bg-sky-100 text-sky-700",
};

export function Pill({ tone = "slate", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold", tones[tone], className)}>{children}</span>
  );
}

/** Class status shown as a coloured pill, using the same wording as the admin. */
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, [Tone, string]> = {
    scheduled: ["blue", "Scheduled"],
    completed: ["green", "Completed"],
    missed_student: ["red", "Absent"],
    missed_teacher: ["red", "Teacher Absent"],
    student_leave: ["purple", "Student On Leave"],
    teacher_leave: ["purple", "Teacher on Leave"],
    cancelled: ["slate", "Cancelled"],
  };
  const [tone, label] = map[status] ?? ["slate", status];
  return <Pill tone={tone}>{label}</Pill>;
}

export function ReportPill({ status }: { status: string | null }) {
  if (!status) return <span className="inline-flex rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-400">Pending</span>;
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    submitted: "bg-amber-100 text-amber-700",
    reviewed: "bg-green-100 text-green-700",
  };
  const label: Record<string, string> = { draft: "Draft", submitted: "Submitted", reviewed: "Verified" };
  return <span className={cn("inline-flex rounded-lg px-3 py-1.5 text-sm font-semibold", map[status])}>{label[status] ?? status}</span>;
}

export function Avatar({ name, className = "h-14 w-14 text-lg" }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
  return (
    <span className={cn("flex flex-none items-center justify-center rounded-full bg-sage-200 font-bold text-navy", className)} aria-hidden>
      {initials || "T"}
    </span>
  );
}

/** Small coloured circular icon link, used for per-row actions. */
export function IconCircle({
  href,
  label,
  tone,
  icon,
  badge,
}: {
  href: string;
  label: string;
  tone: string;
  icon: Parameters<typeof Icon>[0]["name"];
  badge?: number;
}) {
  return (
    <Link href={href} title={label} aria-label={label} className={cn("relative flex h-11 w-11 flex-none items-center justify-center rounded-full text-white transition hover:scale-105", tone)}>
      <Icon name={icon} className="h-5 w-5" />
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">{badge}</span>
      ) : null}
    </Link>
  );
}

export const btnGreen =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-green-600 active:scale-[0.97] disabled:opacity-60";
export const btnSoft =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-green-100 px-5 py-3 text-sm font-semibold text-green-600 transition duration-200 hover:bg-green-200 active:scale-[0.97] disabled:opacity-60";
export const btnYellow =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-amber-950 shadow-sm transition duration-200 hover:bg-amber-300 active:scale-[0.97]";
export const inputBase =
  "w-full rounded-xl border border-transparent bg-slate-100/80 px-4 py-3 text-slate-800 transition-colors duration-200 placeholder:text-slate-400 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-200";
