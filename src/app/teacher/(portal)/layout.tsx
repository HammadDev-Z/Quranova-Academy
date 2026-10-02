import { and, count, eq, gt, inArray, lt } from "drizzle-orm";
import { TeacherShell } from "@/components/teacher/shell";
import { classSessions, db } from "@/db";
import { logoutTeacher } from "@/lib/auth/actions";
import { requireTeacher } from "@/lib/auth/session";
import { MAX_RESCHEDULES, RECOVERY_STATUSES } from "@/lib/teacher/constants";

export default async function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  const me = await requireTeacher();

  // Recovery classes still waiting to be rescheduled, shown as a badge on the tab.
  const [waiting] = await db
    .select({ n: count() })
    .from(classSessions)
    .where(
      and(
        eq(classSessions.teacherId, me.teacherId),
        inArray(classSessions.status, [...RECOVERY_STATUSES]),
        gt(classSessions.rescheduleDeadline, new Date()),
        lt(classSessions.rescheduleCount, MAX_RESCHEDULES),
      ),
    );

  return (
    <TeacherShell name={me.name} badges={{ "/teacher/reschedule": waiting.n }} logoutAction={logoutTeacher}>
      {children}
    </TeacherShell>
  );
}
