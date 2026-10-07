import { asc } from "drizzle-orm";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { LessonUploadForm } from "@/components/admin/lesson-upload-form";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/ui";
import { courses, db, lessonPages } from "@/db";
import { deleteLessonPage, deleteLessonPart } from "@/lib/admin/lesson-actions";
import { requireAdmin } from "@/lib/auth/session";
import { lessonImageUrl } from "@/lib/lesson-image";

export const metadata = { title: "Lesson pages" };

export default async function LessonPagesAdminPage() {
  await requireAdmin();
  const [courseList, pages] = await Promise.all([
    db.select({ id: courses.id, title: courses.title }).from(courses).orderBy(asc(courses.sortOrder)),
    db.select().from(lessonPages).orderBy(asc(lessonPages.pageNo)),
  ]);

  const titleOf = new Map(courseList.map((c) => [c.id, c.title]));
  const groups = new Map<string, typeof pages>();
  for (const p of pages) {
    const k = `${p.courseId}|${p.part}`;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }

  return (
    <>
      <AdminPageHeader
        title="Lesson pages"
        description="Upload the page images families see in the lesson viewer, such as mushaf or Qaida pages. Set a student's current part and page on their record and the viewer opens at that page."
      />

      <Panel title="Upload pages" className="mb-6">
        <LessonUploadForm courses={courseList} />
      </Panel>

      {groups.size === 0 ? (
        <EmptyState title="No lesson pages yet">Upload the first set above.</EmptyState>
      ) : (
        <div className="space-y-4">
          {[...groups.entries()].map(([key, list]) => {
            const [courseId, part] = key.split("|");
            return (
              <Panel
                key={key}
                title={`${titleOf.get(courseId) ?? "Course"}${part ? ` · ${part}` : ""}`}
                actions={
                  <form action={deleteLessonPart.bind(null, courseId, part)}>
                    <ConfirmButton message={`Delete all ${list.length} pages in this set? This cannot be undone.`} className="tap text-sm font-semibold text-red-700 hover:underline">
                      Delete all {list.length}
                    </ConfirmButton>
                  </form>
                }
              >
                <p className="mb-3 text-sm text-muted">
                  {list.length} page{list.length === 1 ? "" : "s"}, numbered {list[0].pageNo} to {list[list.length - 1].pageNo}
                </p>
                <ul className="flex flex-wrap gap-3">
                  {list.map((p) => (
                    <li key={p.id} className="w-24">
                      <a href={`/files/lessons/${p.id}`} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-brand-100 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated route, not the image optimiser */}
                        <img src={lessonImageUrl(p.id, 160)} alt={p.label} loading="lazy" decoding="async" className="h-28 w-full object-cover object-top" />
                      </a>
                      <p className="mt-1 truncate text-xs font-semibold text-brand-800">{p.label}</p>
                      <form action={deleteLessonPage.bind(null, p.id)}>
                        <ConfirmButton message={`Delete page ${p.label}?`} className="tap text-xs font-semibold text-red-700 hover:underline">
                          Delete
                        </ConfirmButton>
                      </form>
                    </li>
                  ))}
                </ul>
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
