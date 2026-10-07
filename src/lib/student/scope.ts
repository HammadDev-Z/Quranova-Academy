import { and, eq } from "drizzle-orm";
import { students } from "@/db";
import type { CurrentParent } from "@/lib/auth/session";

/**
 * Which children a signed-in family account may see. A parent sees all of their
 * children; a student account sees only its own record.
 */
export function familyScope(parent: Pick<CurrentParent, "guardianId" | "studentId">) {
  return and(eq(students.guardianId, parent.guardianId), parent.studentId ? eq(students.id, parent.studentId) : undefined)!;
}
