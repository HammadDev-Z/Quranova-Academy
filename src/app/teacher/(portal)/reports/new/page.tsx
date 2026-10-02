import { asc, eq } from "drizzle-orm";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ReportForm } from "@/components/teacher/report-form";
import { db, students } from "@/db";
import { requireTeacher } from "@/lib/auth/session";
import { todayKey } from "@/lib/admin/time";
import { getRawSettings } from "@/lib/settings";

export const metadata = { title: "New report" };

export default async function NewReportPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  const me = await requireTeacher();
  const { studentId } = await searchParams;
  const { adminTimezone: tz } = await getRawSettings();

  const roster = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(eq(students.teacherId, me.teacherId))
    .orderBy(asc(students.name));

  return (
    <>
      <AdminPageHeader title="Write a progress report" back={{ href: "/teacher/reports", label: "Progress reports" }} />
      <Panel>
        <ReportForm
          reportId="new"
          students={roster}
          locked={false}
          defaults={{ studentId: studentId ?? "", month: todayKey(tz).slice(0, 7) }}
        />
      </Panel>
    </>
  );
}
