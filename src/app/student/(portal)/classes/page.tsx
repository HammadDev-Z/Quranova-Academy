import { ClassStatusChip, DateBadge, Hero, LeaveNotice, SCard, SubHeader, TimePair } from "@/components/student/ui";
import { JoinButton } from "@/components/student/live";
import { LeaveButton } from "@/components/student/leave-button";
import { formatDayListYear, formatDayShort, formatTimePadded } from "@/lib/admin/time-family";
import { requireParent } from "@/lib/auth/session";
import { JOIN_OPENS_MINUTES, UPCOMING_DAYS } from "@/lib/student/constants";
import { getUpcoming } from "@/lib/student/data";
import { canMarkLeave } from "@/lib/student/format";

export const metadata = { title: "Classes" };

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ leave?: string }> }) {
  const parent = await requireParent();
  const { leave } = await searchParams;
  const tz = parent.timezone;

  const upcoming = await getUpcoming(parent, UPCOMING_DAYS);
  const nowMs = new Date().getTime();
  const active = upcoming.filter((c) => c.status === "scheduled").length;

  return (
    <>
      <SubHeader eyebrow="Upcoming schedule" title="Classes" />

      <Hero className="mb-5 px-6 py-7 sm:px-8">
        <p className="text-xs font-extrabold text-emerald-100">Next {UPCOMING_DAYS} days</p>
        <p className="mt-1 font-sans text-3xl font-extrabold">{active} upcoming</p>
        <p className="mt-2 text-sm text-emerald-100">Your time and Teacher Time are both shown below.</p>
      </Hero>

      <LeaveNotice result={leave} />

      {upcoming.length === 0 ? (
        <SCard className="py-12 text-center">
          <p className="font-sans text-xl font-extrabold text-slate-900">No upcoming classes</p>
          <p className="mt-1 text-slate-500">New classes appear here as soon as they are scheduled.</p>
        </SCard>
      ) : (
        <div className="stagger space-y-4">
          {upcoming.map((c) => {
            const endsAt = c.startsAt.getTime() + c.durationMin * 60000;
            return (
              <SCard key={c.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-4">
                    <DateBadge date={c.startsAt} tz={tz} className="h-[4.5rem] w-16" />
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-500">{formatDayListYear(c.startsAt, tz)}</p>
                      <h2 className="mt-0.5 font-sans text-xl font-extrabold text-slate-900">{c.studentName}</h2>
                      <p className="text-sm text-slate-500">
                        {c.teacherName ? `Teacher: ${c.teacherName}` : "Teacher to be confirmed"}
                        {c.courseTitle ? ` · ${c.courseTitle}` : ""}
                      </p>
                      <TimePair startsAt={c.startsAt} familyTz={tz} teacherTz={c.teacherTz} className="mt-2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.isTrial && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Trial</span>}
                    <ClassStatusChip status={c.status} />
                  </div>
                </div>

                {c.status === "scheduled" ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <JoinButton startsAt={c.startsAt.getTime()} endsAt={endsAt} url={c.meetingUrl} opensMinutes={JOIN_OPENS_MINUTES} />
                    {canMarkLeave(c.status, c.startsAt, nowMs) ? (
                      <LeaveButton
                        classId={c.id}
                        returnTo="/student/classes"
                        studentName={c.studentName}
                        when={`${formatDayShort(c.startsAt, tz)} at ${formatTimePadded(c.startsAt, tz)}`}
                        className="w-full rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-100"
                      />
                    ) : (
                      <p className="flex items-center justify-center rounded-2xl bg-slate-50 px-5 py-3 text-center text-xs font-bold text-slate-400">Too close to start to mark as on leave</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-slate-50 px-5 py-3 text-sm text-slate-500">
                    {c.status === "student_leave" || c.status === "teacher_leave" || c.status === "missed_teacher"
                      ? "Your teacher will arrange a make-up class and you will see it here."
                      : "This class has been recorded."}
                  </p>
                )}
              </SCard>
            );
          })}
        </div>
      )}
    </>
  );
}
