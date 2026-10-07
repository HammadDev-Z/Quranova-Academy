import "server-only";
import { and, asc, eq, gte, inArray, lt, notInArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { certificates, classReschedules, classSessions, courses, db, progressReports, students, teachers } from "@/db";
import { DAY_MS } from "@/lib/constants";
import { fromLocalInput } from "@/lib/admin/time";
import { formatDayShort, formatTimePadded, monthOf } from "@/lib/admin/time-family";
import type { CurrentParent } from "@/lib/auth/session";
import { familyScope } from "./scope";

export type Child = Awaited<ReturnType<typeof getChildren>>[number];

function nextMonthKey(month: string) {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** [start, end) instants of a YYYY-MM month in tz. */
export function monthRange(month: string, tz: string): [Date, Date] {
  return [fromLocalInput(`${month}-01T00:00`, tz)!, fromLocalInput(`${nextMonthKey(month)}-01T00:00`, tz)!];
}

/** The family's children, each with course titles, teacher and this month's attendance. */
export async function getChildren(parent: CurrentParent) {
  const additional = alias(courses, "additional_course");
  const kids = await db
    .select({
      id: students.id,
      name: students.name,
      age: students.age,
      status: students.status,
      studentNo: students.studentNo,
      courseId: students.courseId,
      additionalCourseId: students.additionalCourseId,
      basicPart: students.basicPart,
      basicPage: students.basicPage,
      additionalPart: students.additionalPart,
      additionalPage: students.additionalPage,
      courseTitle: courses.title,
      additionalTitle: additional.title,
      teacherName: teachers.name,
    })
    .from(students)
    .leftJoin(courses, eq(courses.id, students.courseId))
    .leftJoin(additional, eq(additional.id, students.additionalCourseId))
    .leftJoin(teachers, eq(teachers.id, students.teacherId))
    .where(and(familyScope(parent), notInArray(students.status, ["left"])))
    .orderBy(asc(students.name));

  if (kids.length === 0) return [];

  const [from, to] = monthRange(monthOf(new Date(), parent.timezone), parent.timezone);
  const rows = await db
    .select({ studentId: classSessions.studentId, status: classSessions.status, startsAt: classSessions.startsAt })
    .from(classSessions)
    .where(and(inArray(classSessions.studentId, kids.map((k) => k.id)), gte(classSessions.startsAt, from), lt(classSessions.startsAt, to)));

  const now = new Date();
  return kids.map((k) => {
    const mine = rows.filter((r) => r.studentId === k.id && r.status !== "cancelled");
    const due = mine.filter((r) => r.startsAt <= now).length;
    const taken = mine.filter((r) => r.status === "completed").length;
    return { ...k, due, taken };
  });
}

/** Classes in [from, to) for any of the family's children. */
export async function getClassRows(parent: CurrentParent, from: Date, to: Date) {
  return db
    .select({
      id: classSessions.id,
      startsAt: classSessions.startsAt,
      durationMin: classSessions.durationMin,
      status: classSessions.status,
      isTrial: classSessions.isTrial,
      meetingUrl: classSessions.meetingUrl,
      lessonNotes: classSessions.lessonNotes,
      homework: classSessions.homework,
      studentId: students.id,
      studentName: students.name,
      teacherName: teachers.name,
      teacherTz: teachers.timezone,
      courseTitle: courses.title,
    })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .leftJoin(teachers, eq(teachers.id, classSessions.teacherId))
    .leftJoin(courses, eq(courses.id, classSessions.courseId))
    .where(and(familyScope(parent), gte(classSessions.startsAt, from), lt(classSessions.startsAt, to)))
    .orderBy(asc(classSessions.startsAt));
}

/** Upcoming classes that are still on the calendar (not completed or cancelled). */
export async function getUpcoming(parent: CurrentParent, days: number) {
  const nowMs = new Date().getTime();
  const from = new Date(nowMs - 3 * 60 * 60 * 1000); // keep a class visible while it is running
  const rows = await getClassRows(parent, from, new Date(nowMs + days * DAY_MS));
  return rows.filter((r) => r.status !== "completed" && r.status !== "cancelled" && r.startsAt.getTime() + r.durationMin * 60000 >= nowMs);
}

export type Summary = { total: number; completed: number; remaining: number; onLeave: number; absent: number };

export async function getMonthSummary(parent: CurrentParent): Promise<Summary> {
  const [from, to] = monthRange(monthOf(new Date(), parent.timezone), parent.timezone);
  const rows = (await getClassRows(parent, from, to)).filter((r) => r.status !== "cancelled");
  return {
    total: rows.length,
    completed: rows.filter((r) => r.status === "completed").length,
    remaining: rows.filter((r) => r.status === "scheduled").length,
    onLeave: rows.filter((r) => r.status === "student_leave" || r.status === "teacher_leave").length,
    absent: rows.filter((r) => r.status === "missed_student" || r.status === "missed_teacher").length,
  };
}

export type Notice = { id: string; text: string; at: Date; href: string };

/** Recent things the family should know about, derived from what already happened. */
export async function getNotices(parent: CurrentParent): Promise<{ items: Notice[]; unread: number }> {
  const since = new Date(new Date().getTime() - 14 * DAY_MS);
  const tz = parent.timezone;
  const mine = familyScope(parent);

  const [moved, certs, reports, teacherLeave] = await Promise.all([
    db
      .select({ id: classReschedules.id, at: classReschedules.createdAt, to: classReschedules.newStartsAt, kind: classReschedules.kind, student: students.name })
      .from(classReschedules)
      .innerJoin(classSessions, eq(classSessions.id, classReschedules.classId))
      .innerJoin(students, eq(students.id, classSessions.studentId))
      .where(and(mine, gte(classReschedules.createdAt, since))),
    db
      .select({ id: certificates.id, at: certificates.createdAt, title: certificates.title, student: students.name })
      .from(certificates)
      .innerJoin(students, eq(students.id, certificates.studentId))
      .where(and(mine, gte(certificates.createdAt, since))),
    db
      .select({ id: progressReports.id, at: progressReports.reviewedAt, month: progressReports.month, student: students.name, studentId: students.id })
      .from(progressReports)
      .innerJoin(students, eq(students.id, progressReports.studentId))
      .where(and(mine, eq(progressReports.status, "reviewed"), gte(progressReports.reviewedAt, since))),
    db
      .select({ id: classSessions.id, at: classSessions.updatedAt, startsAt: classSessions.startsAt, student: students.name })
      .from(classSessions)
      .innerJoin(students, eq(students.id, classSessions.studentId))
      .where(and(mine, eq(classSessions.status, "teacher_leave"), gte(classSessions.updatedAt, since), gte(classSessions.startsAt, new Date()))),
  ]);

  const items: Notice[] = [
    ...moved
      .filter((m) => m.kind !== "swap")
      .map((m) => ({
        id: `m-${m.id}`,
        at: m.at,
        href: "/student/classes",
        text: `${m.student}'s class was moved to ${formatDayShort(m.to, tz)} at ${formatTimePadded(m.to, tz)}.`,
      })),
    ...certs.map((c) => ({ id: `c-${c.id}`, at: c.at, href: `/student/certificates/${c.id}`, text: `${c.student} received a certificate: ${c.title}.` })),
    ...reports.map((r) => ({ id: `r-${r.id}`, at: r.at ?? since, href: `/student/students/${r.studentId}`, text: `${r.student}'s progress report for ${r.month} is ready.` })),
    ...teacherLeave.map((t) => ({
      id: `t-${t.id}`,
      at: t.at,
      href: "/student/classes",
      text: `The teacher is on leave for ${t.student}'s class on ${formatDayShort(t.startsAt, tz)}. It will be rescheduled.`,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const seen = parent.notificationsSeenAt;
  const unread = items.filter((i) => !seen || i.at > seen).length;
  return { items: items.slice(0, 12), unread };
}
