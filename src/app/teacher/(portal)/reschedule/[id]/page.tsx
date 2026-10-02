import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { classSessions, courses, db, students } from "@/db";
import { SlotPicker } from "@/components/teacher/forms";
import { PageTitle, StatusPill, TCard, btnGreen } from "@/components/teacher/ui";
import { addDays, formatDateShort, formatTime12, todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { MAX_RESCHEDULES, MIN_NOTICE_MINUTES, RECOVERY_STATUSES, RESCHEDULE_WINDOW_DAYS } from "@/lib/teacher/constants";
import { slotsForDay } from "@/lib/teacher/slots";

export const metadata = { title: "Reschedule class" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }> };

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function ReschedulePage({ params, searchParams }: Props) {
  const me = await requireTeacher();
  const { id } = await params;
  const sp = await searchParams;
  const tz = me.timezone;

  const [cls] = await db
    .select({
      id: classSessions.id,
      startsAt: classSessions.startsAt,
      durationMin: classSessions.durationMin,
      status: classSessions.status,
      rescheduleCount: classSessions.rescheduleCount,
      rescheduleDeadline: classSessions.rescheduleDeadline,
      studentId: students.id,
      studentName: students.name,
      studentTz: students.timezone,
      course: courses.title,
    })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .leftJoin(courses, eq(courses.id, classSessions.courseId))
    .where(and(eq(classSessions.id, id), eq(classSessions.teacherId, me.teacherId)))
    .limit(1);
  if (!cls) notFound();

  const nowMs = new Date().getTime();
  const recovery = (RECOVERY_STATUSES as readonly string[]).includes(cls.status);
  const advance = cls.status === "scheduled" && cls.startsAt.getTime() > nowMs + MIN_NOTICE_MINUTES * 60000;
  const deadline = cls.rescheduleDeadline ?? new Date(cls.startsAt.getTime() + RESCHEDULE_WINDOW_DAYS * DAY_MS);

  let blocked: string | null = null;
  if (!recovery && !advance) blocked = "This class can not be rescheduled in its current state.";
  else if (cls.rescheduleCount >= MAX_RESCHEDULES) blocked = `This class has already been rescheduled ${MAX_RESCHEDULES} times.`;
  else if (recovery && deadline.getTime() < nowMs) blocked = "The 30-day window for this class has ended.";

  const today = todayKey(tz);
  const maxDate = recovery ? addDays(today, Math.max(1, Math.ceil((deadline.getTime() - nowMs) / DAY_MS))) : addDays(today, 60);
  const requested = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : null;
  const date = requested && requested >= today && requested <= maxDate ? requested : advance ? todayKey(tz) : addDays(today, 1);

  const slots = blocked
    ? []
    : await slotsForDay(
        {
          teacherId: me.teacherId,
          teacherTz: tz,
          studentId: cls.studentId,
          studentTz: cls.studentTz,
          durationMin: cls.durationMin,
          excludeClassIds: [cls.id],
        },
        date,
      );

  return (
    <>
      <PageTitle title={recovery ? "Reschedule Class" : "Advance Reschedule"} crumb="Reschedules" />

      <TCard className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-sans text-xl font-extrabold uppercase text-navy">{cls.studentName}</p>
            <p className="mt-1 text-slate-500">
              {cls.course ?? "No course"} · currently {formatDateShort(cls.startsAt, tz)} at {formatTime12(cls.startsAt, tz)} ({cls.durationMin} min)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status={cls.status} />
            <span className="rounded-xl bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-600">
              Re {cls.rescheduleCount}/{MAX_RESCHEDULES}
            </span>
          </div>
        </div>
        {recovery && !blocked && <p className="mt-4 text-sm text-slate-500">Open until {formatDateShort(deadline, tz)}.</p>}
      </TCard>

      {blocked ? (
        <TCard>
          <p className="font-semibold text-rose-600">{blocked}</p>
          <Link href="/teacher/reschedule" className={btnGreen + " mt-5"}>
            Back to Reschedules
          </Link>
        </TCard>
      ) : (
        <TCard>
          <form action={`/teacher/reschedule/${cls.id}`} className="mb-7 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="date" className="mb-1.5 block text-sm font-semibold text-slate-600">
                Choose a day
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={date}
                min={today}
                max={maxDate}
                className="rounded-2xl border border-transparent bg-slate-100/80 px-5 py-3 text-lg text-slate-800 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <button type="submit" className={btnGreen + " py-3.5"}>
              Show slots
            </button>
          </form>
          <h2 className="mb-4 font-sans text-xl font-bold text-navy">Slots on {formatDateShort(new Date(slots[0]?.iso ?? cls.startsAt), tz)}</h2>
          <SlotPicker key={date} classId={cls.id} slots={slots} studentName={cls.studentName} />
        </TCard>
      )}
    </>
  );
}
