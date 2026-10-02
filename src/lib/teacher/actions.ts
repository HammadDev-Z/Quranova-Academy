"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { availabilitySlots, classReschedules, classSessions, classStatuses, db, progressReports, students } from "@/db";
import { logActivity } from "@/lib/admin/log";
import { fromLocalInput } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";
import { MAX_RESCHEDULES, RESCHEDULE_WINDOW_DAYS } from "./constants";

const refresh = () => revalidatePath("/teacher", "layout");

const LEAVE_STATUSES = new Set(["missed_student", "missed_teacher"]);

async function ownClass(teacherId: string, classId: string) {
  const [row] = await db
    .select()
    .from(classSessions)
    .where(and(eq(classSessions.id, classId), eq(classSessions.teacherId, teacherId)))
    .limit(1);
  return row;
}

/* ───────── Attendance ───────── */

/** Mark one of the teacher's own classes done, a no-show, or a leave (which opens a reschedule window). */
export async function markClassStatus(classId: string, status: string) {
  const me = await requireTeacher();
  if (!(classStatuses as readonly string[]).includes(status)) return;
  const row = await ownClass(me.teacherId, classId);
  if (!row) return;

  const patch: Partial<typeof classSessions.$inferInsert> = { status: status as (typeof classStatuses)[number] };
  if (LEAVE_STATUSES.has(status) && !row.rescheduleDeadline) {
    patch.rescheduleDeadline = new Date(Date.now() + RESCHEDULE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  }
  await db.update(classSessions).set(patch).where(eq(classSessions.id, classId));
  await logActivity(me, "updated", "class", classId, `Class marked ${status.replace(/_/g, " ")}`);
  refresh();
}

/* ───────── Reschedule ───────── */

export type RescheduleState = { ok?: boolean; message?: string; errors?: Record<string, string> };

export async function requestReschedule(classId: string, _prev: RescheduleState, formData: FormData): Promise<RescheduleState> {
  const me = await requireTeacher();
  const { adminTimezone: tz } = await getRawSettings();
  const row = await ownClass(me.teacherId, classId);
  if (!row) return { message: "Class not found." };

  if (!row.rescheduleDeadline || row.rescheduleDeadline.getTime() < Date.now()) {
    return { message: "This class is no longer eligible for rescheduling." };
  }
  if (row.rescheduleCount >= MAX_RESCHEDULES) {
    return { message: `This class has already been rescheduled the maximum of ${MAX_RESCHEDULES} times.` };
  }

  const value = String(formData.get("newStartsAt") ?? "");
  const newStartsAt = fromLocalInput(value, tz);
  if (!newStartsAt) return { errors: { newStartsAt: "Choose a date and time" } };
  if (newStartsAt.getTime() < Date.now()) return { errors: { newStartsAt: "Choose a time in the future" } };

  await db.insert(classReschedules).values({
    classId,
    oldStartsAt: row.startsAt,
    newStartsAt,
    requestedBy: "teacher",
    note: String(formData.get("note") ?? "").trim().slice(0, 300),
  });
  await db
    .update(classSessions)
    .set({ startsAt: newStartsAt, status: "scheduled", rescheduleCount: row.rescheduleCount + 1 })
    .where(eq(classSessions.id, classId));
  await logActivity(me, "updated", "class", classId, `Rescheduled class to ${newStartsAt.toISOString()}`);
  refresh();
  return { ok: true, message: "Class rescheduled." };
}

/* ───────── Progress reports ───────── */

export type ReportState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

/** Saves a draft or submits a report for admin review. reportId is "new" to create one. */
export async function saveReport(reportId: string, _prev: ReportState, formData: FormData): Promise<ReportState> {
  const me = await requireTeacher();
  const submit = formData.get("intent") === "submit";

  const studentId = String(formData.get("studentId") ?? "");
  const month = String(formData.get("month") ?? "");
  const covered = String(formData.get("covered") ?? "").trim();
  const strengths = String(formData.get("strengths") ?? "").trim();
  const improvements = String(formData.get("improvements") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "");
  const echo = { studentId, month, covered, strengths, improvements, rating: ratingRaw };

  const errors: Record<string, string> = {};
  const [student] = studentId
    ? await db.select({ id: students.id, teacherId: students.teacherId }).from(students).where(eq(students.id, studentId)).limit(1)
    : [];
  if (!student || student.teacherId !== me.teacherId) errors.studentId = "Choose one of your students";
  if (!/^\d{4}-\d{2}$/.test(month)) errors.month = "Choose a month";
  if (!covered) errors.covered = "Describe what was covered this month";
  if (ratingRaw && !["1", "2", "3", "4", "5"].includes(ratingRaw)) errors.rating = "Choose a rating from 1 to 5";
  if (Object.keys(errors).length) return { errors, values: echo, message: "Please fix the highlighted fields." };

  const rating = ratingRaw ? Number(ratingRaw) : null;
  const values = {
    studentId,
    teacherId: me.teacherId,
    month,
    covered,
    strengths,
    improvements,
    rating,
    status: (submit ? "submitted" : "draft") as "submitted" | "draft",
    submittedAt: submit ? new Date() : null,
  };

  if (reportId === "new") {
    const [existing] = await db
      .select({ id: progressReports.id })
      .from(progressReports)
      .where(and(eq(progressReports.studentId, studentId), eq(progressReports.month, month)))
      .limit(1);
    if (existing) return { errors: { month: "A report for this student and month already exists" }, values: echo, message: "Please fix the highlighted fields." };

    const [row] = await db.insert(progressReports).values(values).returning({ id: progressReports.id });
    await logActivity(me, "created", "report", row.id, `${submit ? "Submitted" : "Saved draft"} report for ${month}`);
    revalidatePath("/teacher/reports");
    revalidatePath("/admin/reports");
    redirect("/teacher/reports?saved=1");
  }

  const [existing] = await db.select().from(progressReports).where(eq(progressReports.id, reportId)).limit(1);
  if (!existing || existing.teacherId !== me.teacherId) return { message: "Report not found.", values: echo };
  if (existing.status === "reviewed") return { message: "This report has already been reviewed and can no longer be edited.", values: echo };

  await db.update(progressReports).set(values).where(eq(progressReports.id, reportId));
  await logActivity(me, "updated", "report", reportId, `${submit ? "Submitted" : "Saved draft"} report for ${month}`);
  revalidatePath("/teacher/reports");
  revalidatePath("/admin/reports");
  return { ok: true, message: submit ? "Report submitted for review." : "Draft saved." };
}

/* ───────── Availability ───────── */

export type AvailabilityState = { ok?: boolean; message?: string };

/** Replaces the teacher's whole weekly availability with what was submitted. */
export async function saveAvailability(_prev: AvailabilityState, formData: FormData): Promise<AvailabilityState> {
  const me = await requireTeacher();

  const rows: (typeof availabilitySlots.$inferInsert)[] = [];
  for (let day = 0; day < 7; day++) {
    const start = String(formData.get(`start_${day}`) ?? "").trim();
    const end = String(formData.get(`end_${day}`) ?? "").trim();
    if (/^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) && start < end) {
      rows.push({ teacherId: me.teacherId, weekday: day, startTime: start, endTime: end });
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(availabilitySlots).where(eq(availabilitySlots.teacherId, me.teacherId));
    if (rows.length) await tx.insert(availabilitySlots).values(rows);
  });

  revalidatePath("/teacher/availability");
  return { ok: true, message: "Availability saved." };
}
