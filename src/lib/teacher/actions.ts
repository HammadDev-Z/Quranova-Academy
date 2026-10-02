"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { availabilitySlots, classReschedules, classSessions, classStatuses, db, progressReports, students } from "@/db";
import { logActivity } from "@/lib/admin/log";
import { dayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { MAX_RESCHEDULES, MIN_NOTICE_MINUTES, RECOVERY_STATUSES, RESCHEDULE_WINDOW_DAYS } from "./constants";
import { checkSlot } from "./slots";

const refresh = () => {
  revalidatePath("/teacher", "layout");
  revalidatePath("/admin", "layout");
};

const DAY_MS = 24 * 60 * 60 * 1000;
type ClassStatus = (typeof classStatuses)[number];
const isRecovery = (s: string) => (RECOVERY_STATUSES as readonly string[]).includes(s);

async function ownClass(teacherId: string, classId: string) {
  const [row] = await db
    .select()
    .from(classSessions)
    .where(and(eq(classSessions.id, classId), eq(classSessions.teacherId, teacherId)))
    .limit(1);
  return row;
}

/* ───────── Attendance ───────── */

// What a teacher may set. "Teacher absent without notice" is for the admin to record.
const TEACHER_SETTABLE = new Set<ClassStatus>(["completed", "missed_student", "student_leave", "teacher_leave", "scheduled"]);

/** Mark one of the teacher's own classes. Leave and absence statuses open a 30-day recovery window. */
export async function markClassStatus(classId: string, status: string) {
  const me = await requireTeacher();
  if (!TEACHER_SETTABLE.has(status as ClassStatus)) return;
  const row = await ownClass(me.teacherId, classId);
  if (!row) return;

  // A class cannot be completed before it starts, and a rescheduled class cannot be reset.
  if (status === "completed" && row.startsAt.getTime() > Date.now()) return;
  if (status === "scheduled" && row.rescheduleCount > 0) return;

  const patch: Partial<typeof classSessions.$inferInsert> = { status: status as ClassStatus };
  if (isRecovery(status) && !row.rescheduleDeadline) {
    patch.rescheduleDeadline = new Date(row.startsAt.getTime() + RESCHEDULE_WINDOW_DAYS * DAY_MS);
  }
  await db.update(classSessions).set(patch).where(eq(classSessions.id, classId));
  await logActivity(me, "updated", "class", classId, `Class marked ${status.replace(/_/g, " ")}`);
  refresh();
}

export type NotesState = { ok?: boolean; message?: string };

export async function saveClassNotes(classId: string, _prev: NotesState, formData: FormData): Promise<NotesState> {
  const me = await requireTeacher();
  const row = await ownClass(me.teacherId, classId);
  if (!row) return { message: "Class not found." };

  const lessonNotes = String(formData.get("lessonNotes") ?? "").trim().slice(0, 3000);
  const homework = String(formData.get("homework") ?? "").trim().slice(0, 3000);
  await db.update(classSessions).set({ lessonNotes, homework }).where(eq(classSessions.id, classId));
  await logActivity(me, "updated", "class", classId, "Updated lesson notes");
  revalidatePath("/teacher", "layout");
  return { ok: true, message: "Notes saved." };
}

/* ───────── Student progress ───────── */

export type ProgressState = { ok?: boolean; message?: string; errors?: Record<string, string> };

export async function updateProgress(studentId: string, _prev: ProgressState, formData: FormData): Promise<ProgressState> {
  const me = await requireTeacher();
  const [student] = await db.select({ id: students.id, teacherId: students.teacherId }).from(students).where(eq(students.id, studentId)).limit(1);
  if (!student || student.teacherId !== me.teacherId) return { message: "Student not found." };

  const errors: Record<string, string> = {};
  const int = (name: string, max: number) => {
    const raw = String(formData.get(name) ?? "").trim();
    if (raw === "") return 0;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > max) {
      errors[name] = `Enter a whole number from 0 to ${max}`;
      return 0;
    }
    return n;
  };
  const text = (name: string) => String(formData.get(name) ?? "").trim().slice(0, 80);

  const values = {
    basicPart: text("basicPart"),
    basicPage: int("basicPage", 99999),
    tajweedStep: int("tajweedStep", 99),
    additionalPart: text("additionalPart"),
    additionalPage: int("additionalPage", 99999),
  };
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  await db.update(students).set(values).where(eq(students.id, studentId));
  await logActivity(me, "updated", "student", studentId, "Updated course progress");
  refresh();
  return { ok: true, message: "Progress saved." };
}

/* ───────── Reschedule, advance reschedule and swap ───────── */

export type RescheduleState = { ok?: boolean; message?: string };

/**
 * Moves a class to a chosen slot. Works for two cases:
 *  - recovery: the class was a leave/absence and is within its 30-day window
 *  - advance: a future scheduled class the teacher wants to move ahead of time
 * Each counts towards the 2-reschedule limit, and every rule is re-checked here.
 */
export async function rescheduleToSlot(classId: string, _prev: RescheduleState, formData: FormData): Promise<RescheduleState> {
  const me = await requireTeacher();
  const row = await ownClass(me.teacherId, classId);
  if (!row) return { message: "Class not found." };

  const recovery = isRecovery(row.status);
  const advance = row.status === "scheduled" && row.startsAt.getTime() > Date.now() + MIN_NOTICE_MINUTES * 60000;
  if (!recovery && !advance) return { message: "This class cannot be rescheduled." };

  if (row.rescheduleCount >= MAX_RESCHEDULES) {
    return { message: `This class has already been rescheduled the maximum of ${MAX_RESCHEDULES} times.` };
  }
  if (recovery) {
    const deadline = row.rescheduleDeadline ?? new Date(row.startsAt.getTime() + RESCHEDULE_WINDOW_DAYS * DAY_MS);
    if (deadline.getTime() < Date.now()) return { message: "The 30-day window for this class has ended." };
  }

  const start = new Date(String(formData.get("slot") ?? ""));
  if (Number.isNaN(start.getTime())) return { message: "Choose a time slot first." };

  const [student] = await db.select({ timezone: students.timezone }).from(students).where(eq(students.id, row.studentId)).limit(1);
  const problem = await checkSlot(
    {
      teacherId: me.teacherId,
      teacherTz: me.timezone,
      studentId: row.studentId,
      studentTz: student?.timezone ?? "",
      durationMin: row.durationMin,
      excludeClassIds: [row.id],
    },
    start,
    dayKey(start, me.timezone),
  );
  if (problem) return { message: `That slot is not available: ${problem}.` };

  await db.insert(classReschedules).values({
    classId,
    oldStartsAt: row.startsAt,
    newStartsAt: start,
    requestedBy: "teacher",
    kind: recovery ? "recovery" : "advance",
    note: String(formData.get("note") ?? "").trim().slice(0, 300),
  });
  await db
    .update(classSessions)
    .set({ startsAt: start, status: "scheduled", rescheduleCount: row.rescheduleCount + 1 })
    .where(eq(classSessions.id, classId));
  await logActivity(me, "updated", "class", classId, `${recovery ? "Rescheduled" : "Moved"} class to ${start.toISOString()}`);
  refresh();
  redirect("/teacher/reschedule?done=1");
}

/** Swaps the times of two of the teacher's future scheduled classes. Does not use up reschedules. */
export async function swapClasses(classId: string, _prev: RescheduleState, formData: FormData): Promise<RescheduleState> {
  const me = await requireTeacher();
  const otherId = String(formData.get("otherId") ?? "");
  if (!otherId || otherId === classId) return { message: "Choose a class to swap with." };

  const [a, b] = await Promise.all([ownClass(me.teacherId, classId), ownClass(me.teacherId, otherId)]);
  if (!a || !b) return { message: "Class not found." };

  const soon = Date.now() + MIN_NOTICE_MINUTES * 60000;
  if (a.status !== "scheduled" || b.status !== "scheduled" || a.startsAt.getTime() < soon || b.startsAt.getTime() < soon) {
    return { message: "Only upcoming scheduled classes can be swapped." };
  }

  const studentRows = await Promise.all(
    [a, b].map((c) => db.select({ timezone: students.timezone }).from(students).where(eq(students.id, c.studentId)).limit(1)),
  );
  const checks = await Promise.all(
    [
      { cls: a, to: b.startsAt, tz: studentRows[0][0]?.timezone ?? "" },
      { cls: b, to: a.startsAt, tz: studentRows[1][0]?.timezone ?? "" },
    ].map(({ cls, to, tz }) =>
      checkSlot(
        {
          teacherId: me.teacherId,
          teacherTz: me.timezone,
          studentId: cls.studentId,
          studentTz: tz,
          durationMin: cls.durationMin,
          excludeClassIds: [a.id, b.id],
        },
        to,
        dayKey(to, me.timezone),
      ),
    ),
  );
  const problem = checks.find(Boolean);
  if (problem) return { message: `These classes cannot be swapped: ${problem}.` };

  await db.transaction(async (tx) => {
    await tx.update(classSessions).set({ startsAt: b.startsAt }).where(eq(classSessions.id, a.id));
    await tx.update(classSessions).set({ startsAt: a.startsAt }).where(eq(classSessions.id, b.id));
    await tx.insert(classReschedules).values([
      { classId: a.id, oldStartsAt: a.startsAt, newStartsAt: b.startsAt, requestedBy: "teacher", kind: "swap", note: "Swapped with another class" },
      { classId: b.id, oldStartsAt: b.startsAt, newStartsAt: a.startsAt, requestedBy: "teacher", kind: "swap", note: "Swapped with another class" },
    ]);
  });
  await logActivity(me, "updated", "class", classId, "Swapped class times");
  refresh();
  redirect("/teacher/classes?swapped=1");
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
    refresh();
    redirect(`/teacher/reports?month=${month}&saved=1`);
  }

  const [existing] = await db.select().from(progressReports).where(eq(progressReports.id, reportId)).limit(1);
  if (!existing || existing.teacherId !== me.teacherId) return { message: "Report not found.", values: echo };
  if (existing.status === "reviewed") return { message: "This report has already been reviewed and can no longer be edited.", values: echo };

  await db.update(progressReports).set(values).where(eq(progressReports.id, reportId));
  await logActivity(me, "updated", "report", reportId, `${submit ? "Submitted" : "Saved draft"} report for ${month}`);
  refresh();
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
