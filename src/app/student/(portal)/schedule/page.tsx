import Link from "next/link";
import { ChildAvatar, Hero, SubHeader } from "@/components/student/ui";
import { addDays, dayRange, startOfWeek, todayKey, weekdayAndMinutes } from "@/lib/admin/time";
import { formatTimePadded } from "@/lib/admin/time-family";
import { requireParent } from "@/lib/auth/session";
import { getClassRows } from "@/lib/student/data";

export const metadata = { title: "Schedule" };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Slot = { key: string; studentName: string; teacherName: string | null; minutes: number; time: string };

export default async function SchedulePage() {
  const parent = await requireParent();
  const tz = parent.timezone;
  const today = todayKey(tz);

  // The weekly pattern is read from the next four weeks of real classes, so it always matches the calendar.
  const [from] = dayRange(startOfWeek(today), addDays(startOfWeek(today), 1), tz);
  const [, to] = dayRange(addDays(today, 28), addDays(today, 29), tz);
  const rows = (await getClassRows(parent, from, to)).filter((r) => r.status !== "cancelled");

  const byDay: Slot[][] = DAYS.map(() => []);
  const seen = new Set<string>();
  for (const r of rows) {
    const { weekday, minutes } = weekdayAndMinutes(r.startsAt, tz);
    const key = `${r.studentId}-${weekday}-${minutes}`;
    if (seen.has(key)) continue;
    seen.add(key);
    byDay[weekday].push({ key, studentName: r.studentName, teacherName: r.teacherName, minutes, time: formatTimePadded(r.startsAt, tz) });
  }
  byDay.forEach((d) => d.sort((a, b) => a.minutes - b.minutes));
  const total = byDay.reduce((n, d) => n + d.length, 0);
  const todayIndex = weekdayAndMinutes(new Date(), tz).weekday;

  return (
    <>
      <SubHeader eyebrow="Weekly timetable" title="Schedule" />

      <Hero className="mb-5 flex flex-wrap items-center justify-between gap-4 px-6 py-7 sm:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-extrabold text-emerald-100">Monday to Sunday</p>
          <p className="mt-1 font-sans text-3xl font-extrabold">Weekly class schedule</p>
          <p className="mt-2 text-sm text-emerald-100">
            {total} recurring class{total === 1 ? "" : "es"} · Times are shown in your time zone ({tz}).
          </p>
        </div>
        <Link href="/student/classes" className="rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-extrabold transition hover:bg-white/25">
          Upcoming classes
        </Link>
      </Hero>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DAYS.map((day, i) => (
          <section
            key={day}
            className={`rounded-3xl bg-white p-5 shadow-[0_6px_24px_-12px_rgba(15,60,45,0.25)] ${i === todayIndex ? "ring-2 ring-emerald-600" : ""}`}
          >
            <header className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{i === todayIndex ? "Today" : "Weekly"}</p>
                <h2 className="font-sans text-xl font-extrabold text-slate-900">{day}</h2>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-extrabold text-emerald-700">{byDay[i].length}</span>
            </header>
            {byDay[i].length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No classes</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {byDay[i].map((s) => (
                  <li key={s.key} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5">
                    <ChildAvatar name={s.studentName} className="h-10 w-10 text-sm ring-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-900">{s.studentName}</p>
                      {s.teacherName && <p className="truncate text-xs text-slate-500">with {s.teacherName}</p>}
                    </div>
                    <span className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-extrabold text-emerald-800">{s.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
