import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NewStudentForm } from "@/components/student/forms";
import { SCard, SubHeader } from "@/components/student/ui";
import { courses, db } from "@/db";
import { requireParent } from "@/lib/auth/session";

export const metadata = { title: "Add a student" };

export default async function NewStudentPage() {
  const parent = await requireParent();
  if (parent.studentId) redirect("/student/students");
  const list = await db.select({ title: courses.title }).from(courses).where(eq(courses.published, true)).orderBy(asc(courses.sortOrder));

  return (
    <>
      <SubHeader eyebrow="Your family" title="Add another child" back="/student/students" />
      <SCard className="max-w-2xl">
        <p className="mb-6 text-slate-500">
          Tell us about your child and the academy will contact you to arrange a free trial class. Your contact details and family account are added automatically.
        </p>
        <NewStudentForm courses={list.map((c) => c.title)} />
      </SCard>
    </>
  );
}
