import { ChangePasswordForm } from "@/components/admin/auth-forms";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "My account" };

export default async function TeacherAccountPage() {
  const me = await requireTeacher();
  return (
    <>
      <AdminPageHeader title="My account" description={`Signed in as ${me.name} (${me.email})`} />
      <Panel title="Change password">
        <ChangePasswordForm />
      </Panel>
    </>
  );
}
