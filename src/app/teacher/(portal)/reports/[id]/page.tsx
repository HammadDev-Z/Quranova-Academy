import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ReportForm } from "@/components/teacher/report-form";
import { db, progressReports, students } from "@/db";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "Edit report" };

export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireTeacher();
  const { id } = await params;

  const [report] = await db.select().from(progressReports).where(eq(progressReports.id, id)).limit(1);
  if (!report || report.teacherId !== me.teacherId) notFound();

  const roster = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(eq(students.teacherId, me.teacherId))
    .orderBy(asc(students.name));

  return (
    <>
      <AdminPageHeader title="Edit progress report" back={{ href: "/teacher/reports", label: "Progress reports" }} />
      <Panel>
        <ReportForm
          reportId={id}
          students={roster}
          locked={report.status === "reviewed"}
          defaults={{
            studentId: report.studentId,
            month: report.month,
            covered: report.covered,
            strengths: report.strengths,
            improvements: report.improvements,
            rating: report.rating ? String(report.rating) : "",
          }}
        />
      </Panel>
    </>
  );
}
