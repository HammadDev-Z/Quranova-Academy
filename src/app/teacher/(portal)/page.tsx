import { and, asc, count, eq, gte, lt } from "drizzle-orm";
import Link from "next/link";
import { Badge, Panel, StatCard } from "@/components/admin/ui";
import { classSessions, db, students } from "@/db";
import { addDays, dayRange, formatTimeOnly, todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

export const metadata = { title: "Dashboard" };

export default async function TeacherDashboardPage() {
  const me = await requireTeacher();
  const { adminTimezone: tz } = await getRawSettings();
  const today = todayKey(tz);
  const [dayStart, dayEnd] = dayRange(today, addDays(today, 1), tz);

  const [[active], [trial], [left], todayClasses] = await Promise.all([
    db.select({ n: count() }).from(students).where(and(eq(students.teacherId, me.teacherId), eq(students.status, "active"))),
    db.select({ n: count() }).from(students).where(and(eq(students.teacherId, me.teacherId), eq(students.status, "trial"))),
    db.select({ n: count() }).from(students).where(and(eq(students.teacherId, me.teacherId), eq(students.status, "left"))),
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
  ]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-800 sm:text-3xl">Assalamu alaikum, {me.name.split(" ")[0]}</h1>
        <p className="mt-1 text-muted">Here is your day at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Active students" value={active.n} href="/teacher/students" />
        <StatCard label="On trial" value={trial.n} href="/teacher/students" />
        <StatCard label="Left" value={left.n} href="/teacher/students" />
      </div>

      <Panel
        title="Today's classes"
        className="mt-6"
        actions={
          <Link href="/teacher/classes" className="text-sm font-semibold text-brand-600 hover:underline">
            Full schedule
          </Link>
        }
      >
        {todayClasses.length === 0 ? (
          <p className="text-sm text-muted">No classes today.</p>
        ) : (
          <ul className="divide-y divide-brand-100">
            {todayClasses.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <span className="font-serif text-lg font-bold text-brand-700">{formatTimeOnly(c.startsAt, tz)}</span>
                  <span className="font-medium text-brand-800">{c.student}</span>
                </div>
                <div className="flex gap-2">
                  {c.isTrial && <Badge value="trial" />}
                  <Badge value={c.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
