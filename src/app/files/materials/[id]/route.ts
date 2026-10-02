import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, materials } from "@/db";
import { MATERIALS_DIR } from "@/lib/admin/materials-paths";
import { getCurrentUser } from "@/lib/auth/session";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  mp4: "video/mp4",
};

// Not under /admin or /teacher, so the proxy doesn't gate it — this route
// checks the signed-in user itself, same as the CSV export route.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher")) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const [m] = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  if (!m) return new Response("Not found", { status: 404 });

  try {
    // MATERIALS_DIR is a fixed folder under the project's own data directory,
    // and the filename comes from our database row, not straight from the
    // request, so this stays scoped — tell Turbopack not to trace from here.
    const filePath = path.join(/* turbopackIgnore: true */ MATERIALS_DIR, `${m.id}.${m.fileExt}`);
    const buf = await readFile(filePath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[m.fileExt] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${m.fileName.replace(/[":]/g, "")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("File missing on server", { status: 404 });
  }
}
