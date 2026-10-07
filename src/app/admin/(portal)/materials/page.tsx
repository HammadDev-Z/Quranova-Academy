import { desc } from "drizzle-orm";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { MaterialUploadForm } from "@/components/admin/material-upload-form";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/ui";
import { db, materials } from "@/db";
import { deleteMaterial } from "@/lib/admin/materials-actions";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = { title: "Learning materials" };

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MaterialsPage() {
  await requireAdmin();
  const rows = await db.select().from(materials).orderBy(desc(materials.createdAt));

  return (
    <>
      <AdminPageHeader title="Learning materials" description="PDFs, images and audio that every teacher can see and download from their portal." />

      <Panel title="Upload a file" className="mb-6">
        <MaterialUploadForm />
      </Panel>

      {rows.length === 0 ? (
        <EmptyState title="No materials yet">Upload the first resource above.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-brand-50/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Title</th>
                <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                <th scope="col" className="px-4 py-3 font-semibold">Size</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-semibold text-brand-800">{m.title}</td>
                  <td className="px-4 py-3">{m.category}</td>
                  <td className="px-4 py-3 uppercase text-muted">{m.fileExt}</td>
                  <td className="px-4 py-3 text-muted">{formatSize(m.sizeBytes)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <a href={`/files/materials/${m.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">
                      View
                    </a>
                    <form action={deleteMaterial.bind(null, m.id)} className="ml-4 inline">
                      <ConfirmButton message="Delete this material? This cannot be undone." className="tap font-semibold text-red-700 hover:underline">
                        Delete
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
