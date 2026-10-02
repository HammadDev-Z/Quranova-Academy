import { and, asc, eq, gte, lt, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { classSessions, db, students } from "@/db";
import { SwapForm } from "@/components/teacher/forms";
import { PageTitle, TCard } from "@/components/teacher/ui";
import { addDays, dayRange, formatDateShort, formatTime12, todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { MIN_NOTICE_MINUTES } from "@/lib/teacher/constants";

export const metadata = { title: "Swap classes" };

export default async function SwapPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireTeacher();
  const { id } = await params;
  const tz = me.timezone;

  const [cls] = await db
    .select({ id: classSessions.id, startsAt: classSessions.startsAt, status: classSessions.status, studentName: students.name })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .where(and(eq(classSessions.id, id), eq(classSessions.teacherId, me.teacherId)))
    .limit(1);
  if (!cls || cls.status !== "scheduled") notFound();

  const soon = new Date(new Date().getTime() + MIN_NOTICE_MINUTES * 60000);
  const [, end] = dayRange(todayKey(tz), addDays(todayKey(tz), 14), tz);
  const others = await db
    .select({ id: classSessions.id, startsAt: classSessions.startsAt, studentName: students.name })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .where(
      and(
        eq(classSessions.teacherId, me.teacherId),
        eq(classSessions.status, "scheduled"),
        ne(classSessions.id, id),
        gte(classSessions.startsAt, soon),
        lt(classSessions.startsAt, end),
      ),
    )
    .orderBy(asc(classSessions.startsAt));

  return (
    <>
      <PageTitle title="Swap Classes" crumb="Daily Classes" subtitle={`Swap ${cls.studentName}'s ${formatTime12(cls.startsAt, tz)} class on ${formatDateShort(cls.startsAt, tz)} with another upcoming class. The two students exchange times.`} />
      <TCard>
        {others.length === 0 ? (
          <p className="text-slate-400">You have no other upcoming classes in the next 14 days to swap with.</p>
        ) : (
          <SwapForm
            classId={cls.id}
            options={others.map((o) => ({
              id: o.id,
              label: o.studentName,
              sub: `${formatDateShort(o.startsAt, tz)} at ${formatTime12(o.startsAt, tz)}`,
            }))}
          />
        )}
      </TCard>
    </>
  );
}
