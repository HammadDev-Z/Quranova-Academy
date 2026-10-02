import { and, asc, eq, gte, lt } from "drizzle-orm";
import Link from "next/link";
import { AdminPageHeader, Badge, EmptyState, Flash, linkButtonOutline } from "@/components/admin/ui";
import { classSessions, courses, db, students } from "@/db";
import { addDays, dayKey, dayRange, formatDay, formatTimeOnly, startOfWeek, todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";
import { markClassStatus } from "@/lib/teacher/actions";

export const metadata = { title: "My classes" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function TeacherClassesPage({ searchParams }: Props) {
  const me = await requireTeacher();
  const sp = await searchParams;
  const { adminTimezone: tz } = await getRawSettings();

  const today = todayKey(tz);
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(sp.week ?? "") ? sp.week! : today;
  const weekStartKey = startOfWeek(anchor);
  const [from, to] = dayRange(weekStartKey, addDays(weekStartKey, 7), tz);

  const rows = await db
    .select({
      id: classSessions.id,
      startsAt: classSessions.startsAt,
      durationMin: classSessions.durationMin,
      status: classSessions.status,
      isTrial: classSessions.isTrial,
      meetingUrl: classSessions.meetingUrl,
      student: students.name,
      course: courses.title,
    })
    .from(classSessions)
    .innerJoin(students, eq(students.id, classSessions.studentId))
    .leftJoin(courses, eq(courses.id, classSessions.courseId))
    .where(and(eq(classSessions.teacherId, me.teacherId), gte(classSessions.startsAt, from), lt(classSessions.startsAt, to)))
    .orderBy(asc(classSessions.startsAt));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartKey, i));
  const byDay = new Map<string, typeof rows>(days.map((d) => [d, []]));
  for (const r of rows) byDay.get(dayKey(r.startsAt, tz))?.push(r);

  const link = (over: Record<string, string>) => {
    const p = new URLSearchParams({ week: weekStartKey, ...over });
    return `/teacher/classes?${p.toString()}`;
  };
  const fromKey = (key: string) => dayRange(key, addDays(key, 1), tz)[0];

  return (
    <>
      <AdminPageHeader title="My classes" description={`Times are shown in ${tz}.`} />
      <Flash saved={sp.saved} />

      <div className="mb-5 flex flex-wrap items-center gap-2">
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

      {rows.length === 0 ? (
        <EmptyState title="No classes this week" />
      ) : (
        <div className="space-y-5">
          {days.map((d) => {
            const items = byDay.get(d) ?? [];
            if (items.length === 0) return null;
            const when = fromKey(d);
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
                          <p className="truncate font-semibold text-brand-800">{c.student}</p>
                          <p className="truncate text-xs text-muted">{c.course ?? "No course set"}</p>
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
                            <form action={markClassStatus.bind(null, c.id, "completed")}>
                              <button type="submit" className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 hover:bg-green-200">
                                Done
                              </button>
                            </form>
                            <form action={markClassStatus.bind(null, c.id, "missed_student")}>
                              <button type="submit" className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200">
                                Student didn&apos;t attend
                              </button>
                            </form>
                            <form action={markClassStatus.bind(null, c.id, "missed_teacher")}>
                              <button type="submit" className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-200">
                                I need leave
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
