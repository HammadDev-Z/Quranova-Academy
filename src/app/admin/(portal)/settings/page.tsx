import { AdminPageHeader, Flash, Panel } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/resource-form";
import { toFormValues } from "@/lib/admin/form";
import { saveSettings } from "@/lib/admin/settings-actions";
import { settingFields } from "@/lib/admin/settings-fields";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

export const metadata = { title: "Site settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const current = await getRawSettings();
  const defaults = toFormValues(settingFields, current as Record<string, unknown>, "UTC");

  return (
    <>
      <AdminPageHeader title="Site settings" description="Contact details, free-trial terms, announcement bar and indicative exchange rates. Changes go live on the website straight away." />
      <Flash saved={saved} />
      <Panel>
        <ResourceForm
          action={saveSettings}
          fields={settingFields}
          options={{}}
          defaults={defaults}
          cancelHref="/admin"
          submitLabel="Save settings"
          editing
        />
      </Panel>
    </>
  );
}
