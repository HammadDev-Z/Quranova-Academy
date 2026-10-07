import Link from "next/link";
import { Icon } from "@/components/teacher/icons";
import { ChildAvatar, Hero, SCard, SubHeader, sBtnDark, sBtnMint } from "@/components/student/ui";
import { LessonsPicker } from "@/components/student/lessons-picker";
import { requireParent } from "@/lib/auth/session";
import { getChildren } from "@/lib/student/data";
import { lessonLinks } from "@/lib/student/format";

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  const parent = await requireParent();
  const kids = await getChildren(parent);

  return (
    <>
      <SubHeader eyebrow="Your family" title="Students" />

      <Hero className="mb-5 px-6 py-7 sm:px-8">
        <p className="text-xs font-extrabold text-emerald-100">Active profiles</p>
        <p className="mt-1 font-sans text-3xl font-extrabold">
          {kids.length} student{kids.length === 1 ? "" : "s"}
        </p>
        <p className="mt-2 text-sm text-emerald-100">Lessons, teachers and monthly attendance in one place.</p>
      </Hero>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kids.map((k) => (
          <SCard key={k.id} className="p-4">
            <div className="flex gap-4">
              <ChildAvatar name={k.name} className="h-20 w-20 text-2xl" />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-lg font-extrabold text-slate-900">{k.name}</p>
                <p className="text-xs text-slate-500">
                  {k.courseTitle ?? "No course yet"}
                  {k.teacherName ? ` · Teacher: ${k.teacherName}` : ""}
                </p>
                <p className="mt-3 text-xs font-extrabold text-slate-900">{k.basicPart || "Lessons not started"}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={k.taken} aria-valuemax={Math.max(k.due, 1)} aria-label={`${k.name} classes taken this month`}>
                  <div className="h-full rounded-full bg-green-600" style={{ width: `${k.due ? Math.round((k.taken / k.due) * 100) : 0}%` }} />
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-600">
                  {k.taken} of {k.due} Classes Taken
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <LessonsPicker studentName={k.name} options={lessonLinks(k)} className={sBtnDark + " w-full"} />
              <Link href={`/student/students/${k.id}`} className={sBtnMint + " w-full"}>
                Class History
              </Link>
            </div>
          </SCard>
        ))}

        {!parent.studentId && (
          <Link
            href="/student/students/new"
            className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-emerald-200 bg-white/60 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-50"
          >
            <Icon name="plus" className="h-6 w-6" />
            Add another child
          </Link>
        )}
      </div>

      <Link href="/student/certificates" className="mt-5 flex items-center justify-between rounded-3xl bg-white p-5 shadow-[0_6px_24px_-12px_rgba(15,60,45,0.25)] transition hover:bg-emerald-50">
        <span className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Icon name="award" className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-sans text-base font-extrabold text-slate-900">Certificates</span>
            <span className="text-sm text-slate-500">View and print achievements earned by your children</span>
          </span>
        </span>
        <Icon name="arrow-right" className="h-5 w-5 text-slate-400" />
      </Link>
    </>
  );
}
