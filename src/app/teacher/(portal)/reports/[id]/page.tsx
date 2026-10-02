import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ReportForm } from "@/components/teacher/report-form";
import { PageTitle, ReportPill, TCard } from "@/components/teacher/ui";
import { db, progressReports, students } from "@/db";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "Progress report" };

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
      <PageTitle title="Progress Report" crumb="Reports" actions={<ReportPill status={report.status} />} />
      <TCard>
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
      </TCard>
    </>
  );
}
