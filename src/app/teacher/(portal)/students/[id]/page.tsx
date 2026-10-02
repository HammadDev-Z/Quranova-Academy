import { and, asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, Badge, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui";
import { classSessions, courses, db, guardians, progressReports, students } from "@/db";
import { formatDateTime } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const [s] = await db.select({ name: students.name }).from(students).where(eq(students.id, id)).limit(1);
  return { title: s?.name ?? "Student" };
}

export default async function TeacherStudentPage({ params }: Props) {
  const me = await requireTeacher();
  const { id } = await params;
  const { adminTimezone: tz } = await getRawSettings();

  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      age: students.age,
      status: students.status,
      country: students.country,
      notes: students.notes,
      course: courses.title,
      guardianId: guardians.id,
      guardianName: guardians.name,
      guardianEmail: guardians.email,
      guardianPhone: guardians.phone,
    })
    .from(students)
    .leftJoin(courses, eq(courses.id, students.courseId))
    .leftJoin(guardians, eq(guardians.id, students.guardianId))
    .where(and(eq(students.id, id), eq(students.teacherId, me.teacherId)))
    .limit(1);

  if (!student) notFound();

  const [upcoming, past, reports] = await Promise.all([
    db
      .select()
      .from(classSessions)
      .where(and(eq(classSessions.studentId, id), eq(classSessions.status, "scheduled")))
      .orderBy(asc(classSessions.startsAt))
      .limit(10),
    db
      .select()
      .from(classSessions)
      .where(and(eq(classSessions.studentId, id)))
      .orderBy(desc(classSessions.startsAt))
      .limit(10),
    db.select().from(progressReports).where(eq(progressReports.studentId, id)).orderBy(desc(progressReports.month)).limit(6),
  ]);

  return (
    <>
      <AdminPageHeader
        title={student.name}
        description={[student.course, student.age ? `${student.age} years old` : null, student.country].filter(Boolean).join(" · ")}
        back={{ href: "/teacher/students", label: "My students" }}
        actions={
          <Button href={`/teacher/reports/new?studentId=${id}`} variant="primary">
            Write a report
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel title="Upcoming classes">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">None scheduled.</p>
            ) : (
              <ul className="divide-y divide-brand-100">
                {upcoming.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <span className="font-medium text-brand-800">{formatDateTime(c.startsAt, tz)}</span>
                    {c.isTrial && <Badge value="trial" />}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent classes">
            {past.length === 0 ? (
              <p className="text-sm text-muted">No class history yet.</p>
            ) : (
              <ul className="divide-y divide-brand-100">
                {past.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <span className="text-brand-800">{formatDateTime(c.startsAt, tz)}</span>
                    <Badge value={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {student.notes && (
            <Panel title="Notes from admin">
              <p className="whitespace-pre-line text-sm text-ink">{student.notes}</p>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          {student.guardianName && (
            <Panel title="Parent / guardian">
              <p className="font-semibold text-brand-800">{student.guardianName}</p>
              <p className="mt-1 text-sm text-muted">{[student.guardianPhone, student.guardianEmail].filter(Boolean).join(" · ")}</p>
            </Panel>
          )}
          <Panel title="Progress reports">
            {reports.length === 0 ? (
              <p className="text-sm text-muted">No reports yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {reports.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <Link href={`/teacher/reports/${r.id}`} className="font-medium text-brand-700 hover:underline">
                      {r.month}
                    </Link>
                    <Badge value={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
