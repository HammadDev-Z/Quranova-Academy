import { and, asc, count, eq, gt, gte, inArray, lt, notInArray } from "drizzle-orm";
import Link from "next/link";
import { classSessions, courses, db, progressReports, students } from "@/db";
import { AttentionList, Block, KpiCard, MixBar, WeekChart, type AttentionItem, type WeekDay } from "@/components/teacher/dashboard";
import { Icon, VerifiedSeal } from "@/components/teacher/icons";
import { Avatar, Pill, StatusPill } from "@/components/teacher/ui";
import { addDays, dayKey, dayRange, formatTime12, safeZone, shiftOf, todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { MAX_RESCHEDULES, RECOVERY_STATUSES } from "@/lib/teacher/constants";

export const metadata = { title: "Teacher Dashboard" };

const GREETING = { Morning: "Good morning", Afternoon: "Good afternoon", Evening: "Good evening", Night: "Good evening" } as const;

const studentTone = { active: "green", trial: "amber", paused: "slate", completed: "blue", left: "red" } as const;

const weekdayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
/** "Mon" for a YYYY-MM-DD key. */
const weekdayOfKey = (key: string) => weekdayFmt.format(new Date(`${key}T12:00:00Z`));

/** "in 2h 15m", "in 40 min" or "now". */
function startsIn(startsAt: Date, now: Date) {
  const mins = Math.round((startsAt.getTime() - now.getTime()) / 60000);
  if (mins <= 0) return "now";
  if (mins < 60) return `in ${mins} min`;
  if (mins < 24 * 60) return `in ${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `in ${Math.round(mins / (24 * 60))} days`;
}

export default async function TeacherDashboardPage() {
  const me = await requireTeacher();
  const tz = me.timezone;
  const now = new Date();
  const today = todayKey(tz);
  const [weekStart, weekEnd] = dayRange(today, addDays(today, 7), tz);
  const month = today.slice(0, 7);

  const mine = eq(students.teacherId, me.teacherId);
  const [statusRows, weekClasses, [waiting], [unmarked], assigned, submitted, roster] = await Promise.all([
    db.select({ status: students.status, n: count() }).from(students).where(mine).groupBy(students.status),
    db
      .select({ id: classSessions.id, startsAt: classSessions.startsAt, status: classSessions.status, isTrial: classSessions.isTrial, student: students.name })
      .from(classSessions)
      .innerJoin(students, eq(students.id, classSessions.studentId))
      .where(and(eq(classSessions.teacherId, me.teacherId), gte(classSessions.startsAt, weekStart), lt(classSessions.startsAt, weekEnd)))
      .orderBy(asc(classSessions.startsAt)),
    db
      .select({ n: count() })
      .from(classSessions)
      .where(
        and(
          eq(classSessions.teacherId, me.teacherId),
          inArray(classSessions.status, [...RECOVERY_STATUSES]),
          gt(classSessions.rescheduleDeadline, now),
          lt(classSessions.rescheduleCount, MAX_RESCHEDULES),
        ),
      ),
    // Classes that already happened but were never marked as completed or absent.
    db
      .select({ n: count() })
      .from(classSessions)
      .where(and(eq(classSessions.teacherId, me.teacherId), eq(classSessions.status, "scheduled"), lt(classSessions.startsAt, now))),
    db.select({ id: students.id }).from(students).where(and(mine, notInArray(students.status, ["left", "completed"]))),
    db
      .select({ studentId: progressReports.studentId })
      .from(progressReports)
      .where(and(eq(progressReports.teacherId, me.teacherId), eq(progressReports.month, month), notInArray(progressReports.status, ["draft"]))),
    db
      .select({ id: students.id, name: students.name, status: students.status, part: students.basicPart, course: courses.title })
      .from(students)
      .leftJoin(courses, eq(courses.id, students.courseId))
      .where(and(mine, notInArray(students.status, ["left", "completed"])))
      .orderBy(asc(students.name))
      .limit(6),
  ]);

  const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, r.n])) as Record<string, number>;
  const todayClasses = weekClasses.filter((c) => dayKey(c.startsAt, tz) === today);
  const doneToday = todayClasses.filter((c) => c.status === "completed").length;
  const toGoToday = todayClasses.filter((c) => c.status === "scheduled" && c.startsAt >= now).length;
  const nextClass = weekClasses.find((c) => c.status === "scheduled" && c.startsAt >= now);

  const submittedIds = new Set(submitted.map((r) => r.studentId));
  const reportsDue = assigned.filter((s) => !submittedIds.has(s.id)).length;

  const perDay = new Map<string, number>();
  for (const c of weekClasses) perDay.set(dayKey(c.startsAt, tz), (perDay.get(dayKey(c.startsAt, tz)) ?? 0) + 1);
  const week: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(today, i);
    return { key, label: i === 0 ? "Today" : weekdayOfKey(key), count: perDay.get(key) ?? 0, today: i === 0 };
  });

  const attention: AttentionItem[] = [
    { href: "/teacher/classes", text: "past classes still to mark as completed or absent", one: "past class still to mark as completed or absent", count: unmarked.n, icon: "clock" },
    { href: "/teacher/reschedule", text: "classes waiting to be rescheduled", one: "class waiting to be rescheduled", count: waiting.n, icon: "swap" },
    { href: "/teacher/reports", text: `progress reports to submit for ${month}`, one: `progress report to submit for ${month}`, count: reportsDue, icon: "document" },
    { href: "/teacher/students", text: "students on a free trial", one: "student on a free trial", count: byStatus.trial ?? 0, icon: "user" },
  ];

  const dateLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: safeZone(tz) }).format(now);
  const firstName = me.name.split(" ")[0];
  const nextKey = nextClass ? dayKey(nextClass.startsAt, tz) : today;

  return (
    <div className="stagger space-y-6">
      {/* Greeting and the next thing to do */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy via-[#12404a] to-[#178a5c] p-6 text-white shadow-[0_24px_48px_-24px_rgba(15,27,61,0.6)] sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-green-300/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <Avatar name={me.name} className="h-14 w-14 text-lg ring-4 ring-white/25 sm:h-20 sm:w-20 sm:text-2xl" />
            <div>
              <p className="text-sm font-medium text-green-100">{dateLabel}</p>
              <h1 className="mt-1 flex items-center gap-2 font-sans text-2xl font-extrabold sm:text-3xl">
                {GREETING[shiftOf(now, tz)]}, {firstName}
                <VerifiedSeal className="h-6 w-6" />
              </h1>
              <p className="mt-1.5 text-green-50/90">
                {todayClasses.length === 0
                  ? "No classes today. A good day to write reports."
                  : `${todayClasses.length} class${todayClasses.length === 1 ? "" : "es"} today${toGoToday ? `, ${toGoToday} still to go` : ", all done"}.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/teacher/classes" className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-navy transition duration-200 hover:bg-green-50 active:scale-[0.97]">
              <Icon name="calendar" className="h-4 w-4 text-blue-500" /> Daily classes
            </Link>
            <Link href="/teacher/reports/new" className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 transition duration-200 hover:bg-white/25 active:scale-[0.97]">
              <Icon name="edit" className="h-4 w-4" /> Write a report
            </Link>
            <Link href="/teacher/reschedule" className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 transition duration-200 hover:bg-white/25 active:scale-[0.97]">
              <Icon name="swap" className="h-4 w-4" /> Reschedule
            </Link>
          </div>
        </div>

        <div className="relative mt-6 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur">
          {nextClass ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-green-200">Next class · {startsIn(nextClass.startsAt, now)}</p>
                <p className="mt-1 text-lg font-bold">
                  {nextClass.student}
                  <span className="ml-2 font-medium text-green-100">
                    {formatTime12(nextClass.startsAt, tz)}
                    {nextKey !== today && ` · ${weekdayOfKey(nextKey)}`}
                  </span>
                </p>
              </div>
              <Link href={`/teacher/classes/${nextClass.id}`} className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-navy transition duration-200 hover:bg-green-50 active:scale-[0.97]">
                Open lesson notes <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <p className="text-green-50">Nothing scheduled in the next 7 days.</p>
          )}
        </div>
      </section>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard href="/teacher/students" label="Active students" value={byStatus.active ?? 0} hint={`${byStatus.trial ?? 0} on trial`} icon="users" tone="green" />
        <KpiCard href="/teacher/classes" label="Classes today" value={todayClasses.length} hint={`${doneToday} done · ${toGoToday} to go`} icon="calendar" tone="blue" progress={todayClasses.length ? doneToday / todayClasses.length : 0} />
        <KpiCard href="/teacher/reschedule" label="To reschedule" value={waiting.n} hint="within their 30-day window" icon="swap" tone="pink" />
        <KpiCard href="/teacher/reports" label="Reports due" value={reportsDue} hint={`${assigned.length - reportsDue} of ${assigned.length} submitted for ${month}`} icon="document" tone="amber" progress={assigned.length ? (assigned.length - reportsDue) / assigned.length : 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Block title="Today's schedule" action={{ href: "/teacher/classes", label: "Daily classes" }}>
            {todayClasses.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-slate-400">No classes today.</p>
            ) : (
              <ol className="relative space-y-1 before:absolute before:bottom-3 before:left-[5.3rem] before:top-3 before:w-px before:bg-slate-100">
                {todayClasses.map((c) => (
                  <li key={c.id}>
                    <Link href={`/teacher/classes/${c.id}`} className="relative flex items-center gap-4 rounded-2xl px-2 py-3 transition hover:bg-slate-50">
                      <span className="w-[4.2rem] flex-none text-right text-sm font-bold text-navy">{formatTime12(c.startsAt, tz)}</span>
                      <span
                        className={`relative z-10 h-3 w-3 flex-none rounded-full ring-4 ring-white ${
                          c.status === "completed" ? "bg-green-500" : c.status === "scheduled" ? (c.startsAt < now ? "bg-amber-400" : "bg-blue-500") : "bg-rose-400"
                        }`}
                      />
                      <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{c.student}</span>
                      <span className="hidden gap-2 sm:flex">
                        <Pill tone={c.isTrial ? "amber" : "green"} className="!px-2.5 !py-1 !text-xs">
                          {c.isTrial ? "Trial" : "Regular"}
                        </Pill>
                        <StatusPill status={c.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Block>

          <Block title="My students" action={{ href: "/teacher/students", label: "View all" }}>
            {roster.length === 0 ? (
              <p className="py-4 text-slate-400">No students assigned yet.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {roster.map((s) => (
                  <li key={s.id}>
                    <Link href={`/teacher/students/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50">
                      <Avatar name={s.name} className="h-11 w-11 text-sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-slate-800">{s.name}</span>
                        <span className="block truncate text-xs text-slate-400">{[s.course, s.part].filter(Boolean).join(" · ") || "No course yet"}</span>
                      </span>
                      <Pill tone={studentTone[s.status]} className="!px-2 !py-0.5 !text-[11px]">
                        {s.status[0].toUpperCase() + s.status.slice(1)}
                      </Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Block>
        </div>

        <div className="min-w-0 space-y-6">
          <Block title="Needs your attention">
            <AttentionList items={attention} />
          </Block>
          <Block title="Next 7 days">
            <WeekChart days={week} />
          </Block>
          <Block title="Students by status">
            <MixBar
              segments={[
                { label: "Active", value: byStatus.active ?? 0, color: "bg-green-500" },
                { label: "Trial", value: byStatus.trial ?? 0, color: "bg-amber-400" },
                { label: "Paused", value: byStatus.paused ?? 0, color: "bg-slate-400" },
                { label: "Completed", value: byStatus.completed ?? 0, color: "bg-blue-500" },
                { label: "Left", value: byStatus.left ?? 0, color: "bg-rose-400" },
              ]}
            />
          </Block>
        </div>
      </div>
    </div>
  );
}
