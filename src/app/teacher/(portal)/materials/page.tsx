import { desc } from "drizzle-orm";
import Link from "next/link";
import { db, materials } from "@/db";
import { Icon } from "@/components/teacher/icons";
import { PageTitle, TCard, btnSoft } from "@/components/teacher/ui";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "Learning Material" };

const typeLabel: Record<string, string> = { pdf: "PDF", png: "IMG", jpg: "IMG", jpeg: "IMG", mp3: "MP3", m4a: "AUDIO", mp4: "VIDEO" };
const typeTone: Record<string, string> = { pdf: "bg-rose-500", png: "bg-sky-500", jpg: "bg-sky-500", jpeg: "bg-sky-500", mp3: "bg-purple-500", m4a: "bg-purple-500", mp4: "bg-indigo-500" };

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  await requireTeacher();
  const { all } = await searchParams;
  const rows = await db.select().from(materials).orderBy(desc(materials.createdAt));
  const showAll = all === "1";
  const shown = showAll ? rows : rows.slice(0, 4);

  return (
    <>
      <PageTitle title="Learning Material" crumb="Downloads" />

      <TCard>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-sans text-2xl font-bold text-navy">Material Downloads</h2>
            <p className="mt-1 text-slate-400">
              Total {rows.length} file{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          {rows.length > 4 && (
            <Link href={showAll ? "/teacher/materials" : "/teacher/materials?all=1"} className={btnSoft}>
              {showAll ? "Show less" : "View All"}
            </Link>
          )}
        </div>

        {rows.length === 0 ? (
          <p className="py-10 text-center text-slate-400">Nothing has been shared yet. Check back soon.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="flex items-center gap-5">
                  <span
                    className={`flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-sm font-extrabold text-white ${typeTone[m.fileExt] ?? "bg-slate-500"}`}
                    aria-hidden
                  >
                    {typeLabel[m.fileExt] ?? m.fileExt.toUpperCase()}
                  </span>
                  <div>
                    <p className="font-sans text-xl font-bold text-navy">{m.title}</p>
                    <p className="text-slate-400">
                      {typeLabel[m.fileExt] ?? m.fileExt.toUpperCase()} File{m.category && m.category !== "General" ? ` · ${m.category}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-lg bg-rose-50 px-3 py-1 text-sm font-bold text-rose-500">{typeLabel[m.fileExt] ?? m.fileExt.toUpperCase()}</span>
                  <a
                    href={`/files/materials/${m.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${m.title}`}
                    aria-label={`Open ${m.title}`}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 transition hover:bg-green-200"
                  >
                    <Icon name="eye" className="h-6 w-6" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TCard>
    </>
  );
}
