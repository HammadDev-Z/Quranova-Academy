import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { LessonViewer } from "@/components/student/lesson-viewer";
import { Hero, SCard, SubHeader } from "@/components/student/ui";
import { courses, db, lessonPages, students } from "@/db";
import { requireParent } from "@/lib/auth/session";
import { familyScope } from "@/lib/student/scope";

export const metadata = { title: "Lesson" };

type Props = { params: Promise<{ studentId: string; track: string }>; searchParams: Promise<{ page?: string }> };

export default async function LessonPage({ params, searchParams }: Props) {
  const parent = await requireParent();
  const { studentId, track } = await params;
  const sp = await searchParams;
  if (track !== "basic" && track !== "additional") notFound();

  // Only the family's own children can be opened.
  const [child] = await db
    .select({
      id: students.id,
      name: students.name,
      courseId: students.courseId,
      additionalCourseId: students.additionalCourseId,
      basicPart: students.basicPart,
      basicPage: students.basicPage,
      additionalPart: students.additionalPart,
      additionalPage: students.additionalPage,
    })
    .from(students)
    .where(and(eq(students.id, studentId), familyScope(parent)))
    .limit(1);
  if (!child) notFound();

  const courseId = track === "basic" ? child.courseId : child.additionalCourseId;
  if (!courseId) notFound();
  const part = (track === "basic" ? child.basicPart : child.additionalPart).trim();
  const currentPageNo = track === "basic" ? child.basicPage : child.additionalPage;

  const [course] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, courseId)).limit(1);
  const all = await db.select().from(lessonPages).where(eq(lessonPages.courseId, courseId)).orderBy(asc(lessonPages.pageNo));

  // Show just the student's current part when pages were uploaded per part; otherwise the whole course.
  const inPart = part ? all.filter((p) => p.part.trim().toLowerCase() === part.toLowerCase()) : [];
  const pages = inPart.length > 0 ? inPart : all;

  const wanted = Number(sp.page) || currentPageNo;
  const found = pages.findIndex((p) => p.pageNo === wanted);
  const startIndex = found >= 0 ? found : 0;

  return (
    <>
      <SubHeader eyebrow="Lesson material" title={part || course?.title || "Lesson"} back="/student/students" />

      <Hero className="mb-5 px-6 py-6 sm:px-8">
        <p className="text-xs font-extrabold text-emerald-100">{child.name}</p>
        <p className="mt-1 font-sans text-2xl font-extrabold">{course?.title ?? "Course"}</p>
        <p className="mt-1 text-sm text-emerald-100">{track === "basic" ? "Basic course" : "Additional course"}{currentPageNo > 0 ? ` · Teacher is on page ${currentPageNo}` : ""}</p>
      </Hero>

      {pages.length === 0 ? (
        <SCard className="py-12 text-center">
          <p className="font-sans text-xl font-extrabold text-slate-900">Lesson pages are not available yet</p>
          <p className="mx-auto mt-1 max-w-md text-slate-500">The academy has not uploaded the pages for this course. Your teacher will still guide you in class.</p>
        </SCard>
      ) : (
        <LessonViewer pages={pages.map((p) => ({ id: p.id, label: p.label, pageNo: p.pageNo }))} startIndex={startIndex} currentPageNo={currentPageNo} />
      )}
    </>
  );
}
