import { and, asc, desc, eq, gt, inArray, lt } from "drizzle-orm";
import Link from "next/link";
import { classSessions, courses, db, students } from "@/db";
import { Icon } from "@/components/teacher/icons";
import { PageTitle, Pill, StatusPill, TCard, btnGreen, btnYellow } from "@/components/teacher/ui";
import { formatTime12, shiftOf } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { MAX_RESCHEDULES, RECOVERY_STATUSES } from "@/lib/teacher/constants";

export const metadata = { title: "Reschedules" };

type Props = { searchParams: Promise<{ q?: string; sort?: string; done?: string }> };

export default async function ReschedulesPage({ searchParams }: Props) {
  const me = await requireTeacher();
  const sp = await searchParams;
  const tz = me.timezone;
  const q = (sp.q ?? "").trim().toLowerCase().slice(0, 100);
  const descending = sp.sort === "desc";

  const rows = await db
    .select({
      id: classSessions.id,
      startsAt: classSessions.startsAt,
      status: classSessions.status,
      isTrial: classSessions.isTrial,
      rescheduleCount: classSessions.rescheduleCount,
      student: students.name,
      course: courses.title,
    })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .leftJoin(courses, eq(courses.id, classSessions.courseId))
    .where(
      and(
        eq(classSessions.teacherId, me.teacherId),
        inArray(classSessions.status, [...RECOVERY_STATUSES]),
        gt(classSessions.rescheduleDeadline, new Date()),
        lt(classSessions.rescheduleCount, MAX_RESCHEDULES),
      ),
    )
    .orderBy(descending ? desc(students.name) : asc(students.name), asc(classSessions.startsAt));

  const shown = q ? rows.filter((r) => r.student.toLowerCase().includes(q)) : rows;
  const dateOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

  return (
    <>
      <PageTitle
        title="Reschedule Available"
        upper
        actions={
          <Link href="/teacher/reschedule/advance" className={btnGreen + " py-3.5"}>
            Advance Reschedule
          </Link>
        }
      />

      {sp.done && (
        <p role="status" className="mb-5 rounded-2xl bg-green-50 px-5 py-3 font-medium text-green-700">
          Class rescheduled.
        </p>
      )}

      <TCard>
        <form action="/teacher/reschedule" className="relative mb-6 max-w-sm">
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search Students"
            aria-label="Search students"
            className="w-full rounded-2xl border border-transparent bg-slate-100/80 py-3.5 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </form>

        <div className="mb-7">
          <p className="font-sans text-lg font-bold text-navy">Multiple recovery classes are supported</p>
          <p className="mt-1 max-w-5xl text-slate-500">
            Absent, student-leave and teacher-leave classes stay open for 30 days and can be rescheduled up to {MAX_RESCHEDULES} times. Every recovery needs a
            valid date and time. The time picker shows every slot and explains why a protected slot cannot be chosen.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="stack-table w-full min-w-[980px] text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-3 py-4">
                  <Link
                    href={`/teacher/reschedule?sort=${descending ? "asc" : "desc"}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                    className="inline-flex items-center gap-1.5 hover:text-navy"
                  >
                    Student name <Icon name={descending ? "arrow-down" : "arrow-up"} className="h-3.5 w-3.5" />
                  </Link>
                </th>
                <th scope="col" className="px-3 py-4">Shift</th>
                <th scope="col" className="px-3 py-4">Date</th>
                <th scope="col" className="px-3 py-4">Time</th>
                <th scope="col" className="px-3 py-4">Course</th>
                <th scope="col" className="px-3 py-4">Type</th>
                <th scope="col" className="px-3 py-4">Status</th>
                <th scope="col" className="px-3 py-4">Re status</th>
                <th scope="col" className="px-3 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-14 text-center text-slate-400">
                    {q ? "No students match." : "No classes are waiting to be rescheduled. Classes marked as leave or absent appear here."}
                  </td>
                </tr>
              )}
              {shown.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 align-middle">
                  <td data-primary className="relative min-w-[11rem] px-3 py-5 pl-5">
                    <span className="absolute inset-y-4 left-0 w-1 rounded-full bg-blue-500" aria-hidden />
                    <span className="font-sans text-lg font-semibold uppercase text-navy">{r.student}</span>
                  </td>
                  <td data-label="Shift" className="px-3 py-5">
                    <span className="inline-block rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white">{shiftOf(r.startsAt, tz)}</span>
                  </td>
                  <td data-label="Date" className="whitespace-nowrap px-3 py-5 text-lg text-slate-600">{dateOf(r.startsAt)}</td>
                  <td data-label="Time" className="px-3 py-5">
                    <span className="inline-block whitespace-nowrap rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white">{formatTime12(r.startsAt, tz)}</span>
                  </td>
                  <td data-label="Course" className="px-3 py-5">
                    <span className="inline-block whitespace-nowrap rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{r.course ?? "—"}</span>
                  </td>
                  <td data-label="Type" className="px-3 py-5">
                    <Pill tone={r.isTrial ? "amber" : "blue"}>{r.isTrial ? "Trial" : "Regular"}</Pill>
                  </td>
                  <td data-label="Status" className="px-3 py-5">
                    <StatusPill status={r.status} />
                  </td>
                  <td data-label="Re status" className="px-3 py-5">
                    <span className="inline-block whitespace-nowrap rounded-xl bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-600">
                      Re {r.rescheduleCount}/{MAX_RESCHEDULES}
                    </span>
                  </td>
                  <td data-wide className="px-3 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/teacher/reschedule/${r.id}`} className={btnYellow}>
                        <Icon name="calendar-clock" className="h-5 w-5" /> Reschedule
                      </Link>
                      <Link
                        href={`/teacher/classes/${r.id}`}
                        title="Class details"
                        aria-label={`Details for ${r.student} class`}
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 hover:bg-green-200"
                      >
                        <Icon name="calendar" className="h-5 w-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TCard>
    </>
  );
}
