import { and, asc, eq, gte, lt } from "drizzle-orm";
import Link from "next/link";
import { classSessions, courses, db, students } from "@/db";
import { Icon } from "@/components/teacher/icons";
import { PageTitle, Pill, TCard, btnYellow } from "@/components/teacher/ui";
import { addDays, dayRange, formatDateShort, formatTime12, todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { MAX_RESCHEDULES, MIN_NOTICE_MINUTES } from "@/lib/teacher/constants";

export const metadata = { title: "Advance Reschedule" };

export default async function AdvanceReschedulePage() {
  const me = await requireTeacher();
  const tz = me.timezone;
  const soon = new Date(new Date().getTime() + MIN_NOTICE_MINUTES * 60000);
  const [, end] = dayRange(todayKey(tz), addDays(todayKey(tz), 30), tz);

  const rows = await db
    .select({
      id: classSessions.id,
      startsAt: classSessions.startsAt,
      isTrial: classSessions.isTrial,
      rescheduleCount: classSessions.rescheduleCount,
      student: students.name,
      course: courses.title,
    })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .leftJoin(courses, eq(courses.id, classSessions.courseId))
    .where(and(eq(classSessions.teacherId, me.teacherId), eq(classSessions.status, "scheduled"), gte(classSessions.startsAt, soon), lt(classSessions.startsAt, end)))
    .orderBy(asc(classSessions.startsAt));

  return (
    <>
      <PageTitle
        title="Advance Reschedule"
        crumb="Reschedules"
        subtitle={`Move an upcoming class to a better time before it happens. Each class can be moved ${MAX_RESCHEDULES} times. To swap two classes instead, use the swap button on Daily Classes.`}
      />
      <TCard>
        <div className="overflow-x-auto">
          <table className="stack-table w-full min-w-[720px] text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-3 py-4">Student name</th>
                <th scope="col" className="px-3 py-4">Date</th>
                <th scope="col" className="px-3 py-4">Time</th>
                <th scope="col" className="px-3 py-4">Course</th>
                <th scope="col" className="px-3 py-4">Type</th>
                <th scope="col" className="px-3 py-4">Re status</th>
                <th scope="col" className="px-3 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-14 text-center text-slate-400">
                    No upcoming classes in the next 30 days.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const left = MAX_RESCHEDULES - r.rescheduleCount;
                return (
                  <tr key={r.id} className="border-t border-slate-100 align-middle">
                    <td data-primary className="px-3 py-5 font-sans text-lg font-semibold uppercase text-navy">{r.student}</td>
                    <td data-label="Date" className="whitespace-nowrap px-3 py-5 text-slate-600">{formatDateShort(r.startsAt, tz)}</td>
                    <td data-label="Time" className="px-3 py-5">
                      <span className="inline-block whitespace-nowrap rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white">{formatTime12(r.startsAt, tz)}</span>
                    </td>
                    <td data-label="Course" className="px-3 py-5 text-slate-600">{r.course ?? "—"}</td>
                    <td data-label="Type" className="px-3 py-5">
                      <Pill tone={r.isTrial ? "amber" : "blue"}>{r.isTrial ? "Trial" : "Regular"}</Pill>
                    </td>
                    <td data-label="Re status" className="px-3 py-5">
                      <span className="inline-block rounded-xl bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-600">
                        Re {r.rescheduleCount}/{MAX_RESCHEDULES}
                      </span>
                    </td>
                    <td data-wide className="px-3 py-5 text-right">
                      {left > 0 ? (
                        <Link href={`/teacher/reschedule/${r.id}`} className={btnYellow}>
                          <Icon name="calendar-clock" className="h-5 w-5" /> Move
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">Limit reached</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TCard>
    </>
  );
}
