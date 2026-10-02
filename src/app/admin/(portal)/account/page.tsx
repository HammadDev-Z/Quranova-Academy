import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ChangePasswordForm } from "@/components/admin/auth-forms";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireAdmin();
  return (
    <>
      <AdminPageHeader title="My account" description={`Signed in as ${user.name} (${user.email})`} />
      <Panel title="Change password">
        <ChangePasswordForm />
      </Panel>
    </>
  );
}
