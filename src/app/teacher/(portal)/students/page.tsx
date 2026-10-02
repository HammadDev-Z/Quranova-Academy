import { and, asc, eq, gte, inArray, like, notInArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import Link from "next/link";
import { classSessions, courses, db, guardians, students } from "@/db";
import { Icon } from "@/components/teacher/icons";
import { IconCircle, PageTitle, TCard } from "@/components/teacher/ui";
import { cn } from "@/components/ui";
import { addDays, dayRange, shiftOf, todayKey } from "@/lib/admin/time";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "Student List" };

type Props = { searchParams: Promise<{ q?: string; shift?: string }> };

const shiftTone: Record<string, string> = {
  Morning: "bg-amber-400 text-amber-950",
  Afternoon: "bg-sky-500 text-white",
  Evening: "bg-rose-500 text-white",
  Night: "bg-indigo-600 text-white",
};

export default async function StudentListPage({ searchParams }: Props) {
  const me = await requireTeacher();
  const sp = await searchParams;
  const tz = me.timezone;
  const q = (sp.q ?? "").trim().slice(0, 100);

  const additional = alias(courses, "additional_course");
  const mine = eq(students.teacherId, me.teacherId);

  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      age: students.age,
      status: students.status,
      basicPart: students.basicPart,
      basicPage: students.basicPage,
      additionalPart: students.additionalPart,
      additionalPage: students.additionalPage,
      parent: guardians.name,
      basicCourse: courses.title,
      additionalCourse: additional.title,
    })
    .from(students)
    .leftJoin(courses, eq(courses.id, students.courseId))
    .leftJoin(additional, eq(additional.id, students.additionalCourseId))
    .leftJoin(guardians, eq(guardians.id, students.guardianId))
    .where(q ? and(mine, notInArray(students.status, ["left"]), like(students.name, `%${q}%`)) : and(mine, notInArray(students.status, ["left"])))
    .orderBy(asc(students.name));

  const ids = rows.map((r) => r.id);
  const [dayStart] = dayRange(todayKey(tz), addDays(todayKey(tz), 1), tz);
  const [upcoming, recentDone] = ids.length
    ? await Promise.all([
        db
          .select({ studentId: classSessions.studentId, startsAt: classSessions.startsAt })
          .from(classSessions)
          .where(and(eq(classSessions.teacherId, me.teacherId), eq(classSessions.status, "scheduled"), gte(classSessions.startsAt, dayStart), inArray(classSessions.studentId, ids)))
          .orderBy(asc(classSessions.startsAt)),
        db
          .select({ studentId: classSessions.studentId })
          .from(classSessions)
          .where(
            and(
              eq(classSessions.teacherId, me.teacherId),
              eq(classSessions.status, "completed"),
              eq(classSessions.lessonNotes, ""),
              gte(classSessions.startsAt, new Date(dayStart.getTime() - 30 * 24 * 60 * 60 * 1000)),
              inArray(classSessions.studentId, ids),
            ),
          ),
      ])
    : [[], []];

  const nextByStudent = new Map<string, Date>();
  for (const u of upcoming) if (!nextByStudent.has(u.studentId)) nextByStudent.set(u.studentId, u.startsAt);
  const needNotes = new Map<string, number>();
  for (const r of recentDone) needNotes.set(r.studentId, (needNotes.get(r.studentId) ?? 0) + 1);

  const withShift = rows.map((r) => {
    const next = nextByStudent.get(r.id);
    return { ...r, shift: next ? shiftOf(next, tz) : null };
  });
  const shifts = [...new Set(withShift.map((r) => r.shift).filter((s): s is NonNullable<typeof s> => !!s))];
  const shown = sp.shift && shifts.includes(sp.shift as (typeof shifts)[number]) ? withShift.filter((r) => r.shift === sp.shift) : withShift;

  const chip = (label: string, value: string | null) => {
    const active = (sp.shift ?? null) === value;
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value) params.set("shift", value);
    return (
      <Link
        key={label}
        href={`/teacher/students${params.size ? `?${params}` : ""}`}
        className={cn("rounded-xl px-6 py-3 text-lg font-semibold transition", active ? "bg-green-500 text-white" : "bg-green-100 text-green-600 hover:bg-green-200")}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <PageTitle title="Student List" />

      <TCard>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <form action="/teacher/students" className="relative w-full max-w-sm">
            {sp.shift && <input type="hidden" name="shift" value={sp.shift} />}
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search students"
              aria-label="Search students"
              className="w-full rounded-2xl border border-transparent bg-slate-100/80 py-3.5 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </form>
          <div className="flex flex-wrap gap-2">
            {chip("All", null)}
            {shifts.map((s) => chip(s, s))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-3 py-4">Student</th>
                <th scope="col" className="px-3 py-4">Shift</th>
                <th scope="col" className="px-3 py-4">Basic course</th>
                <th scope="col" className="px-3 py-4">Additional course</th>
                <th scope="col" className="px-3 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-14 text-center text-slate-400">
                    {q || sp.shift ? "No students match." : "No students are assigned to you yet."}
                  </td>
                </tr>
              )}
              {shown.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 align-middle">
                  <td className="relative py-5 pl-5 pr-3">
                    <span className="absolute inset-y-4 left-0 w-1 rounded-full bg-rose-500" aria-hidden />
                    <div className="flex items-center gap-3">
                      <Icon name="user" className="h-6 w-6 flex-none text-rose-500" />
                      <div>
                        <Link href={`/teacher/students/${s.id}`} className="font-sans text-lg font-bold uppercase text-navy hover:underline">
                          {s.name}
                        </Link>
                        <p className="flex flex-wrap items-center gap-2 text-slate-500">
                          {s.parent ?? "No parent on file"}
                          {s.age ? <span className="rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-bold text-white">🎂 {s.age} yrs</span> : null}
                          {s.status === "trial" && <span className="rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">Trial</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-5">
                    {s.shift ? <span className={cn("inline-block rounded-xl px-5 py-2.5 text-sm font-bold", shiftTone[s.shift])}>{s.shift}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-5">
                    <CourseCell title={s.basicCourse} part={s.basicPart} page={s.basicPage} />
                  </td>
                  <td className="px-3 py-5">
                    <CourseCell title={s.additionalCourse} part={s.additionalPart} page={s.additionalPage} />
                  </td>
                  <td className="px-3 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <IconCircle href={`/teacher/students/${s.id}#history`} label="Class history" icon="clock" tone="bg-green-500" />
                      <IconCircle href={`/teacher/students/${s.id}#reports`} label="Progress reports" icon="document" tone="bg-blue-500" />
                      <IconCircle href={`/teacher/students/${s.id}#schedule`} label="Upcoming schedule" icon="calendar" tone="bg-purple-500" />
                      <IconCircle href={`/teacher/students/${s.id}#progress`} label="Update progress" icon="chart" tone="bg-amber-400" />
                      <IconCircle href={`/teacher/students/${s.id}#notes`} label="Lesson notes" icon="notes" tone="bg-violet-500" badge={needNotes.get(s.id)} />
                      <IconCircle href={`/teacher/students/${s.id}`} label="Student profile" icon="eye" tone="bg-slate-800" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TCard>
    </>
  );
}

function CourseCell({ title, part, page }: { title: string | null; part: string; page: number }) {
  if (!title) return <span className="text-slate-300">—</span>;
  return (
    <div>
      <p className="font-sans text-lg font-bold text-navy">{title}</p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-slate-500">
        {part || "No part set"}
        {page > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700">
            <Icon name="document" className="h-3.5 w-3.5" />
            Page {page}
          </span>
        )}
      </p>
    </div>
  );
}
