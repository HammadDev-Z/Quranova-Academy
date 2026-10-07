"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { courses, db, lessonPages } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { LESSON_WIDTHS } from "@/lib/lesson-image";
import { LESSONS_DIR, LESSON_IMAGE_TYPES, THUMBS_DIR, thumbName } from "./lessons-paths";
import { logActivity } from "./log";

const MAX_FILES = 100;
const MAX_BYTES = 8 * 1024 * 1024; // per image

export type LessonUploadState = { ok?: boolean; message?: string; errors?: Record<string, string> };

export async function uploadLessonPages(_prev: LessonUploadState, formData: FormData): Promise<LessonUploadState> {
  const me = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const part = String(formData.get("part") ?? "").trim().slice(0, 60);
  const prefix = String(formData.get("prefix") ?? "").trim().replace(/[^A-Za-z0-9-]/g, "").slice(0, 30) || "P";
  const start = Number(formData.get("startPage"));
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  const errors: Record<string, string> = {};
  const [course] = courseId ? await db.select({ id: courses.id }).from(courses).where(eq(courses.id, courseId)).limit(1) : [];
  if (!course) errors.courseId = "Choose a course";
  if (!Number.isInteger(start) || start < 1 || start > 99999) errors.startPage = "Enter the first page number (1 or more)";
  if (files.length === 0) errors.files = "Choose at least one image";
  else if (files.length > MAX_FILES) errors.files = `Upload at most ${MAX_FILES} images at a time`;
  else {
    for (const f of files) {
      const ext = (f.name.split(".").pop() ?? "").toLowerCase();
      if (!LESSON_IMAGE_TYPES[ext] || !f.type.startsWith("image/")) {
        errors.files = `${f.name} is not a PNG, JPG or WebP image`;
        break;
      }
      if (f.size > MAX_BYTES) {
        errors.files = `${f.name} is larger than 8MB`;
        break;
      }
    }
  }
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  // Images are numbered in file-name order, so name them 01, 02, 03... before uploading.
  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const end = start + files.length;

  const clash = await db
    .select({ pageNo: lessonPages.pageNo })
    .from(lessonPages)
    .where(and(eq(lessonPages.courseId, courseId), eq(lessonPages.part, part), gte(lessonPages.pageNo, start), lt(lessonPages.pageNo, end)));
  if (clash.length > 0) {
    return { errors: { startPage: `Pages ${clash.map((c) => c.pageNo).sort((a, b) => a - b).slice(0, 5).join(", ")} already exist for this part` }, message: "Delete the existing pages first or choose another first page number." };
  }

  await mkdir(LESSONS_DIR, { recursive: true });
  const rows: (typeof lessonPages.$inferInsert)[] = [];
  try {
    for (const [i, f] of files.entries()) {
      const id = randomUUID();
      const ext = (f.name.split(".").pop() ?? "png").toLowerCase();
      await writeFile(path.join(/* turbopackIgnore: true */ LESSONS_DIR, `${id}.${ext}`), Buffer.from(await f.arrayBuffer()));
      const pageNo = start + i;
      rows.push({ id, courseId, part, pageNo, label: `${prefix}-${String(pageNo).padStart(2, "0")}`, fileExt: ext });
    }
    await db.insert(lessonPages).values(rows);
  } catch {
    // All or nothing: do not leave image files behind that no page points to.
    await removeFiles(rows.map((r) => ({ id: r.id as string, fileExt: r.fileExt })));
    return { message: "The upload could not be saved. Nothing was added, please try again." };
  }
  await logActivity(me, "created", "lesson pages", courseId, `Uploaded ${rows.length} lesson pages${part ? ` for ${part}` : ""}`);
  revalidatePath("/admin/lesson-pages");
  revalidatePath("/student", "layout");
  return { ok: true, message: `Uploaded ${rows.length} page${rows.length === 1 ? "" : "s"} (${start} to ${end - 1}).` };
}

async function removeFiles(rows: { id: string; fileExt: string }[]) {
  await Promise.all(
    rows.flatMap((r) => [
      unlink(path.join(/* turbopackIgnore: true */ LESSONS_DIR, `${r.id}.${r.fileExt}`)).catch(() => {}),
      // The resized copies made for thumbnails go too.
      ...LESSON_WIDTHS.map((w) => unlink(path.join(/* turbopackIgnore: true */ THUMBS_DIR, thumbName(r.id, w))).catch(() => {})),
    ]),
  );
}

export async function deleteLessonPage(pageId: string) {
  const me = await requireAdmin();
  const [row] = await db.select().from(lessonPages).where(eq(lessonPages.id, pageId)).limit(1);
  if (!row) return;
  await removeFiles([row]);
  await db.delete(lessonPages).where(eq(lessonPages.id, pageId));
  await logActivity(me, "deleted", "lesson page", pageId, `Deleted lesson page ${row.label}`);
  revalidatePath("/admin/lesson-pages");
  revalidatePath("/student", "layout");
}

export async function deleteLessonPart(courseId: string, part: string) {
  const me = await requireAdmin();
  const rows = await db.select().from(lessonPages).where(and(eq(lessonPages.courseId, courseId), eq(lessonPages.part, part)));
  if (rows.length === 0) return;
  await removeFiles(rows);
  await db.delete(lessonPages).where(and(eq(lessonPages.courseId, courseId), eq(lessonPages.part, part)));
  await logActivity(me, "deleted", "lesson pages", courseId, `Deleted ${rows.length} lesson pages${part ? ` of ${part}` : ""}`);
  revalidatePath("/admin/lesson-pages");
  revalidatePath("/student", "layout");
}
