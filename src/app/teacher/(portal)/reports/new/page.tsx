import { asc, eq } from "drizzle-orm";
import { ReportForm } from "@/components/teacher/report-form";
import { PageTitle, TCard } from "@/components/teacher/ui";
import { db, students } from "@/db";
import { todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "New report" };

export default async function NewReportPage({ searchParams }: { searchParams: Promise<{ studentId?: string; month?: string }> }) {
  const me = await requireTeacher();
  const sp = await searchParams;

  const roster = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(eq(students.teacherId, me.teacherId))
    .orderBy(asc(students.name));

  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "") ? sp.month! : todayKey(me.timezone).slice(0, 7);

  return (
    <>
      <PageTitle title="Write Progress Report" crumb="Reports" />
      <TCard>
        <ReportForm reportId="new" students={roster} locked={false} defaults={{ studentId: sp.studentId ?? "", month }} />
      </TCard>
    </>
  );
}
