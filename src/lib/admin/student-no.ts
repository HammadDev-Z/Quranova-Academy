import "server-only";
import { max } from "drizzle-orm";
import { db, students } from "@/db";

/** Next short student number (1001, 1002, ...). */
export async function nextStudentNo(): Promise<number> {
  const [row] = await db.select({ top: max(students.studentNo) }).from(students);
  return Math.max(row?.top ?? 0, 1000) + 1;
}
