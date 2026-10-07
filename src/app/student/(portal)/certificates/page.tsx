import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Icon } from "@/components/teacher/icons";
import { Hero, SCard, SubHeader } from "@/components/student/ui";
import { certificates, db, students } from "@/db";
import { formatDateOnly } from "@/lib/admin/time";
import { requireParent } from "@/lib/auth/session";
import { familyScope } from "@/lib/student/scope";

export const metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const parent = await requireParent();
  const rows = await db
    .select({ id: certificates.id, title: certificates.title, issuedOn: certificates.issuedOn, number: certificates.number, student: students.name })
    .from(certificates)
    .innerJoin(students, eq(students.id, certificates.studentId))
    .where(familyScope(parent))
    .orderBy(desc(certificates.issuedOn));

  return (
    <>
      <SubHeader eyebrow="Achievements" title="Certificates" />

      <Hero className="mb-5 px-6 py-7 sm:px-8">
        <p className="text-xs font-extrabold text-emerald-100">Earned so far</p>
        <p className="mt-1 font-sans text-3xl font-extrabold">
          {rows.length} certificate{rows.length === 1 ? "" : "s"}
        </p>
        <p className="mt-2 text-sm text-emerald-100">Open one to view it, print it or save it as a PDF.</p>
      </Hero>

      {rows.length === 0 ? (
        <SCard className="py-12 text-center">
          <p className="font-sans text-xl font-extrabold text-slate-900">No certificates yet</p>
          <p className="mt-1 text-slate-500">When your child completes a course or reaches a milestone, the academy will issue a certificate and it will appear here.</p>
        </SCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <Link key={c.id} href={`/student/certificates/${c.id}`} className="group rounded-3xl bg-white p-5 shadow-[0_6px_24px_-12px_rgba(15,60,45,0.25)] transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Icon name="award" className="h-6 w-6" />
              </span>
              <p className="mt-4 font-sans text-lg font-extrabold text-slate-900">{c.title}</p>
              <p className="text-sm text-slate-500">{c.student}</p>
              <p className="mt-3 flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{formatDateOnly(c.issuedOn)}</span>
                <span className="text-emerald-700 group-hover:underline">View certificate</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
