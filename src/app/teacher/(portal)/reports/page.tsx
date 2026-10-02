import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { AdminPageHeader, Badge, EmptyState, Flash, linkButton } from "@/components/admin/ui";
import { db, progressReports, students } from "@/db";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "Progress reports" };

export default async function TeacherReportsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const me = await requireTeacher();
  const { saved } = await searchParams;

  const rows = await db
    .select({
      id: progressReports.id,
      month: progressReports.month,
      status: progressReports.status,
      rating: progressReports.rating,
      student: students.name,
    })
    .from(progressReports)
    .innerJoin(students, eq(students.id, progressReports.studentId))
    .where(eq(progressReports.teacherId, me.teacherId))
    .orderBy(desc(progressReports.month));

  return (
    <>
      <AdminPageHeader
        title="Progress reports"
        description="Write a monthly report for each student, save it as a draft, then submit it for admin review."
        actions={
          <Link href="/teacher/reports/new" className={linkButton}>
            + New report
          </Link>
        }
      />
      <Flash saved={saved} />

      {rows.length === 0 ? (
        <EmptyState title="No reports yet">
          <Link href="/teacher/reports/new" className="font-semibold text-brand-600 underline">
            Write your first report
          </Link>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-brand-50/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Student</th>
                <th scope="col" className="px-4 py-3 font-semibold">Month</th>
                <th scope="col" className="px-4 py-3 font-semibold">Rating</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/teacher/reports/${r.id}`} className="font-semibold text-brand-700 hover:underline">
                      {r.student}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.month}</td>
                  <td className="px-4 py-3">{r.rating ? `${r.rating} / 5` : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge value={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
