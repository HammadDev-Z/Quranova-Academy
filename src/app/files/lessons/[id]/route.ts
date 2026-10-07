import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, or } from "drizzle-orm";
import { db, guardians, lessonPages, students } from "@/db";
import { LESSONS_DIR, LESSON_IMAGE_TYPES, THUMBS_DIR, thumbName } from "@/lib/admin/lessons-paths";
import { LESSON_WIDTHS, type LessonWidth } from "@/lib/lesson-image";
import { getCurrentUser } from "@/lib/auth/session";

// A page image never changes (replacing a page creates a new id), so browsers may keep it for a year.
const CACHE = "private, max-age=31536000, immutable";

/** The resized copy of a page: made on first request, then read from disk. */
async function resized(id: string, source: string, width: LessonWidth): Promise<Buffer> {
  const file = path.join(/* turbopackIgnore: true */ THUMBS_DIR, thumbName(id, width));
  try {
    return await readFile(file);
  } catch {
    const sharp = (await import("sharp")).default;
    const out = await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    await mkdir(THUMBS_DIR, { recursive: true });
    await writeFile(file, out);
    return out;
  }
}

// Not under a portal prefix, so the proxy does not gate it. This route checks
// the signed-in user itself: staff may open any page, a family only pages of
// courses their own children are enrolled in.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const [page] = await db.select().from(lessonPages).where(eq(lessonPages.id, id)).limit(1);
  if (!page) return new Response("Not found", { status: 404 });

  if (user.role === "parent" || user.role === "student") {
    // A parent matches through their parent record, a student account through its own student record.
    const owner = user.role === "parent" ? eq(guardians.userId, user.id) : eq(students.userId, user.id);
    const [allowed] = await db
      .select({ id: students.id })
      .from(students)
      .leftJoin(guardians, eq(guardians.id, students.guardianId))
      .where(and(owner, or(eq(students.courseId, page.courseId), eq(students.additionalCourseId, page.courseId))))
      .limit(1);
    if (!allowed) return new Response("Not found", { status: 404 });
  } else if (user.role !== "admin" && user.role !== "teacher") {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Fixed folder inside the project's data directory; the file name comes from our own database row.
    const file = path.join(/* turbopackIgnore: true */ LESSONS_DIR, `${page.id}.${page.fileExt}`);
    const width = Number(new URL(req.url).searchParams.get("w"));
    const wanted = LESSON_WIDTHS.find((w) => w === width);

    const body = wanted ? await resized(page.id, file, wanted) : await readFile(file);
    const type = wanted ? "image/webp" : (LESSON_IMAGE_TYPES[page.fileExt] ?? "application/octet-stream");
    return new Response(new Uint8Array(body), { headers: { "Content-Type": type, "Cache-Control": CACHE, "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response("File missing on server", { status: 404 });
  }
}
