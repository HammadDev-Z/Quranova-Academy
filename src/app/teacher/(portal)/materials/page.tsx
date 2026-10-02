import { asc, desc } from "drizzle-orm";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/ui";
import { db, materials } from "@/db";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "Learning materials" };

const icon: Record<string, string> = { pdf: "📄", png: "🖼️", jpg: "🖼️", jpeg: "🖼️", mp3: "🎧", m4a: "🎧", mp4: "🎬" };

export default async function TeacherMaterialsPage() {
  await requireTeacher();
  const rows = await db.select().from(materials).orderBy(asc(materials.category), desc(materials.createdAt));

  const groups = new Map<string, typeof rows>();
  for (const m of rows) groups.set(m.category, [...(groups.get(m.category) ?? []), m]);

  return (
    <>
      <AdminPageHeader title="Learning materials" description="Resources shared by the academy. Click View to open or download." />
      {rows.length === 0 ? (
        <EmptyState title="Nothing has been shared yet" />
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([category, items]) => (
            <Panel key={category} title={category}>
              <ul className="divide-y divide-brand-100">
                {items.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="flex items-center gap-3">
                      <span aria-hidden className="text-xl">
                        {icon[m.fileExt] ?? "📁"}
                      </span>
                      <span className="font-medium text-brand-800">{m.title}</span>
                    </span>
                    <a href={`/files/materials/${m.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-600 hover:underline">
                      View
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
