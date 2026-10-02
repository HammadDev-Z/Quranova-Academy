import { and, asc, count, eq, gt, gte, inArray, lt, notInArray } from "drizzle-orm";
import Link from "next/link";
import { classSessions, db, progressReports, students } from "@/db";
import { Icon } from "@/components/teacher/icons";
import { Avatar, Pill, StatusPill, TCard, PageTitle } from "@/components/teacher/ui";
import { VerifiedSeal } from "@/components/teacher/icons";
import { addDays, dayRange, formatTime12, todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { MAX_RESCHEDULES, RECOVERY_STATUSES } from "@/lib/teacher/constants";

export const metadata = { title: "Teacher Dashboard" };

export default async function TeacherDashboardPage() {
  const me = await requireTeacher();
  const tz = me.timezone;
  const today = todayKey(tz);
  const [dayStart, dayEnd] = dayRange(today, addDays(today, 1), tz);
  const month = today.slice(0, 7);

  const mine = eq(students.teacherId, me.teacherId);
  const [[active], [left], [trial], todayClasses, [waiting], assigned, submitted] = await Promise.all([
    db.select({ n: count() }).from(students).where(and(mine, eq(students.status, "active"))),
    db.select({ n: count() }).from(students).where(and(mine, eq(students.status, "left"))),
    db.select({ n: count() }).from(students).where(and(mine, eq(students.status, "trial"))),
    db
      .select({
        id: classSessions.id,
        startsAt: classSessions.startsAt,
        status: classSessions.status,
        isTrial: classSessions.isTrial,
        student: students.name,
      })
      .from(classSessions)
      .innerJoin(students, eq(students.id, classSessions.studentId))
      .where(and(eq(classSessions.teacherId, me.teacherId), gte(classSessions.startsAt, dayStart), lt(classSessions.startsAt, dayEnd)))
      .orderBy(asc(classSessions.startsAt)),
    db
      .select({ n: count() })
      .from(classSessions)
      .where(
        and(
          eq(classSessions.teacherId, me.teacherId),
          inArray(classSessions.status, [...RECOVERY_STATUSES]),
          gt(classSessions.rescheduleDeadline, new Date()),
          lt(classSessions.rescheduleCount, MAX_RESCHEDULES),
        ),
      ),
    db.select({ id: students.id }).from(students).where(and(mine, notInArray(students.status, ["left", "completed"]))),
    db
      .select({ studentId: progressReports.studentId })
      .from(progressReports)
      .where(and(eq(progressReports.teacherId, me.teacherId), eq(progressReports.month, month), notInArray(progressReports.status, ["draft"]))),
  ]);

  const done = new Set(submitted.map((r) => r.studentId));
  const reportsDue = assigned.filter((s) => !done.has(s.id)).length;

  const stats = [
    { label: "Active Students", value: active.n, arrow: "arrow-up" as const, color: "text-blue-500" },
    { label: "Left Students", value: left.n, arrow: "arrow-down" as const, color: "text-rose-500" },
    { label: "Students on Trial", value: trial.n, arrow: "arrow-down" as const, color: "text-rose-500" },
  ];

  return (
    <>
      <PageTitle title="Teacher Dashboard" />

      <TCard className="p-0">
        <div className="flex flex-wrap items-center gap-6 px-6 py-8 sm:px-10">
          <Avatar name={me.name} className="h-24 w-24 text-3xl" />
          <div>
            <p className="flex items-center gap-2 font-sans text-3xl font-extrabold text-navy">
              {me.name}
              <VerifiedSeal />
            </p>
            <p className="mt-2 flex items-center gap-2 text-lg text-slate-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <Icon name="user" className="h-3.5 w-3.5" />
              </span>
              Teacher
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-6 pb-8 sm:grid-cols-3 sm:px-10">
          {stats.map((s) => (
            <Link
              key={s.label}
              href="/teacher/students"
              className="rounded-2xl border border-dashed border-slate-300 px-5 py-5 transition hover:border-green-400 hover:bg-green-50/40"
            >
              <p className="flex items-center gap-2 text-3xl font-bold text-navy">
                <Icon name={s.arrow} className={`h-7 w-7 ${s.color}`} />
                {s.value}
              </p>
              <p className="mt-1 text-lg text-slate-400">{s.label}</p>
            </Link>
          ))}
        </div>
      </TCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <TCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-xl font-bold text-navy">Today&apos;s classes</h2>
            <Link href="/teacher/classes" className="text-sm font-semibold text-green-600 hover:underline">
              Open Daily Classes
            </Link>
          </div>
          {todayClasses.length === 0 ? (
            <p className="py-6 text-slate-400">No classes today.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todayClasses.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-5">
                    <span className="w-24 text-lg font-bold text-navy">{formatTime12(c.startsAt, tz)}</span>
                    <span className="font-semibold uppercase text-slate-700">{c.student}</span>
                  </div>
                  <div className="flex gap-2">
                    <Pill tone={c.isTrial ? "amber" : "green"}>{c.isTrial ? "Trial" : "Regular"}</Pill>
                    <StatusPill status={c.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TCard>

        <div className="space-y-6">
          <Link href="/teacher/reschedule" className="block">
            <TCard className="transition hover:border-green-300">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Waiting to reschedule</p>
              <p className="mt-2 text-4xl font-extrabold text-navy">{waiting.n}</p>
              <p className="mt-1 text-slate-500">leave or absence classes still within their 30 days</p>
            </TCard>
          </Link>
          <Link href="/teacher/reports" className="block">
            <TCard className="transition hover:border-green-300">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Reports still to submit ({month})</p>
              <p className="mt-2 text-4xl font-extrabold text-navy">{reportsDue}</p>
              <p className="mt-1 text-slate-500">of {assigned.length} students this month</p>
            </TCard>
          </Link>
        </div>
      </div>
    </>
  );
}
