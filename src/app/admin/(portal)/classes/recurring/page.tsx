import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { RecurringForm } from "@/components/admin/recurring-form";
import { loadOptions } from "@/lib/admin/options";
import { todayKey } from "@/lib/admin/time";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

export const metadata = { title: "Weekly class schedule" };

export default async function RecurringPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  await requireAdmin();
  const { studentId } = await searchParams;
  const { adminTimezone: tz } = await getRawSettings();
  const o = await loadOptions(["students", "teachers", "courses"]);

  return (
    <>
      <AdminPageHeader
        title="Weekly class schedule"
        description="Create the same lesson every week on the days you choose. You can edit or cancel individual classes afterwards."
        back={{ href: "/admin/classes", label: "Class schedule" }}
      />
      <Panel>
        <RecurringForm
          students={o.students ?? []}
          teachers={o.teachers ?? []}
          courses={o.courses ?? []}
          defaultStudent={studentId}
          today={todayKey(tz)}
        />
      </Panel>
    </>
  );
}
