import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChildAvatar, ClassStatusChip, Hero, SCard, SubHeader } from "@/components/student/ui";
import { certificates, db, progressReports, students } from "@/db";
import { formatDateOnly } from "@/lib/admin/time";
import { formatDayList, formatTimePadded, monthOf } from "@/lib/admin/time-family";
import { requireParent } from "@/lib/auth/session";
import { getClassRows, monthRange } from "@/lib/student/data";
import { familyScope } from "@/lib/student/scope";

export const metadata = { title: "Class history" };

function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const monthName = (month: string) => new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function StudentHistoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> }) {
  const parent = await requireParent();
  const { id } = await params;
  const sp = await searchParams;
  const tz = parent.timezone;

  // Only the family's own children can be opened.
  const [child] = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(and(eq(students.id, id), familyScope(parent)))
    .limit(1);
  if (!child) notFound();

  const thisMonth = monthOf(new Date(), tz);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "") ? sp.month! : thisMonth;
  const [from, to] = monthRange(month, tz);

  const [allRows, reports, certs] = await Promise.all([
    getClassRows(parent, from, to),
    db
      .select()
      .from(progressReports)
      .where(and(eq(progressReports.studentId, id), eq(progressReports.status, "reviewed")))
      .orderBy(desc(progressReports.month)),
    db.select().from(certificates).where(eq(certificates.studentId, id)).orderBy(desc(certificates.issuedOn)),
  ]);
  const rows = allRows.filter((r) => r.studentId === id && r.status !== "cancelled");
  const count = (s: string[]) => rows.filter((r) => s.includes(r.status)).length;
  const stats = [
    { label: "Completed", value: count(["completed"]) },
    { label: "Scheduled", value: count(["scheduled"]) },
    { label: "On leave", value: count(["student_leave", "teacher_leave"]) },
    { label: "Absent", value: count(["missed_student", "missed_teacher"]) },
  ];

  return (
    <>
      <SubHeader eyebrow="Class history" title={child.name} back="/student/students" />

      <Hero className="mb-5 px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <ChildAvatar name={child.name} className="h-16 w-16 text-xl" />
            <div>
              <p className="text-xs font-extrabold text-emerald-100">Attendance</p>
              <p className="font-sans text-2xl font-extrabold">{monthName(month)}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 px-3 py-2.5">
                <p className="font-sans text-2xl font-extrabold">{s.value}</p>
                <p className="text-[10px] font-bold text-emerald-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Hero>

      <div className="mb-5 flex items-center gap-2">
        <Link href={`/student/students/${id}?month=${shiftMonth(month, -1)}`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-emerald-800 shadow-sm hover:bg-emerald-50">
          ← {monthName(shiftMonth(month, -1))}
        </Link>
        {month !== thisMonth && (
          <Link href={`/student/students/${id}`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-emerald-800 shadow-sm hover:bg-emerald-50">
            This month
          </Link>
        )}
        <Link href={`/student/students/${id}?month=${shiftMonth(month, 1)}`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-emerald-800 shadow-sm hover:bg-emerald-50">
          {monthName(shiftMonth(month, 1))} →
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <SCard>
          <h2 className="mb-4 font-sans text-lg font-extrabold text-slate-900">Classes in {monthName(month)}</h2>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No classes this month.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {[...rows].reverse().map((c) => (
                <li key={c.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {formatDayList(c.startsAt, tz)} · {formatTimePadded(c.startsAt, tz)}
                      </p>
                      <p className="text-xs text-slate-500">{[c.teacherName && `with ${c.teacherName}`, c.courseTitle].filter(Boolean).join(" · ")}</p>
                    </div>
                    <ClassStatusChip status={c.status} />
                  </div>
                  {(c.lessonNotes || c.homework) && (
                    <details className="mt-2 rounded-2xl bg-emerald-50/60 px-4 py-2.5 text-sm">
                      <summary className="cursor-pointer font-extrabold text-emerald-800">Lesson notes and homework</summary>
                      {c.lessonNotes && (
                        <p className="mt-2 whitespace-pre-line text-slate-700">
                          <span className="font-bold">Covered: </span>
                          {c.lessonNotes}
                        </p>
                      )}
                      {c.homework && (
                        <p className="mt-2 whitespace-pre-line text-slate-700">
                          <span className="font-bold">Homework: </span>
                          {c.homework}
                        </p>
                      )}
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SCard>

        <div className="space-y-5">
          <SCard>
            <h2 className="mb-4 font-sans text-lg font-extrabold text-slate-900">Progress reports</h2>
            {reports.length === 0 ? (
              <p className="text-sm text-slate-400">Monthly reports appear here once your teacher&apos;s report has been checked by the academy.</p>
            ) : (
              <ul className="space-y-3">
                {reports.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                    <p className="flex items-center justify-between font-extrabold text-slate-900">
                      {monthName(r.month)}
                      {r.rating ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-700">{r.rating} / 5</span> : null}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-slate-700">{r.covered}</p>
                    {r.strengths && (
                      <p className="mt-2 whitespace-pre-line text-slate-600">
                        <span className="font-bold text-emerald-700">Strengths: </span>
                        {r.strengths}
                      </p>
                    )}
                    {r.improvements && (
                      <p className="mt-2 whitespace-pre-line text-slate-600">
                        <span className="font-bold text-amber-700">To improve: </span>
                        {r.improvements}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SCard>

          {certs.length > 0 && (
            <SCard>
              <h2 className="mb-4 font-sans text-lg font-extrabold text-slate-900">Certificates</h2>
              <ul className="space-y-2">
                {certs.map((c) => (
                  <li key={c.id}>
                    <Link href={`/student/certificates/${c.id}`} className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-800 hover:bg-amber-100">
                      {c.title}
                      <span className="text-xs font-semibold">{formatDateOnly(c.issuedOn)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SCard>
          )}
        </div>
      </div>
    </>
  );
}
