import { TeacherPasswordForm } from "@/components/teacher/forms";
import { PageTitle, TCard } from "@/components/teacher/ui";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "My account" };

export default async function TeacherAccountPage() {
  const me = await requireTeacher();
  return (
    <>
      <PageTitle title="My Account" subtitle={`Signed in as ${me.name} (${me.email})`} />
      <TCard>
        <h2 className="mb-5 font-sans text-xl font-bold text-navy">Change password</h2>
        <TeacherPasswordForm />
      </TCard>
    </>
  );
}
