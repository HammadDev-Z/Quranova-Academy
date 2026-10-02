import { and, asc, eq, gt, lt } from "drizzle-orm";
import { AdminPageHeader, Badge, EmptyState, Panel } from "@/components/admin/ui";
import { RescheduleForm } from "@/components/teacher/reschedule-form";
import { classSessions, db, students } from "@/db";
import { formatDateOnly, formatDateTime } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";
import { MAX_RESCHEDULES } from "@/lib/teacher/constants";

export const metadata = { title: "Reschedules" };

export default async function TeacherReschedulePage() {
  const me = await requireTeacher();
  const { adminTimezone: tz } = await getRawSettings();

  const rows = await db
    .select({
      id: classSessions.id,
      startsAt: classSessions.startsAt,
      status: classSessions.status,
      rescheduleCount: classSessions.rescheduleCount,
      rescheduleDeadline: classSessions.rescheduleDeadline,
      student: students.name,
    })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .where(
      and(
        eq(classSessions.teacherId, me.teacherId),
        gt(classSessions.rescheduleDeadline, new Date()),
        lt(classSessions.rescheduleCount, MAX_RESCHEDULES),
      ),
    )
    .orderBy(asc(classSessions.rescheduleDeadline));

  return (
    <>
      <AdminPageHeader
        title="Reschedules available"
        description={`A class marked as a leave can be rescheduled up to ${MAX_RESCHEDULES} times, within 30 days of the original date.`}
      />
      {rows.length === 0 ? (
        <EmptyState title="Nothing to reschedule right now">
          Mark a class as a leave from <strong>My classes</strong> and it will appear here.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Panel key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-brand-800">{r.student}</p>
                  <p className="text-sm text-muted">
                    Originally {formatDateTime(r.startsAt, tz)} · <Badge value={r.status} />
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {r.rescheduleCount}/{MAX_RESCHEDULES} used · eligible until {r.rescheduleDeadline ? formatDateOnly(r.rescheduleDeadline.toISOString().slice(0, 10)) : "—"}
                  </p>
                </div>
                <RescheduleForm classId={r.id} />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
