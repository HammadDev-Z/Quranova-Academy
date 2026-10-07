import Link from "next/link";
import { Icon } from "@/components/teacher/icons";
import { ClassStatusChip, ChildAvatar, DateBadge, Donut, Hero, LeaveNotice, SCard, StatTile, TimePair, sBtnMint, sBtnWhite } from "@/components/student/ui";
import { Countdown, JoinButton, LiveClock } from "@/components/student/live";
import { LeaveButton } from "@/components/student/leave-button";
import { LessonsPicker } from "@/components/student/lessons-picker";
import { formatDayShort, formatTimePadded } from "@/lib/admin/time-family";
import { requireParent } from "@/lib/auth/session";
import { DAY_MS } from "@/lib/constants";
import { JOIN_OPENS_MINUTES, UPCOMING_DAYS } from "@/lib/student/constants";
import { getChildren, getMonthSummary, getUpcoming } from "@/lib/student/data";
import { canMarkLeave, lessonLinks } from "@/lib/student/format";

export const metadata = { title: "Home" };

export default async function StudentHomePage({ searchParams }: { searchParams: Promise<{ leave?: string }> }) {
  const parent = await requireParent();
  const { leave } = await searchParams;
  const tz = parent.timezone;

  const [kids, upcoming, summary] = await Promise.all([getChildren(parent), getUpcoming(parent, UPCOMING_DAYS), getMonthSummary(parent)]);
  const next = upcoming.find((c) => c.status === "scheduled");
  const list = upcoming.slice(0, 5);
  const nowMs = new Date().getTime();

  const legend = [
    { label: "Completed", value: summary.completed, color: "#16a34a" },
    { label: "Remaining", value: summary.remaining, color: "#2bb5a8" },
    { label: "On Leave", value: summary.onLeave, color: "#facc15" },
    { label: "Absent", value: summary.absent, color: "#f97316" },
  ];
  const pct = (v: number) => (summary.total ? Math.round((v / summary.total) * 100) : 0);

  // Numbers for the tiles at the top.
  const thisWeek = upcoming.filter((c) => c.status === "scheduled" && c.startsAt.getTime() < nowMs + 7 * DAY_MS).length;
  const attended = summary.completed + summary.absent;
  const only = kids.length === 1 ? kids[0] : null;

  return (
    <>
      <header className="mb-6 lg:pr-56">
        <LiveClock tz={tz} className="text-[11px] font-semibold text-slate-500" />
        <h1 className="mt-1 font-sans text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Assalam-u-Alaikum, <span className="text-emerald-700">{parent.guardianName}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {thisWeek > 0 ? `You have ${thisWeek} class${thisWeek === 1 ? "" : "es"} coming up this week.` : "Welcome back to your dashboard."}
        </p>
      </header>

      <LeaveNotice result={leave} />

      <div className="stagger mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          icon="check"
          tone="emerald"
          label="This month"
          value={`${summary.completed} of ${summary.total}`}
          hint={`${summary.remaining} still to come`}
          progress={summary.total ? summary.completed / summary.total : 0}
        />
        <StatTile icon="calendar" tone="sky" label="This week" value={thisWeek} hint={thisWeek === 1 ? "class in the next 7 days" : "classes in the next 7 days"} />
        <StatTile
          icon="book"
          tone="violet"
          label="Current lesson"
          value={only ? only.basicPart || "Not started" : kids.length ? `${kids.length} students` : "None yet"}
          hint={only ? `${only.courseTitle ?? "No course yet"}${only.basicPage ? ` · page ${only.basicPage}` : ""}` : "Open Lessons on a student"}
        />
        <StatTile
          icon="award"
          tone="amber"
          label="Attendance"
          value={attended ? `${Math.round((summary.completed / attended) * 100)}%` : "No data"}
          hint={attended ? "of marked classes attended" : "Appears after the first class"}
          progress={attended ? summary.completed / attended : undefined}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Next class */}
        {next ? (
          <Hero className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-bold text-emerald-100">Next Class</p>
              <div className="text-right">
                <p className="flex items-center justify-end gap-2 text-sm font-bold">
                  <Icon name="calendar" className="h-4 w-4" />
                  {formatDayShort(next.startsAt, tz)}
                </p>
                <span className="mt-2 inline-block rounded-md bg-amber-300/25 px-2.5 py-1 text-xs font-bold text-amber-200">Upcoming</span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-5">
              <ChildAvatar name={next.studentName} className="h-20 w-20 text-2xl" />
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">Student</p>
                <p className="font-sans text-4xl font-extrabold leading-tight sm:text-5xl">{next.studentName}</p>
                <TimePair startsAt={next.startsAt} familyTz={tz} teacherTz={next.teacherTz} tone="light" className="mt-3" />
                {next.teacherName && (
                  <p className="mt-3 text-sm">
                    <span className="mr-2 text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">Teacher</span>
                    <span className="font-bold">{next.teacherName}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-800">
                <Icon name="clock" className="h-4 w-4 flex-none" />
                <Countdown
                  startsAt={next.startsAt.getTime()}
                  endsAt={next.startsAt.getTime() + next.durationMin * 60000}
                  absolute={`${formatDayShort(next.startsAt, tz)} at ${formatTimePadded(next.startsAt, tz)}`}
                />
              </div>
              {canMarkLeave(next.status, next.startsAt, nowMs) ? (
                <LeaveButton
                  classId={next.id}
                  returnTo="/student"
                  studentName={next.studentName}
                  when={`${formatDayShort(next.startsAt, tz)} at ${formatTimePadded(next.startsAt, tz)}`}
                  className={sBtnWhite + " w-full"}
                >
                  <Icon name="user-minus" className="h-4 w-4" /> Mark as On Leave
                </LeaveButton>
              ) : (
                <div className="flex items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-center text-xs font-bold text-emerald-100">Too close to start to mark as on leave</div>
              )}
            </div>
            <div className="mt-3">
              <JoinButton startsAt={next.startsAt.getTime()} endsAt={next.startsAt.getTime() + next.durationMin * 60000} url={next.meetingUrl} opensMinutes={JOIN_OPENS_MINUTES} />
            </div>
          </Hero>
        ) : (
          <Hero className="flex min-h-64 flex-col justify-center p-7">
            <p className="text-sm font-bold text-emerald-100">Next Class</p>
            <p className="mt-2 font-sans text-3xl font-extrabold">No upcoming classes</p>
            <p className="mt-2 max-w-md text-emerald-100">
              {kids.length === 0 ? "No students are linked to this account yet. Contact the academy and we will set it up." : "Your next class will appear here as soon as it is scheduled."}
            </p>
          </Hero>
        )}

        {/* Class summary */}
        <SCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-lg font-extrabold text-slate-900">Class Summary</h2>
            <span className="text-xs font-extrabold text-emerald-700">This Month</span>
          </div>
          <div className="@container">
            <div className="flex flex-col items-center gap-5 @[25rem]:flex-row @[25rem]:gap-6">
              <Donut segments={legend} total={summary.total} />
              {/* One grid per row: dot and label, then the count and the percentage in their own right-aligned columns. */}
              <ul className="w-full min-w-0 flex-1 space-y-3 text-sm tabular-nums">
                {legend.map((l) => (
                  <li key={l.label} className="grid grid-cols-[auto_1fr_1.75rem_3rem] items-center gap-x-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                    <span className="whitespace-nowrap text-slate-600">{l.label}</span>
                    <span className="text-right font-bold text-slate-900">{l.value}</span>
                    <span className="text-right text-slate-400">{pct(l.value)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SCard>

        {/* Students */}
        <SCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-lg font-extrabold text-slate-900">{kids.length === 1 ? "Student" : "Students"}</h2>
            {!parent.studentId && (
              <Link href="/student/students/new" className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 hover:underline">
                <Icon name="plus" className="h-3.5 w-3.5" /> Add New Student
              </Link>
            )}
          </div>
          {kids.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No students yet.</p>
          ) : (
            <ul className="space-y-3">
              {kids.map((k) => (
                <li key={k.id} className="rounded-2xl border border-slate-100 p-4 transition duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                  <div className="flex items-center gap-4">
                    <ChildAvatar name={k.name} className="h-14 w-14 flex-none text-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-base font-extrabold text-slate-900">{k.name}</p>
                      <p className="truncate text-xs text-slate-400">{[k.courseTitle ?? "No course yet", k.basicPart].filter(Boolean).join(" · ")}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={k.taken} aria-valuemax={Math.max(k.due, 1)} aria-label={`${k.name} classes taken`}>
                        <div className="h-full rounded-full bg-green-600 transition-all duration-700" style={{ width: `${k.due ? Math.round((k.taken / k.due) * 100) : 0}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        {k.taken} of {k.due} classes taken
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <LessonsPicker studentName={k.name} options={lessonLinks(k)} className={sBtnMint + " w-full px-3! py-2! text-xs"} />
                    <Link href={`/student/students/${k.id}`} className={sBtnMint + " w-full px-3! py-2! text-xs"}>
                      History
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SCard>

        {/* Upcoming classes */}
        <SCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-lg font-extrabold text-slate-900">Upcoming Classes</h2>
            <Link href="/student/classes" className="text-xs font-extrabold text-emerald-700 hover:underline">
              View All
            </Link>
          </div>
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Nothing scheduled in the next {UPCOMING_DAYS} days.</p>
          ) : (
            <ol className="space-y-3">
              {list.map((c) => (
                <li key={c.id} className="rounded-2xl border border-slate-100 p-3 transition duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                  <div className="flex items-start gap-3">
                    <DateBadge date={c.startsAt} tz={tz} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-slate-900">{c.studentName}</p>
                      <p className="text-xs text-slate-500">{[c.teacherName ? `with ${c.teacherName}` : null, c.courseTitle].filter(Boolean).join(" · ") || "Teacher to be confirmed"}</p>
                      <TimePair startsAt={c.startsAt} familyTz={tz} teacherTz={c.teacherTz} className="mt-2" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <ClassStatusChip status={c.status} />
                    {canMarkLeave(c.status, c.startsAt, nowMs) && (
                      <LeaveButton
                        classId={c.id}
                        returnTo="/student"
                        studentName={c.studentName}
                        when={`${formatDayShort(c.startsAt, tz)} at ${formatTimePadded(c.startsAt, tz)}`}
                        className="rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-extrabold text-emerald-800 transition hover:bg-emerald-100"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SCard>
      </div>
    </>
  );
}
