import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import Link from "next/link";
import { classReschedules, classSessions, courses, db, guardians, students } from "@/db";
import { Icon } from "@/components/teacher/icons";
import { PageTitle, Pill, StatusPill, TCard, btnGreen, btnSoft, btnYellow } from "@/components/teacher/ui";
import { addDays, dayKey, dayRange, formatDateShort, formatTime12, todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { MAX_RESCHEDULES, MIN_NOTICE_MINUTES, RECOVERY_STATUSES } from "@/lib/teacher/constants";
import { markClassStatus } from "@/lib/teacher/actions";

export const metadata = { title: "Daily Classes" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const DAY_COUNTS = [7, 14, 30];

export default async function DailyClassesPage({ searchParams }: Props) {
  const me = await requireTeacher();
  const sp = await searchParams;
  const tz = me.timezone;

  const today = todayKey(tz);
  const days = DAY_COUNTS.includes(Number(sp.days)) ? Number(sp.days) : 7;
  const [dayStart] = dayRange(today, addDays(today, 1), tz);
  const [pastFrom] = dayRange(addDays(today, -7), today, tz);
  const [, rangeEnd] = dayRange(today, addDays(today, days), tz);

  const rows = await db
    .select({
      id: classSessions.id,
      startsAt: classSessions.startsAt,
      status: classSessions.status,
      isTrial: classSessions.isTrial,
      rescheduleCount: classSessions.rescheduleCount,
      rescheduleDeadline: classSessions.rescheduleDeadline,
      studentId: students.id,
      studentName: students.name,
      studentNo: students.studentNo,
      studentTz: students.timezone,
      parent: guardians.name,
      course: courses.title,
    })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .leftJoin(guardians, eq(guardians.id, students.guardianId))
    .leftJoin(courses, eq(courses.id, classSessions.courseId))
    .where(and(eq(classSessions.teacherId, me.teacherId), gte(classSessions.startsAt, pastFrom), lt(classSessions.startsAt, rangeEnd)))
    .orderBy(asc(classSessions.startsAt));

  const swapped = rows.length
    ? new Set(
        (
          await db
            .select({ classId: classReschedules.classId })
            .from(classReschedules)
            .where(and(eq(classReschedules.kind, "swap"), inArray(classReschedules.classId, rows.map((r) => r.id))))
        ).map((r) => r.classId),
      )
    : new Set<string>();

  const needsMarking = rows.filter((r) => r.startsAt < dayStart && r.status === "scheduled");
  const upcoming = rows.filter((r) => r.startsAt >= dayStart);

  const groups = new Map<string, typeof rows>();
  for (const r of upcoming) {
    const k = dayKey(r.startsAt, tz);
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }

  const groupLabel = (key: string) => {
    const date = dayRange(key, addDays(key, 1), tz)[0];
    const prefix = key === today ? "Today" : key === addDays(today, 1) ? "Tomorrow" : new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short" }).format(date);
    return `${prefix} - ${formatDateShort(date, tz)}`;
  };

  type Row = (typeof rows)[number];
  const nowMs = new Date().getTime();

  const renderRow = (c: Row) => {
    const started = c.startsAt.getTime() <= nowMs;
    const isRecovery = (RECOVERY_STATUSES as readonly string[]).includes(c.status);
    const eligible = isRecovery && c.rescheduleCount < MAX_RESCHEDULES && (c.rescheduleDeadline ? c.rescheduleDeadline.getTime() > nowMs : true);
    const canMove = c.status === "scheduled" && c.startsAt.getTime() > nowMs + MIN_NOTICE_MINUTES * 60000;
    const studentLocal = c.studentTz && c.studentTz !== tz ? formatTime12(c.startsAt, c.studentTz) : null;

    return (
      <tr key={c.id} className="border-t border-slate-100 align-middle">
        <td data-primary className="relative min-w-[15rem] py-4 pl-5 pr-3">
          <span className="absolute inset-y-3 left-0 w-1 rounded-full bg-blue-500" aria-hidden />
          <Link href={`/teacher/students/${c.studentId}`} className="font-sans text-[15px] font-bold uppercase text-navy hover:underline">
            {c.studentName}
            {c.studentNo > 0 && <span className="font-semibold"> (ID:{c.studentNo})</span>}
          </Link>
          {c.parent && (
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-amber-800" aria-hidden>
                <Icon name="user" className="h-3 w-3" />
              </span>
              {c.parent}
            </p>
          )}
        </td>
        <td data-label="Time" className="whitespace-nowrap px-3 py-4 text-center">
          <Link href={`/teacher/classes/${c.id}`} className="tap text-lg font-bold text-navy hover:underline" title="Lesson notes">
            {formatTime12(c.startsAt, tz)}
          </Link>
          {studentLocal && <p className="text-xs text-slate-400">Student: {studentLocal}</p>}
        </td>
        <td data-label="Course" className="px-3 py-4 text-center">
          {c.course ? <span className="inline-block whitespace-nowrap rounded-xl bg-green-500 px-5 py-2.5 text-sm font-bold text-white">{c.course}</span> : <span className="text-slate-300">—</span>}
        </td>
        <td data-label="Swap" className="px-3 py-4">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-11 w-14 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-400">
              {swapped.has(c.id) ? "Swapped" : "—"}
            </span>
            {canMove ? (
              <Link
                href={`/teacher/classes/${c.id}/swap`}
                title="Swap with another class"
                aria-label={`Swap ${c.studentName}'s class with another class`}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600 transition hover:bg-green-200"
              >
                <Icon name="calendar-clock" className="h-5 w-5" />
              </Link>
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-300" aria-hidden>
                <Icon name="calendar-clock" className="h-5 w-5" />
              </span>
            )}
          </div>
        </td>
        <td data-label="Status" className="px-3 py-4">
          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
            <Pill tone={c.isTrial ? "amber" : "green"}>{c.isTrial ? "Trial" : "Regular"}</Pill>
            <StatusPill status={c.status} />
          </div>
        </td>
        <td data-wide className="py-4 pl-3 pr-5">
          <div className="flex items-center justify-end gap-2">
            {c.status === "scheduled" && (
              <>
                <form action={markClassStatus.bind(null, c.id, "student_leave")}>
                  <button type="submit" className={btnSoft}>
                    Student Leave
                  </button>
                </form>
                <details className="relative">
                  <summary
                    className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 [&::-webkit-details-marker]:hidden"
                    aria-label="More actions"
                  >
                    <Icon name="more" className="h-5 w-5" />
                  </summary>
                  <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {started && (
                      <form action={markClassStatus.bind(null, c.id, "completed")}>
                        <button type="submit" className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-green-700 hover:bg-green-50">
                          Mark as done
                        </button>
                      </form>
                    )}
                    <form action={markClassStatus.bind(null, c.id, "missed_student")}>
                      <button type="submit" className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">
                        Student absent
                      </button>
                    </form>
                    <form action={markClassStatus.bind(null, c.id, "teacher_leave")}>
                      <button type="submit" className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-purple-700 hover:bg-purple-50">
                        I need leave
                      </button>
                    </form>
                    <Link href={`/teacher/classes/${c.id}`} className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Lesson notes
                    </Link>
                  </div>
                </details>
              </>
            )}
            {isRecovery && eligible && (
              <Link href={`/teacher/reschedule/${c.id}`} className={btnYellow}>
                Reschedule
              </Link>
            )}
            {(c.status === "completed" || (isRecovery && !eligible)) && (
              <Link href={`/teacher/classes/${c.id}`} className="tap text-sm font-semibold text-green-600 hover:underline">
                {c.status === "completed" ? "Notes" : "Details"}
              </Link>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const groupHeader = (label: string, tone = "text-green-600") => (
    <tr key={`h-${label}`}>
      <td colSpan={6} className="bg-slate-50 px-5 py-3">
        <span className={`flex items-center gap-2 text-lg font-semibold ${tone}`}>
          <Icon name="calendar" className="h-5 w-5 text-slate-400" />
          {label}
        </span>
      </td>
    </tr>
  );

  return (
    <>
      <PageTitle
        title="Daily Classes"
        actions={
          <Link href="/teacher/classes" prefetch={false} className={btnGreen}>
            <Icon name="refresh" className="h-5 w-5" /> Refresh
          </Link>
        }
      />

      {sp.swapped && <p role="status" className="mb-5 rounded-2xl bg-green-50 px-5 py-3 font-medium text-green-700">Classes swapped.</p>}

      <TCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="stack-table w-full min-w-[1000px] text-left">
            <thead>
              <tr className="text-[15px] font-bold text-navy">
                <th scope="col" className="px-5 py-5">Student/Parent</th>
                <th scope="col" className="px-3 py-5 text-center">Time</th>
                <th scope="col" className="px-3 py-5 text-center">Course</th>
                <th scope="col" className="px-3 py-5 text-center">Swap</th>
                <th scope="col" className="px-3 py-5 text-center">Status</th>
                <th scope="col" className="px-5 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {needsMarking.length > 0 && (
                <>
                  {groupHeader("Earlier - needs marking", "text-rose-600")}
                  {needsMarking.map(renderRow)}
                </>
              )}
              {[...groups.entries()].map(([key, items]) => (
                <FragmentRows key={key} header={groupHeader(groupLabel(key))}>
                  {items.map(renderRow)}
                </FragmentRows>
              ))}
              {needsMarking.length === 0 && groups.size === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-slate-400">
                    No classes in the next {days} days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TCard>

      <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        Showing the next {days} days. Times are in your time zone ({tz}).
        {DAY_COUNTS.filter((d) => d !== days).map((d) => (
          <Link key={d} href={`/teacher/classes?days=${d}`} className="tap font-semibold text-green-600 hover:underline">
            Show {d} days
          </Link>
        ))}
      </p>
    </>
  );
}

function FragmentRows({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      {header}
      {children}
    </>
  );
}
