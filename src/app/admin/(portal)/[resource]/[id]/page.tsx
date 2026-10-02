import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ResourceForm } from "@/components/admin/resource-form";
import { SidePanel } from "@/components/admin/side-panels";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/db";
import { deleteResource, saveResource } from "@/lib/admin/actions";
import type { OptionSource } from "@/lib/admin/fields";
import { toFormValues } from "@/lib/admin/form";
import { loadOptions } from "@/lib/admin/options";
import { getResource } from "@/lib/admin/resources";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

type Props = { params: Promise<{ resource: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  const res = getResource((await params).resource);
  return { title: res ? `Edit ${res.singular}` : "Not found" };
}

export default async function EditResourcePage({ params }: Props) {
  await requireAdmin();
  const { resource: key, id } = await params;
  const res = getResource(key);
  if (!res || id === "new") notFound();

  const [row] = await db.select().from(res.table).where(eq(res.table.id, id)).limit(1);
  if (!row) notFound();

  const { adminTimezone: tz } = await getRawSettings();
  const sources = [...new Set(res.fields.flatMap((f) => (f.optionsFrom ? [f.optionsFrom] : [])))] as OptionSource[];
  const options = (await loadOptions(sources)) as Record<string, { value: string; label: string }[]>;
  const defaults = toFormValues(res.fields, row, tz);
  const panel = await SidePanel({ resource: key, row: row as { id: string } & Record<string, unknown>, tz });

  const title = String(row.name ?? row.title ?? row.question ?? row.number ?? row.parentName ?? `Edit ${res.singular}`);

  return (
    <>
      <AdminPageHeader title={title} description={`Edit ${res.singular}`} back={{ href: `/admin/${key}`, label: res.label }} />
      <div className={panel ? "grid gap-6 lg:grid-cols-[1fr_20rem]" : ""}>
        <div className="space-y-6">
          <Panel>
            <ResourceForm
              action={saveResource.bind(null, key, id)}
              fields={res.fields}
              options={options}
              defaults={defaults}
              cancelHref={`/admin/${key}`}
              submitLabel="Save changes"
              editing
            />
          </Panel>

          <Panel title="Danger zone">
            <form action={deleteResource.bind(null, key, id)} className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Deleting this {res.singular} cannot be undone.</p>
              <ConfirmButton
                message={`Delete this ${res.singular}? This cannot be undone.`}
                className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Delete {res.singular}
              </ConfirmButton>
            </form>
          </Panel>
        </div>
        {panel && <div className="space-y-6">{panel}</div>}
      </div>
    </>
  );
}
