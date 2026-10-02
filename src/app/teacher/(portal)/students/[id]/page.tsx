import { and, asc, desc, eq, gte } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { classSessions, courses, db, guardians, progressReports, students } from "@/db";
import { ProgressForm } from "@/components/teacher/forms";
import { Avatar, PageTitle, Pill, ReportPill, StatusPill, TCard, btnGreen } from "@/components/teacher/ui";
import { formatDateShort, formatTime12 } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Student" };

export default async function StudentDetailPage({ params }: Props) {
  const me = await requireTeacher();
  const { id } = await params;
  const tz = me.timezone;
  const additional = alias(courses, "additional_course");

  const [s] = await db
    .select({
      id: students.id,
      name: students.name,
      studentNo: students.studentNo,
      age: students.age,
      status: students.status,
      country: students.country,
      timezone: students.timezone,
      notes: students.notes,
      basicPart: students.basicPart,
      basicPage: students.basicPage,
      tajweedStep: students.tajweedStep,
      additionalPart: students.additionalPart,
      additionalPage: students.additionalPage,
      parent: guardians.name,
      parentPhone: guardians.phone,
      basicCourse: courses.title,
      additionalCourse: additional.title,
    })
    .from(students)
    .leftJoin(courses, eq(courses.id, students.courseId))
    .leftJoin(additional, eq(additional.id, students.additionalCourseId))
    .leftJoin(guardians, eq(guardians.id, students.guardianId))
    .where(and(eq(students.id, id), eq(students.teacherId, me.teacherId)))
    .limit(1);
  if (!s) notFound();

  const [upcoming, past, reports] = await Promise.all([
    db
      .select()
      .from(classSessions)
      .where(and(eq(classSessions.studentId, id), eq(classSessions.teacherId, me.teacherId), eq(classSessions.status, "scheduled"), gte(classSessions.startsAt, new Date())))
      .orderBy(asc(classSessions.startsAt))
      .limit(8),
    db
      .select()
      .from(classSessions)
      .where(and(eq(classSessions.studentId, id), eq(classSessions.teacherId, me.teacherId)))
      .orderBy(desc(classSessions.startsAt))
      .limit(12),
    db.select().from(progressReports).where(and(eq(progressReports.studentId, id), eq(progressReports.teacherId, me.teacherId))).orderBy(desc(progressReports.month)).limit(8),
  ]);

  const withNotes = past.filter((c) => c.status === "completed");

  return (
    <>
      <PageTitle title={s.name} crumb="Student List" actions={<Link href={`/teacher/reports/new?studentId=${id}`} className={btnGreen}>Write a report</Link>} />

      <TCard className="mb-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={s.name} className="h-16 w-16 text-xl" />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-xl font-extrabold uppercase text-navy">
              {s.name}
              {s.studentNo > 0 && <span className="font-semibold"> (ID:{s.studentNo})</span>}
            </p>
            <p className="mt-1 text-slate-500">
              {[s.parent, s.age ? `${s.age} years old` : null, s.country, s.timezone].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Pill tone={s.status === "active" ? "green" : s.status === "trial" ? "amber" : "slate"}>{s.status}</Pill>
        </div>
        {s.notes && <p className="mt-5 whitespace-pre-line rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600">{s.notes}</p>}
      </TCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <TCard className="scroll-mt-6 lg:col-span-2">
          <h2 id="progress" className="mb-5 scroll-mt-6 font-sans text-xl font-bold text-navy">Course progress</h2>
          <ProgressForm
            studentId={s.id}
            basicTitle={s.basicCourse ?? "Basic course (set one in the admin portal)"}
            additionalTitle={s.additionalCourse ?? "Additional course (set one in the admin portal)"}
            values={{ basicPart: s.basicPart, basicPage: s.basicPage, tajweedStep: s.tajweedStep, additionalPart: s.additionalPart, additionalPage: s.additionalPage }}
          />
        </TCard>

        <TCard>
          <h2 id="schedule" className="mb-4 scroll-mt-6 font-sans text-xl font-bold text-navy">Upcoming schedule</h2>
          {upcoming.length === 0 ? (
            <p className="text-slate-400">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/teacher/classes/${c.id}`} className="font-semibold text-navy hover:underline">
                    {formatDateShort(c.startsAt, tz)} · {formatTime12(c.startsAt, tz)}
                  </Link>
                  <Pill tone={c.isTrial ? "amber" : "green"}>{c.isTrial ? "Trial" : "Regular"}</Pill>
                </li>
              ))}
            </ul>
          )}
        </TCard>

        <TCard>
          <h2 id="history" className="mb-4 scroll-mt-6 font-sans text-xl font-bold text-navy">Class history</h2>
          {past.length === 0 ? (
            <p className="text-slate-400">No classes yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {past.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/teacher/classes/${c.id}`} className="text-navy hover:underline">
                    {formatDateShort(c.startsAt, tz)} · {formatTime12(c.startsAt, tz)}
                  </Link>
                  <StatusPill status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </TCard>

        <TCard>
          <h2 id="notes" className="mb-4 scroll-mt-6 font-sans text-xl font-bold text-navy">Lesson notes</h2>
          {withNotes.length === 0 ? (
            <p className="text-slate-400">Notes appear here once classes are completed.</p>
          ) : (
            <ul className="space-y-3">
              {withNotes.map((c) => (
                <li key={c.id}>
                  <Link href={`/teacher/classes/${c.id}`} className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-green-400">
                    <span className="flex items-center justify-between text-sm font-semibold text-navy">
                      {formatDateShort(c.startsAt, tz)}
                      {!c.lessonNotes && <span className="rounded-lg bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">Add notes</span>}
                    </span>
                    {c.lessonNotes && <span className="mt-1 line-clamp-2 block text-sm text-slate-500">{c.lessonNotes}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TCard>

        <TCard>
          <h2 id="reports" className="mb-4 scroll-mt-6 font-sans text-xl font-bold text-navy">Progress reports</h2>
          {reports.length === 0 ? (
            <p className="text-slate-400">No reports yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {reports.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/teacher/reports/${r.id}`} className="font-semibold text-navy hover:underline">
                    {r.month}
                  </Link>
                  <ReportPill status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </TCard>
      </div>
    </>
  );
}
