import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/components/ui";
import { formatLabel } from "@/lib/admin/fields";

export function AdminPageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-block text-sm font-medium text-brand-600 hover:underline">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-800 sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-brand-100 bg-white shadow-sm", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-brand-100 px-5 py-3.5">
          <h2 className="font-sans text-base font-semibold text-brand-800">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, tone = "default", href }: { label: string; value: ReactNode; hint?: string; tone?: "default" | "warn" | "good"; href?: string }) {
  const body = (
    <div
      className={cn(
        "h-full rounded-2xl border bg-white p-5 shadow-sm transition",
        href && "hover:border-brand-300 hover:shadow-md",
        tone === "warn" ? "border-red-200" : tone === "good" ? "border-brand-200" : "border-brand-100",
      )}
    >
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={cn("mt-1 font-serif text-3xl font-bold", tone === "warn" ? "text-red-700" : "text-brand-700")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

const badgeTone: Record<string, string> = {
  // leads
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-amber-100 text-amber-800",
  trial_scheduled: "bg-purple-100 text-purple-800",
  trial_done: "bg-indigo-100 text-indigo-800",
  enrolled: "bg-green-100 text-green-800",
  lost: "bg-gray-200 text-gray-700",
  // students
  trial: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  paused: "bg-gray-200 text-gray-700",
  completed: "bg-blue-100 text-blue-800",
  left: "bg-red-100 text-red-800",
  // classes
  scheduled: "bg-blue-100 text-blue-800",
  missed_student: "bg-red-100 text-red-800",
  missed_teacher: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-700",
  // invoices
  unpaid: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  void: "bg-gray-200 text-gray-700",
  overdue: "bg-red-100 text-red-800",
  // misc
  contact: "bg-sky-100 text-sky-800",
  male: "bg-sky-100 text-sky-800",
  female: "bg-pink-100 text-pink-800",
};

export function Badge({ value }: { value: string }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTone[value] ?? "bg-brand-100 text-brand-800")}>
      {value === "trial" ? "Trial" : formatLabel(value)}
    </span>
  );
}

export function Flash({ saved, deleted }: { saved?: string; deleted?: string }) {
  if (!saved && !deleted) return null;
  return (
    <p role="status" className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
      {deleted ? "Deleted." : "Saved."}
    </p>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center">
      <p className="font-serif text-xl font-bold text-brand-800">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}

export const linkButton =
  "inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700";
export const linkButtonOutline =
  "inline-flex items-center justify-center rounded-full border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50";
