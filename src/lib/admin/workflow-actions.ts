"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { classSessions, classStatuses, courses, db, guardians, invoices, leadStatuses, leads, progressReports, students, teachers } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";
import { logActivity } from "./log";
import { nextStudentNo } from "./student-no";
import { revalidateAreas } from "@/lib/revalidate";
import { RECOVERY_STATUSES, recoveryDeadline } from "@/lib/teacher/constants";
import { paymentMethods } from "./resources";
import { addDays, fromLocalInput, todayKey } from "./time";

const refresh = () => revalidateAreas("admin");

/* ───────── Leads ───────── */

export async function setLeadStatus(leadId: string, status: string) {
  const user = await requireAdmin();
  if (!(leadStatuses as readonly string[]).includes(status)) return;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return;
  await db.update(leads).set({ status: status as (typeof leadStatuses)[number] }).where(eq(leads.id, leadId));
  await logActivity(user, "updated", "lead", leadId, `Lead ${lead.parentName || lead.email}: ${lead.status} → ${status}`);
  refresh();
}

/** Creates the parent and student records from a trial request and links them to the lead. */
export async function convertLeadToStudent(leadId: string) {
  const user = await requireAdmin();
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead || lead.studentId) redirect(`/admin/leads/${leadId}`);

  const [course] = lead.course
    ? await db.select({ id: courses.id }).from(courses).where(eq(courses.title, lead.course)).limit(1)
    : [];

  let guardianId: string | null = null;
  if (lead.parentName) {
    const [g] = await db
      .insert(guardians)
      .values({ name: lead.parentName, email: lead.email, phone: lead.phone, country: lead.country, timezone: lead.timezone })
      .returning({ id: guardians.id });
    guardianId = g.id;
  }

  const [student] = await db
    .insert(students)
    .values({
      studentNo: await nextStudentNo(),
      name: lead.studentName || lead.parentName || "New student",
      age: lead.studentAge,
      guardianId,
      country: lead.country,
      timezone: lead.timezone,
      courseId: course?.id ?? null,
      status: "trial",
      notes: [lead.preferredTime && `Preferred times: ${lead.preferredTime}`, lead.teacherPreference && `Teacher preference: ${lead.teacherPreference}`]
        .filter(Boolean)
        .join("\n"),
    })
    .returning({ id: students.id });

  const nextStatus = lead.status === "new" || lead.status === "contacted" ? "trial_scheduled" : lead.status;
  await db.update(leads).set({ studentId: student.id, status: nextStatus }).where(eq(leads.id, leadId));
  await logActivity(user, "created", "student", student.id, `Converted lead to student: ${lead.studentName || lead.parentName}`);

  refresh();
  redirect(`/admin/students/${student.id}`);
}

/* ───────── Classes ───────── */

export async function setClassStatus(classId: string, status: string) {
  const user = await requireAdmin();
  if (!(classStatuses as readonly string[]).includes(status)) return;
  const [row] = await db.select().from(classSessions).where(eq(classSessions.id, classId)).limit(1);
  if (!row) return;
  const patch: Partial<typeof classSessions.$inferInsert> = { status: status as (typeof classStatuses)[number] };
  if (RECOVERY_STATUSES.includes(status as (typeof RECOVERY_STATUSES)[number]) && !row.rescheduleDeadline) {
    patch.rescheduleDeadline = recoveryDeadline(row.startsAt);
  }
  await db.update(classSessions).set(patch).where(eq(classSessions.id, classId));
  await logActivity(user, "updated", "class", classId, `Class marked ${status.replace(/_/g, " ")}`);
  refresh();
}

export type RecurringState = { ok?: boolean; message?: string; errors?: Record<string, string> };

/** Creates weekly classes: the chosen weekdays at one time, for N weeks. */
export async function createRecurringClasses(_prev: RecurringState, formData: FormData): Promise<RecurringState> {
  const user = await requireAdmin();
  const { adminTimezone: tz } = await getRawSettings();

  const studentId = String(formData.get("studentId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "") || null;
  const courseId = String(formData.get("courseId") ?? "") || null;
  const startDate = String(formData.get("startDate") ?? "");
  const time = String(formData.get("time") ?? "");
  const weeks = Number(formData.get("weeks"));
  const durationMin = Number(formData.get("durationMin"));
  const meetingUrl = String(formData.get("meetingUrl") ?? "").trim();
  const days = formData.getAll("days").map(String).filter((d) => /^[0-6]$/.test(d)).map(Number); // 0 = Monday

  const errors: Record<string, string> = {};
  const [student] = studentId ? await db.select({ id: students.id }).from(students).where(eq(students.id, studentId)).limit(1) : [];
  if (!student) errors.studentId = "Choose a student";
  if (teacherId) {
    const [t] = await db.select({ id: teachers.id }).from(teachers).where(eq(teachers.id, teacherId)).limit(1);
    if (!t) errors.teacherId = "Choose a valid teacher";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) errors.startDate = "Choose a start date";
  if (!/^\d{2}:\d{2}$/.test(time)) errors.time = "Choose a time";
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 26) errors.weeks = "Enter 1 to 26 weeks";
  if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 240) errors.durationMin = "Enter 5 to 240 minutes";
  if (days.length === 0) errors.days = "Pick at least one day";
  if (meetingUrl && !/^https?:\/\/\S+$/i.test(meetingUrl)) errors.meetingUrl = "Enter a full link starting with https://";
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  const [y, m, d] = startDate.split("-").map(Number);
  const startDow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  const weekStart = addDays(startDate, -startDow);

  const rows: (typeof classSessions.$inferInsert)[] = [];
  for (let w = 0; w < weeks; w++) {
    for (const dow of [...days].sort()) {
      const day = addDays(weekStart, w * 7 + dow);
      if (day < startDate) continue;
      const startsAt = fromLocalInput(`${day}T${time}`, tz);
      if (startsAt) rows.push({ studentId, teacherId, courseId, startsAt, durationMin, meetingUrl, status: "scheduled" });
    }
  }
  if (rows.length === 0) return { message: "No classes would be created with those settings." };

  await db.insert(classSessions).values(rows);
  await logActivity(user, "created", "class", studentId, `Scheduled ${rows.length} recurring classes`);
  refresh();
  redirect(`/admin/classes?week=${startDate}&saved=1`);
}

/* ───────── Progress reports ───────── */

/** Locks a submitted report so the teacher can no longer edit it. */
export async function markReportReviewed(reportId: string) {
  const user = await requireAdmin();
  const [r] = await db.select().from(progressReports).where(eq(progressReports.id, reportId)).limit(1);
  if (!r) return;
  await db.update(progressReports).set({ status: "reviewed", reviewedAt: new Date(), reviewedBy: user.id }).where(eq(progressReports.id, reportId));
  await logActivity(user, "updated", "report", reportId, `Reviewed report for ${r.month}`);
  refresh();
}

/* ───────── Invoices ───────── */

export async function markInvoicePaid(invoiceId: string, formData: FormData) {
  const user = await requireAdmin();
  const { adminTimezone: tz } = await getRawSettings();
  const method = String(formData.get("method") ?? "");
  const reference = String(formData.get("reference") ?? "").trim().slice(0, 100);

  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv) return;
  await db
    .update(invoices)
    .set({
      status: "paid",
      paidOn: todayKey(tz),
      method: paymentMethods.some((p) => p.value === method) ? method : "",
      reference,
    })
    .where(eq(invoices.id, invoiceId));
  await logActivity(user, "updated", "invoice", invoiceId, `Marked ${inv.number} paid`);
  refresh();
}
