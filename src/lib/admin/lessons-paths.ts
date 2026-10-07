import path from "node:path";

// Plain constants shared by the upload action and the image route. Kept out of
// the "use server" actions file, which may only export async functions.
export const LESSONS_DIR = path.join(process.cwd(), "data", "lessons");
export const LESSON_IMAGE_TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

/** Folder of the resized copies (see lib/lesson-image.ts for the allowed widths). */
export const THUMBS_DIR = path.join(LESSONS_DIR, "thumbs");
export const thumbName = (id: string, width: number) => `${id}-${width}.webp`;
