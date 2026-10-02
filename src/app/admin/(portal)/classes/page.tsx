import { and, asc, eq, gte, lt } from "drizzle-orm";
import Link from "next/link";
import { AdminPageHeader, Badge, EmptyState, Flash, linkButton, linkButtonOutline } from "@/components/admin/ui";
import { classSessions, courses, db, students, teachers } from "@/db";
import { addDays, dayKey, dayRange, formatDay, formatTimeOnly, startOfWeek, todayKey } from "@/lib/admin/time";
import { setClassStatus } from "@/lib/admin/workflow-actions";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

export const metadata = { title: "Class schedule" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function ClassesPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const { adminTimezone: tz } = await getRawSettings();

  const today = todayKey(tz);
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(sp.week ?? "") ? sp.week! : today;
  const weekStartKey = startOfWeek(anchor);
  const [from, to] = dayRange(weekStartKey, addDays(weekStartKey, 7), tz);

  const [teacherList, rows] = await Promise.all([
    db.select({ id: teachers.id, name: teachers.name }).from(teachers).orderBy(asc(teachers.name)),
    db
      .select({
        id: classSessions.id,
        startsAt: classSessions.startsAt,
        durationMin: classSessions.durationMin,
        status: classSessions.status,
        isTrial: classSessions.isTrial,
        meetingUrl: classSessions.meetingUrl,
        studentId: classSessions.studentId,
        teacherId: classSessions.teacherId,
        student: students.name,
        teacher: teachers.name,
        course: courses.title,
      })
      .from(classSessions)
      .leftJoin(students, eq(students.id, classSessions.studentId))
      .leftJoin(teachers, eq(teachers.id, classSessions.teacherId))
      .leftJoin(courses, eq(courses.id, classSessions.courseId))
      .where(and(gte(classSessions.startsAt, from), lt(classSessions.startsAt, to)))
      .orderBy(asc(classSessions.startsAt)),
  ]);

  const teacherFilter = teacherList.some((t) => t.id === sp.teacher) ? sp.teacher : undefined;
  const filtered = teacherFilter ? rows.filter((r) => r.teacherId === teacherFilter) : rows;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartKey, i));
  const byDay = new Map<string, typeof filtered>(days.map((d) => [d, []]));
  for (const r of filtered) byDay.get(dayKey(r.startsAt, tz))?.push(r);

  const link = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ week: weekStartKey, teacher: teacherFilter, ...over })) if (v) p.set(k, v);
    return `/admin/classes?${p.toString()}`;
  };

  const counts = {
    total: filtered.filter((r) => r.status !== "cancelled").length,
    done: filtered.filter((r) => r.status === "completed").length,
    missed: filtered.filter((r) => r.status.startsWith("missed")).length,
  };

  return (
    <>
      <AdminPageHeader
        title="Class schedule"
        description={`Times are shown in ${tz}. Change this in Site settings.`}
        actions={
          <>
            <Link href="/admin/classes/recurring" className={linkButtonOutline}>
              Weekly schedule
            </Link>
            <Link href="/admin/classes/new" className={linkButton}>
              + Add class
            </Link>
          </>
        }
      />
      <Flash saved={sp.saved} deleted={sp.deleted} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={link({ week: addDays(weekStartKey, -7) })} className={linkButtonOutline} aria-label="Previous week">
            ←
          </Link>
          <Link href={link({ week: startOfWeek(today) })} className={linkButtonOutline}>
            This week
          </Link>
          <Link href={link({ week: addDays(weekStartKey, 7) })} className={linkButtonOutline} aria-label="Next week">
            →
          </Link>
          <span className="ml-2 text-sm font-semibold text-brand-800">
            {formatDay(from, tz).replace(/^\w+ /, "")} – {formatDay(new Date(to.getTime() - 1), tz).replace(/^\w+ /, "")}
          </span>
        </div>
        <form action="/admin/classes" className="flex items-center gap-2">
          <input type="hidden" name="week" value={weekStartKey} />
          <select name="teacher" defaultValue={teacherFilter ?? ""} aria-label="Filter by teacher" className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm">
            <option value="">All teachers</option>
            {teacherList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Filter
          </button>
        </form>
      </div>

      <p className="mb-4 text-sm text-muted">
        {counts.total} class{counts.total === 1 ? "" : "es"} · {counts.done} completed · {counts.missed} missed
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="No classes this week">
          <Link href="/admin/classes/new" className="font-semibold text-brand-600 underline">
            Add a class
          </Link>{" "}
          or{" "}
          <Link href="/admin/classes/recurring" className="font-semibold text-brand-600 underline">
            set up a weekly schedule
          </Link>
          .
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {days.map((d) => {
            const items = byDay.get(d) ?? [];
            if (items.length === 0) return null;
            const when = fromKey(d, tz);
            return (
              <section key={d}>
                <h2 className={`mb-2 font-sans text-sm font-semibold uppercase tracking-wide ${d === today ? "text-gold-600" : "text-brand-800"}`}>
                  {formatDay(when, tz)}
                  {d === today && " · Today"}
                </h2>
                <ul className="divide-y divide-brand-100 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
                  {items.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-4">
                        <p className="w-28 flex-none font-serif text-lg font-bold text-brand-700">
                          {formatTimeOnly(c.startsAt, tz)}
                          <span className="block font-sans text-xs font-normal text-muted">{c.durationMin} min</span>
                        </p>
                        <div className="min-w-0">
                          <Link href={`/admin/classes/${c.id}`} className="block truncate font-semibold text-brand-800 hover:underline">
                            {c.student ?? "Unknown student"}
                          </Link>
                          <p className="truncate text-xs text-muted">
                            {c.teacher ? `with ${c.teacher}` : "No teacher assigned"}
                            {c.course ? ` · ${c.course}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {c.isTrial && <Badge value="trial" />}
                        <Badge value={c.status} />
                        {c.meetingUrl && (
                          <a href={c.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-600 hover:underline">
                            Join
                          </a>
                        )}
                        {c.status === "scheduled" && (
                          <>
                            <form action={setClassStatus.bind(null, c.id, "completed")}>
                              <button type="submit" className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 hover:bg-green-200">
                                Done
                              </button>
                            </form>
                            <form action={setClassStatus.bind(null, c.id, "missed_student")}>
                              <button type="submit" className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-200">
                                No-show
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

// Noon on the given local day, safely inside that day in any time zone.
function fromKey(key: string, tz: string) {
  return dayRange(key, addDays(key, 1), tz)[0];
}
