import { and, asc, count, desc, eq, gte, lt, ne, sql } from "drizzle-orm";
import Link from "next/link";
import { AdminPageHeader, Badge, Panel, StatCard } from "@/components/admin/ui";
import { activity, classSessions, db, guardians, invoices, leads, students, teachers } from "@/db";
import { formatMoney } from "@/lib/admin/format";
import { addDays, dayRange, formatDateTime, fromLocalInput, monthKey, startOfWeek, todayKey } from "@/lib/admin/time";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

export const metadata = { title: "Dashboard" };

const sumByCurrency = (rows: { currency: string; total: number | null }[]) =>
  rows.length ? rows.map((r) => formatMoney(r.total ?? 0, r.currency)).join(" + ") : formatMoney(0);

export default async function DashboardPage() {
  const user = await requireAdmin();
  const { adminTimezone: tz } = await getRawSettings();

  const today = todayKey(tz);
  const month = monthKey(tz);
  const [dayStart, dayEnd] = dayRange(today, addDays(today, 1), tz);
  const weekStartKey = startOfWeek(today);
  const [weekStart, weekEnd] = dayRange(weekStartKey, addDays(weekStartKey, 7), tz);
  const monthStart = fromLocalInput(`${month}-01T00:00`, tz)!;

  const inRange = (from: Date, to: Date) => and(gte(classSessions.startsAt, from), lt(classSessions.startsAt, to));

  const [
    [newLeads],
    [monthLeads],
    [activeStudents],
    [trialStudents],
    [activeTeachers],
    [parents],
    [classesToday],
    [classesWeek],
    [doneMonth],
    [missedMonth],
    unpaid,
    overdue,
    revenue,
    recentLeads,
    upcoming,
    recentActivity,
  ] = await Promise.all([
    db.select({ n: count() }).from(leads).where(eq(leads.status, "new")),
    db.select({ n: count() }).from(leads).where(gte(leads.createdAt, monthStart)),
    db.select({ n: count() }).from(students).where(eq(students.status, "active")),
    db.select({ n: count() }).from(students).where(eq(students.status, "trial")),
    db.select({ n: count() }).from(teachers).where(eq(teachers.active, true)),
    db.select({ n: count() }).from(guardians),
    db.select({ n: count() }).from(classSessions).where(and(inRange(dayStart, dayEnd), ne(classSessions.status, "cancelled"))),
    db.select({ n: count() }).from(classSessions).where(and(inRange(weekStart, weekEnd), ne(classSessions.status, "cancelled"))),
    db.select({ n: count() }).from(classSessions).where(and(gte(classSessions.startsAt, monthStart), eq(classSessions.status, "completed"))),
    db
      .select({ n: count() })
      .from(classSessions)
      .where(and(gte(classSessions.startsAt, monthStart), sql`${classSessions.status} in ('missed_student','missed_teacher')`)),
    db
      .select({ currency: invoices.currency, total: sql<number>`sum(${invoices.amountMinor})`, n: count() })
      .from(invoices)
      .where(eq(invoices.status, "unpaid"))
      .groupBy(invoices.currency),
    db
      .select({ currency: invoices.currency, total: sql<number>`sum(${invoices.amountMinor})`, n: count() })
      .from(invoices)
      .where(and(eq(invoices.status, "unpaid"), lt(invoices.dueOn, today)))
      .groupBy(invoices.currency),
    db
      .select({ currency: invoices.currency, total: sql<number>`sum(${invoices.amountMinor})` })
      .from(invoices)
      .where(and(eq(invoices.status, "paid"), sql`${invoices.paidOn} like ${month + "%"}`))
      .groupBy(invoices.currency),
    db.select().from(leads).orderBy(desc(leads.createdAt)).limit(6),
    db
      .select({
        id: classSessions.id,
        startsAt: classSessions.startsAt,
        status: classSessions.status,
        isTrial: classSessions.isTrial,
        student: students.name,
        teacher: teachers.name,
      })
      .from(classSessions)
      .leftJoin(students, eq(students.id, classSessions.studentId))
      .leftJoin(teachers, eq(teachers.id, classSessions.teacherId))
      .where(and(gte(classSessions.startsAt, new Date()), eq(classSessions.status, "scheduled")))
      .orderBy(asc(classSessions.startsAt))
      .limit(8),
    db.select().from(activity).orderBy(desc(activity.createdAt)).limit(8),
  ]);

  const overdueCount = overdue.reduce((a, r) => a + r.n, 0);
  const unpaidCount = unpaid.reduce((a, r) => a + r.n, 0);

  return (
    <>
      <AdminPageHeader title={`Assalamu alaikum, ${user.name.split(" ")[0]}`} description="Here is how the academy is doing today." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New leads" value={newLeads.n} hint={`${monthLeads.n} this month`} href="/admin/leads?status=new" tone={newLeads.n > 0 ? "good" : "default"} />
        <StatCard label="Active students" value={activeStudents.n} hint={`${trialStudents.n} on trial`} href="/admin/students" />
        <StatCard label="Active teachers" value={activeTeachers.n} hint={`${parents.n} parents on file`} href="/admin/teachers" />
        <StatCard label="Classes today" value={classesToday.n} hint={`${classesWeek.n} this week`} href="/admin/classes" />
        <StatCard label="Completed this month" value={doneMonth.n} hint={`${missedMonth.n} missed`} href="/admin/classes" />
        <StatCard label="Collected this month" value={sumByCurrency(revenue)} href="/admin/invoices?status=paid" tone="good" />
        <StatCard label="Awaiting payment" value={sumByCurrency(unpaid)} hint={`${unpaidCount} invoice${unpaidCount === 1 ? "" : "s"}`} href="/admin/invoices?status=unpaid" />
        <StatCard label="Overdue" value={sumByCurrency(overdue)} hint={`${overdueCount} invoice${overdueCount === 1 ? "" : "s"}`} href="/admin/invoices?status=unpaid" tone={overdueCount > 0 ? "warn" : "default"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Latest leads"
          actions={
            <Link href="/admin/leads" className="text-sm font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          }
        >
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted">No leads yet. Requests from the website will appear here.</p>
          ) : (
            <ul className="divide-y divide-brand-100">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link href={`/admin/leads/${l.id}`} className="block truncate font-semibold text-brand-700 hover:underline">
                      {l.parentName || l.email || "Unknown"}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      {[l.studentName && `for ${l.studentName}`, l.course, formatDateTime(l.createdAt, tz)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Badge value={l.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Upcoming classes"
          actions={
            <Link href="/admin/classes" className="text-sm font-semibold text-brand-600 hover:underline">
              Schedule
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Nothing scheduled. Add classes from the schedule page.</p>
          ) : (
            <ul className="divide-y divide-brand-100">
              {upcoming.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link href={`/admin/classes/${c.id}`} className="block truncate font-semibold text-brand-700 hover:underline">
                      {formatDateTime(c.startsAt, tz)}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      {c.student ?? "Student"} with {c.teacher ?? "no teacher yet"}
                    </p>
                  </div>
                  {c.isTrial && <Badge value="trial" />}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Recent activity"
        className="mt-6"
        actions={
          <Link href="/admin/activity" className="text-sm font-semibold text-brand-600 hover:underline">
            View all
          </Link>
        }
      >
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted">No activity yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2">
                <span>
                  <span className="font-semibold text-brand-800">{a.userName || "System"}</span> · {a.summary}
                </span>
                <span className="text-xs text-muted">{formatDateTime(a.createdAt, tz)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
