import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { classReschedules, classSessions, courses, db, guardians, students } from "@/db";
import { ClassNotesForm } from "@/components/teacher/forms";
import { PageTitle, Pill, StatusPill, TCard } from "@/components/teacher/ui";
import { formatDateShort, formatTime12 } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "Lesson notes" };

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireTeacher();
  const { id } = await params;
  const tz = me.timezone;

  const [cls] = await db
    .select({
      id: classSessions.id,
      startsAt: classSessions.startsAt,
      durationMin: classSessions.durationMin,
      status: classSessions.status,
      isTrial: classSessions.isTrial,
      meetingUrl: classSessions.meetingUrl,
      lessonNotes: classSessions.lessonNotes,
      homework: classSessions.homework,
      studentId: students.id,
      studentName: students.name,
      parent: guardians.name,
      course: courses.title,
    })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .leftJoin(guardians, eq(guardians.id, students.guardianId))
    .leftJoin(courses, eq(courses.id, classSessions.courseId))
    .where(and(eq(classSessions.id, id), eq(classSessions.teacherId, me.teacherId)))
    .limit(1);
  if (!cls) notFound();

  const history = await db.select().from(classReschedules).where(eq(classReschedules.classId, id)).orderBy(asc(classReschedules.createdAt));

  return (
    <>
      <PageTitle title="Lesson Notes" crumb="Daily Classes" />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <TCard>
          <ClassNotesForm classId={cls.id} lessonNotes={cls.lessonNotes} homework={cls.homework} />
        </TCard>

        <div className="space-y-6">
          <TCard>
            <p className="font-sans text-xl font-extrabold uppercase text-navy">{cls.studentName}</p>
            {cls.parent && <p className="mt-1 text-slate-500">{cls.parent}</p>}
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Date</dt>
                <dd className="font-semibold text-navy">{formatDateShort(cls.startsAt, tz)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Time</dt>
                <dd className="font-semibold text-navy">
                  {formatTime12(cls.startsAt, tz)} · {cls.durationMin} min
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Course</dt>
                <dd className="font-semibold text-navy">{cls.course ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">Status</dt>
                <dd className="flex gap-1.5">
                  <Pill tone={cls.isTrial ? "amber" : "green"}>{cls.isTrial ? "Trial" : "Regular"}</Pill>
                  <StatusPill status={cls.status} />
                </dd>
              </div>
            </dl>
            {cls.meetingUrl && (
              <a href={cls.meetingUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block font-semibold text-green-600 hover:underline">
                Open class link ↗
              </a>
            )}
            <Link href={`/teacher/students/${cls.studentId}`} className="tap mt-5 block text-sm font-semibold text-green-600 hover:underline">
              View student →
            </Link>
          </TCard>

          {history.length > 0 && (
            <TCard>
              <h2 className="mb-3 font-sans text-lg font-bold text-navy">Time changes</h2>
              <ul className="space-y-3 text-sm">
                {history.map((h) => (
                  <li key={h.id}>
                    <span className="font-semibold capitalize text-navy">{h.kind}</span>
                    <p className="text-slate-500">
                      {formatDateShort(h.oldStartsAt, tz)} {formatTime12(h.oldStartsAt, tz)} → {formatDateShort(h.newStartsAt, tz)} {formatTime12(h.newStartsAt, tz)}
                    </p>
                  </li>
                ))}
              </ul>
            </TCard>
          )}
        </div>
      </div>
    </>
  );
}
