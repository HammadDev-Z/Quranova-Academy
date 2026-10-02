import { and, asc, eq, like } from "drizzle-orm";
import Link from "next/link";
import { AdminPageHeader, Badge, EmptyState } from "@/components/admin/ui";
import { courses, db, guardians, students } from "@/db";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "My students" };

export default async function TeacherStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireTeacher();
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);

  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      age: students.age,
      status: students.status,
      course: courses.title,
      guardian: guardians.name,
    })
    .from(students)
    .leftJoin(courses, eq(courses.id, students.courseId))
    .leftJoin(guardians, eq(guardians.id, students.guardianId))
    .where(query ? and(eq(students.teacherId, me.teacherId), like(students.name, `%${query}%`)) : eq(students.teacherId, me.teacherId))
    .orderBy(asc(students.name));

  return (
    <>
      <AdminPageHeader title="My students" description="Everyone currently assigned to you." />

      <form action="/teacher/students" className="mb-5 max-w-sm">
        <label htmlFor="q" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
          Search
        </label>
        <input id="q" name="q" defaultValue={query} placeholder="Search by name…" className="w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2 text-sm" />
      </form>

      {rows.length === 0 ? (
        <EmptyState title={query ? "No students match" : "No students assigned yet"} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-brand-50/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Student</th>
                <th scope="col" className="px-4 py-3 font-semibold">Course</th>
                <th scope="col" className="px-4 py-3 font-semibold">Parent</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/teacher/students/${s.id}`} className="font-semibold text-brand-700 hover:underline">
                      {s.name}
                    </Link>
                    {s.age ? <span className="ml-2 text-xs text-muted">{s.age} yrs</span> : null}
                  </td>
                  <td className="px-4 py-3">{s.course ?? "—"}</td>
                  <td className="px-4 py-3">{s.guardian ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge value={s.status} />
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
