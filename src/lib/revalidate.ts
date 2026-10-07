import { revalidatePath } from "next/cache";

type Area = "site" | "admin" | "teacher" | "student";

const roots: Record<Area, string> = { site: "/", admin: "/admin", teacher: "/teacher", student: "/student" };

/** Refreshes the cached pages of the given areas after a change. Call from server actions only. */
export function revalidateAreas(...areas: Area[]) {
  for (const area of areas) revalidatePath(roots[area], "layout");
}
