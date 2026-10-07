import { LEAVE_NOTICE_MINUTES } from "./constants";
import type { Child } from "./data";

/** Whether a family can still mark this class as on leave. Evaluate on the server at render time. */
export function canMarkLeave(status: string, startsAt: Date, nowMs: number): boolean {
  return status === "scheduled" && startsAt.getTime() >= nowMs + LEAVE_NOTICE_MINUTES * 60000;
}

export type LessonLink = { label: string; sub: string; href: string; icon: "book" | "layers" };

/** The courses a child can open lessons for. */
export function lessonLinks(child: Pick<Child, "id" | "courseId" | "courseTitle" | "basicPage" | "additionalCourseId" | "additionalTitle" | "additionalPage">): LessonLink[] {
  const out: LessonLink[] = [];
  if (child.courseId) {
    out.push({ label: "Basic Course", sub: `${child.courseTitle ?? "Course"} · Current page ${child.basicPage || 1}`, href: `/student/lessons/${child.id}/basic`, icon: "book" });
  }
  if (child.additionalCourseId) {
    out.push({
      label: "Additional Course",
      sub: `${child.additionalTitle ?? "Course"} · Current page ${child.additionalPage || 1}`,
      href: `/student/lessons/${child.id}/additional`,
      icon: "layers",
    });
  }
  return out;
}
