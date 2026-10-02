import path from "node:path";

// Plain constant shared by the upload/delete actions and the file-serving
// route. Kept out of materials-actions.ts because a "use server" file may
// only export async functions.
export const MATERIALS_DIR = path.join(process.cwd(), "data", "materials");
