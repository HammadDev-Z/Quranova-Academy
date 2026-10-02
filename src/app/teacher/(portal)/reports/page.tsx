import { and, asc, eq, gte, lt, ne, notInArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import Link from "next/link";
import { classSessions, courses, db, progressReports, students } from "@/db";
import { Icon } from "@/components/teacher/icons";
import { PageTitle, ReportPill, TCard, btnGreen } from "@/components/teacher/ui";
import { fromLocalInput, todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "Monthly Student Reports" };

type Props = { searchParams: Promise<{ month?: string; saved?: string }> };

function nextMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export default async function ReportsPage({ searchParams }: Props) {
  const me = await requireTeacher();
  const sp = await searchParams;
  const tz = me.timezone;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "") ? sp.month! : todayKey(tz).slice(0, 7);

  const from = fromLocalInput(`${month}-01T00:00`, tz)!;
  const to = fromLocalInput(`${nextMonth(month)}-01T00:00`, tz)!;
  const additional = alias(courses, "additional_course");

  const [roster, classRows, reportRows] = await Promise.all([
    db
      .select({
        id: students.id,
        name: students.name,
        basicPart: students.basicPart,
        basicPage: students.basicPage,
        tajweedStep: students.tajweedStep,
        additionalPart: students.additionalPart,
        additionalPage: students.additionalPage,
        basicCourse: courses.title,
        additionalCourse: additional.title,
      })
      .from(students)
      .leftJoin(courses, eq(courses.id, students.courseId))
      .leftJoin(additional, eq(additional.id, students.additionalCourseId))
      .where(and(eq(students.teacherId, me.teacherId), notInArray(students.status, ["left"])))
      .orderBy(asc(students.name)),
    db
      .select({ studentId: classSessions.studentId, status: classSessions.status })
      .from(classSessions)
      .where(and(eq(classSessions.teacherId, me.teacherId), gte(classSessions.startsAt, from), lt(classSessions.startsAt, to), ne(classSessions.status, "cancelled"))),
    db
      .select({ id: progressReports.id, studentId: progressReports.studentId, status: progressReports.status })
      .from(progressReports)
      .where(and(eq(progressReports.teacherId, me.teacherId), eq(progressReports.month, month))),
  ]);

  const scheduled = new Map<string, number>();
  const taken = new Map<string, number>();
  for (const c of classRows) {
    scheduled.set(c.studentId, (scheduled.get(c.studentId) ?? 0) + 1);
    if (c.status === "completed") taken.set(c.studentId, (taken.get(c.studentId) ?? 0) + 1);
  }
  const reportOf = new Map(reportRows.map((r) => [r.studentId, r]));

  return (
    <>
      <PageTitle title="Monthly Student Reports" crumb="" subtitle="Complete the report for each student, then submit it to the admin for verification." />

      {sp.saved && <p role="status" className="mb-5 rounded-2xl bg-green-50 px-5 py-3 font-medium text-green-700">Report saved.</p>}

      <TCard className="mb-6">
        <form action="/teacher/reports" className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="month" className="mb-2 block text-lg font-bold text-navy">Report Month</label>
            <input
              id="month"
              name="month"
              type="month"
              defaultValue={month}
              className="w-72 max-w-full rounded-2xl border border-transparent bg-slate-100/80 px-5 py-3.5 text-lg text-slate-800 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <button type="submit" className={btnGreen + " px-8 py-3.5 text-lg"}>
            Show Reports
          </button>
        </form>
      </TCard>

      <TCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-6 py-5">Student</th>
                <th scope="col" className="px-3 py-5 text-center">Scheduled</th>
                <th scope="col" className="px-3 py-5 text-center">Taken</th>
                <th scope="col" className="px-3 py-5">Basic course</th>
                <th scope="col" className="px-3 py-5">Additional course</th>
                <th scope="col" className="px-6 py-5 text-right">Report</th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-400">No students are assigned to you yet.</td>
                </tr>
              )}
              {roster.map((s) => {
                const rep = reportOf.get(s.id);
                const href = rep ? `/teacher/reports/${rep.id}` : `/teacher/reports/new?studentId=${s.id}&month=${month}`;
                return (
                  <tr key={s.id} className="border-t border-slate-100 align-middle">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600" aria-hidden>
                          {s.name[0]?.toUpperCase()}
                        </span>
                        <Link href={`/teacher/students/${s.id}`} className="font-sans text-lg font-bold text-navy hover:underline">
                          {s.name}
                        </Link>
                        <Link href={`/teacher/students/${s.id}#history`} title="Class history" aria-label={`${s.name} class history`} className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200">
                          <Icon name="clock" className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-5 text-center">
                      <span className="inline-flex h-10 min-w-12 items-center justify-center rounded-xl bg-slate-100 px-3 text-lg font-bold text-slate-600">{scheduled.get(s.id) ?? 0}</span>
                    </td>
                    <td className="px-3 py-5 text-center">
                      <span className="inline-flex h-10 min-w-12 items-center justify-center rounded-xl bg-green-100 px-3 text-lg font-bold text-green-600">{taken.get(s.id) ?? 0}</span>
                    </td>
                    <td className="px-3 py-5">
                      {s.basicCourse ? (
                        <>
                          <p className="font-semibold text-blue-600">{s.basicCourse}</p>
                          <p className="text-slate-600">
                            {[s.basicPart, s.basicPage > 0 ? `Page ${s.basicPage}` : null].filter(Boolean).join(" · ") || "No progress set"}
                          </p>
                          {s.tajweedStep > 0 && <p className="text-sm text-slate-400">Tajweed Step: {s.tajweedStep}</p>}
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-5">
                      {s.additionalCourse ? (
                        <>
                          <p className="font-semibold text-purple-600">{s.additionalCourse}</p>
                          <p className="text-slate-600">
                            {[s.additionalPart, s.additionalPage > 0 ? `Page ${s.additionalPage}` : null].filter(Boolean).join(" · ") || "No progress set"}
                          </p>
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-3">
                        <ReportPill status={rep?.status ?? null} />
                        <Link href={href} title={rep ? "Open report" : "Write report"} aria-label={`${rep ? "Open" : "Write"} report for ${s.name}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition hover:bg-violet-200">
                          <Icon name={rep ? "notes" : "edit"} className="h-5 w-5" />
                        </Link>
                      </div>
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
