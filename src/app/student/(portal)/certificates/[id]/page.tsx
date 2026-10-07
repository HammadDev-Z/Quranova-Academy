import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/student/print-button";
import { SubHeader } from "@/components/student/ui";
import { certificates, db, students } from "@/db";
import { formatDateOnly } from "@/lib/admin/time";
import { requireParent } from "@/lib/auth/session";
import { familyScope } from "@/lib/student/scope";

export const metadata = { title: "Certificate" };

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const parent = await requireParent();
  const { id } = await params;

  const [cert] = await db
    .select({ id: certificates.id, title: certificates.title, issuedOn: certificates.issuedOn, number: certificates.number, note: certificates.note, student: students.name })
    .from(certificates)
    .innerJoin(students, eq(students.id, certificates.studentId))
    .where(and(eq(certificates.id, id), familyScope(parent)))
    .limit(1);
  if (!cert) notFound();

  return (
    <>
      <div className="print:hidden">
        <SubHeader eyebrow="Certificate" title={cert.title} back="/student/certificates" />
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border-[10px] border-double border-amber-500/70 bg-white p-8 text-center shadow-[0_6px_24px_-12px_rgba(15,60,45,0.25)] sm:p-12 print:rounded-none print:shadow-none">
          <p lang="ar" dir="rtl" className="font-arabic text-3xl text-emerald-800">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.3em] text-amber-600">Quranova Academy</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-emerald-900 sm:text-5xl">Certificate of Achievement</h1>
          <p className="mt-8 text-slate-500">This certificate is proudly presented to</p>
          <p className="mt-3 border-b-2 border-amber-400/70 pb-3 font-serif text-4xl font-bold text-slate-900 sm:text-5xl">{cert.student}</p>
          <p className="mt-6 text-slate-500">in recognition of</p>
          <p className="mt-2 font-sans text-2xl font-extrabold text-emerald-800">{cert.title}</p>
          {cert.note && <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-slate-600">{cert.note}</p>}

          <div className="mt-12 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="border-t border-slate-300 pt-2 font-bold text-slate-900">{formatDateOnly(cert.issuedOn)}</p>
              <p className="text-xs text-slate-400">Date issued</p>
            </div>
            <div>
              <p className="border-t border-slate-300 pt-2 font-bold text-slate-900">Quranova Academy</p>
              <p className="text-xs text-slate-400">Certificate no. {cert.number}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-center">
          <PrintButton />
        </div>
      </div>
    </>
  );
}
