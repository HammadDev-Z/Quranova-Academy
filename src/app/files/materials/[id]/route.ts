import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
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

/** Parses a single "bytes=a-b" range; null when absent or not satisfiable. */
function parseRange(header: string | null, size: number): { start: number; end: number } | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header ?? "");
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start: number;
  let end: number;
  if (m[1] === "") {
    // "bytes=-500" means the last 500 bytes.
    start = Math.max(size - Number(m[2]), 0);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  return start <= end && start < size ? { start, end } : null;
}

// Not under /admin or /teacher, so the proxy doesn't gate it — this route
// checks the signed-in user itself, same as the CSV export route.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { size } = await stat(filePath);

    // ASCII-only fallback name plus the real (UTF-8) name, so odd characters cannot break the header.
    const ascii = m.fileName.replace(/[^\x20-\x7e]|["\;]/g, "_");
    const headers: Record<string, string> = {
      "Content-Type": MIME[m.fileExt] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(m.fileName)}`,
      "Cache-Control": "private, max-age=3600",
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
    };

    // Audio and video need byte ranges to seek; a browser asks for them with a Range header.
    const rangeHeader = req.headers.get("range");
    const range = parseRange(rangeHeader, size);
    if (rangeHeader && !range) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });

    const body = (opts?: { start: number; end: number }) =>
      Readable.toWeb(createReadStream(filePath, opts)) as unknown as ReadableStream;

    if (range) {
      return new Response(body(range), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${range.start}-${range.end}/${size}`, "Content-Length": String(range.end - range.start + 1) },
      });
    }
    return new Response(body(), { headers: { ...headers, "Content-Length": String(size) } });
  } catch {
    return new Response("File missing on server", { status: 404 });
  }
}
