"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { classSessions, db, guardians, leads, sessions, students, users } from "@/db";
import { logActivity } from "@/lib/admin/log";
import { safeZone } from "@/lib/admin/time";
import { currentSessionId, requireParent } from "@/lib/auth/session";
import { revalidateAreas } from "@/lib/revalidate";
import { recoveryDeadline } from "@/lib/teacher/constants";
import { LEAVE_NOTICE_MINUTES, LEAVE_RETURN_PATHS } from "./constants";
import { familyScope } from "./scope";

const refresh = () => revalidateAreas("student", "teacher", "admin");

/* ───────── Mark a class as on leave ───────── */

/**
 * The family tells the academy a child cannot attend. Allowed only for the family's own
 * scheduled classes and with enough notice; the teacher then sees it under Reschedules.
 */
export async function markOnLeave(classId: string, returnTo: string) {
  const parent = await requireParent();
  const back = (LEAVE_RETURN_PATHS as readonly string[]).includes(returnTo) ? returnTo : "/student";

  const [cls] = await db
    .select({ id: classSessions.id, startsAt: classSessions.startsAt, status: classSessions.status, studentName: students.name })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .where(and(eq(classSessions.id, classId), familyScope(parent)))
    .limit(1);

  if (!cls || cls.status !== "scheduled") redirect(`${back}?leave=invalid`);
  if (cls.startsAt.getTime() < new Date().getTime() + LEAVE_NOTICE_MINUTES * 60000) redirect(`${back}?leave=late`);

  await db
    .update(classSessions)
    .set({ status: "student_leave", rescheduleDeadline: recoveryDeadline(cls.startsAt) })
    .where(eq(classSessions.id, classId));
  await logActivity(parent, "updated", "class", classId, `Family marked ${cls.studentName}'s class as on leave`);
  refresh();
  redirect(`${back}?leave=ok`);
}

/* ───────── Ask the academy to add another child ───────── */

export type StudentRequestState = { ok?: boolean; message?: string; errors?: Record<string, string>; values?: Record<string, string> };

/** Creates a lead for the admin, pre-filled from the family's own record. */
export async function requestNewStudent(_prev: StudentRequestState, formData: FormData): Promise<StudentRequestState> {
  const parent = await requireParent();
  if (parent.studentId) return { message: "Please ask your parent to add another child from their own login." };
  const studentName = String(formData.get("studentName") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim().slice(0, 120);
  const preferredTime = String(formData.get("preferredTime") ?? "").trim().slice(0, 200);
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  const values = { studentName, age: ageRaw, course, preferredTime, note };

  const errors: Record<string, string> = {};
  if (studentName.length < 2) errors.studentName = "Enter the child's name";
  const age = ageRaw === "" ? null : Number(ageRaw);
  if (age !== null && (!Number.isInteger(age) || age < 3 || age > 100)) errors.age = "Enter an age between 3 and 100";
  if (Object.keys(errors).length) return { errors, values, message: "Please fix the highlighted fields." };

  const [g] = await db.select().from(guardians).where(eq(guardians.id, parent.guardianId)).limit(1);
  await db.insert(leads).values({
    type: "trial",
    parentName: parent.guardianName,
    studentName,
    studentAge: age,
    email: g?.email ?? "",
    phone: g?.phone ?? "",
    country: g?.country ?? "",
    timezone: parent.timezone,
    course,
    preferredTime,
    message: `Existing family asking to add another child.${note ? `\n${note}` : ""}`,
    notes: `Family username: ${parent.username ?? "n/a"}`,
  });
  await logActivity(parent, "created", "lead", parent.guardianId, `Family requested a new student: ${studentName}`);
  revalidateAreas("admin");
  return { ok: true, message: "Thank you. We have received your request and will contact you to arrange the first class." };
}

/* ───────── Profile and security ───────── */

export type SimpleState = { ok?: boolean; message?: string };

export async function saveTimezone(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const parent = await requireParent();
  const tz = String(formData.get("timezone") ?? "").trim();
  if (!tz || safeZone(tz) !== tz) return { message: "That is not a valid time zone name. Try something like Europe/London." };

  await db.update(guardians).set({ timezone: tz }).where(eq(guardians.id, parent.guardianId));
  refresh();
  return { ok: true, message: "Time zone saved. Class times now show in it." };
}

/** Signs out every "keep me signed in" device except the one being used now. */
export async function signOutRememberedDevices() {
  const parent = await requireParent();
  const current = await currentSessionId();
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, parent.id), eq(sessions.remembered, true), current ? ne(sessions.id, current) : undefined));
  revalidatePath("/student/profile");
}

export async function markNoticesRead() {
  const parent = await requireParent();
  await db.update(users).set({ notificationsSeenAt: new Date() }).where(eq(users.id, parent.id));
  revalidateAreas("student");
}
