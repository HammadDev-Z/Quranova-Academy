import { notFound } from "next/navigation";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/resource-form";
import { saveResource } from "@/lib/admin/actions";
import type { OptionSource } from "@/lib/admin/fields";
import { toFormValues } from "@/lib/admin/form";
import { loadOptions } from "@/lib/admin/options";
import { getResource } from "@/lib/admin/resources";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

type Props = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const res = getResource((await params).resource);
  return { title: res ? `Add ${res.singular}` : "Not found" };
}

export default async function NewResourcePage({ params, searchParams }: Props) {
  await requireAdmin();
  const { resource: key } = await params;
  const res = getResource(key);
  if (!res) notFound();

  const sp = await searchParams;
  const { adminTimezone: tz } = await getRawSettings();
  const sources = [...new Set(res.fields.flatMap((f) => (f.optionsFrom ? [f.optionsFrom] : [])))] as OptionSource[];
  const options = (await loadOptions(sources)) as Record<string, { value: string; label: string }[]>;

  // ?studentId=… (and similar) pre-selects a field, e.g. "Schedule class" from a student page.
  const defaults = toFormValues(res.fields, undefined, tz);
  for (const f of res.fields) {
    const pre = sp[f.name];
    if (pre && f.type !== "checkbox") defaults[f.name] = pre;
  }

  return (
    <>
      <AdminPageHeader title={`Add ${res.singular}`} back={{ href: `/admin/${key}`, label: res.label }} />
      <Panel>
        <ResourceForm
          action={saveResource.bind(null, key, "new")}
          fields={res.fields}
          options={options}
          defaults={defaults}
          cancelHref={`/admin/${key}`}
          submitLabel={`Create ${res.singular}`}
          editing={false}
        />
      </Panel>
    </>
  );
}
