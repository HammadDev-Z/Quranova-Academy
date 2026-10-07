"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, materials } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { logActivity } from "./log";
import { MATERIALS_DIR } from "./materials-paths";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "audio/mpeg", "audio/mp4", "audio/x-m4a", "video/mp4"]);
const ALLOWED_EXTS = new Set(["pdf", "png", "jpg", "jpeg", "mp3", "m4a", "mp4"]);

export type MaterialState = { ok?: boolean; message?: string; errors?: Record<string, string> };

export async function uploadMaterial(_prev: MaterialState, formData: FormData): Promise<MaterialState> {
  const me = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "General";
  const file = formData.get("file");

  const errors: Record<string, string> = {};
  if (title.length < 2) errors.title = "Enter a title";
  if (!(file instanceof File) || file.size === 0) {
    errors.file = "Choose a file";
  } else if (file.size > MAX_BYTES) {
    errors.file = "File is too large (max 20MB)";
  } else if (!ALLOWED_EXTS.has((file.name.split(".").pop() ?? "").toLowerCase()) || (file.type && !ALLOWED_TYPES.has(file.type))) {
    // The extension decides how the file is stored and served, so it must be on the list too.
    errors.file = "Allowed types: PDF, PNG/JPEG image, MP3, M4A or MP4";
  }
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  const f = file as File;
  const materialId = randomUUID();
  const ext = (f.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";

  await mkdir(MATERIALS_DIR, { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ MATERIALS_DIR, `${materialId}.${ext}`), Buffer.from(await f.arrayBuffer()));

  await db.insert(materials).values({ id: materialId, title, category, fileName: f.name.slice(0, 200), fileExt: ext, sizeBytes: f.size });
  await logActivity(me, "created", "material", materialId, `Uploaded material: ${title}`);
  revalidatePath("/admin/materials");
  revalidatePath("/teacher/materials");
  return { ok: true, message: "Uploaded." };
}

export async function deleteMaterial(materialId: string) {
  const me = await requireAdmin();
  const [m] = await db.select().from(materials).where(eq(materials.id, materialId)).limit(1);
  if (!m) return;

  await unlink(path.join(/* turbopackIgnore: true */ MATERIALS_DIR, `${m.id}.${m.fileExt}`)).catch(() => {});
  await db.delete(materials).where(eq(materials.id, materialId));
  await logActivity(me, "deleted", "material", materialId, `Deleted material: ${m.title}`);
  revalidatePath("/admin/materials");
  revalidatePath("/teacher/materials");
}
