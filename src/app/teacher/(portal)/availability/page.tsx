import { eq } from "drizzle-orm";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { AvailabilityForm } from "@/components/teacher/availability-form";
import { availabilitySlots, db } from "@/db";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "My availability" };

export default async function AvailabilityPage() {
  const me = await requireTeacher();
  const rows = await db.select().from(availabilitySlots).where(eq(availabilitySlots.teacherId, me.teacherId));
  const slots = Object.fromEntries(rows.map((r) => [r.weekday, { start: r.startTime, end: r.endTime }]));

  return (
    <>
      <AdminPageHeader title="My availability" description="Tell the admin which days and times you can teach, so new students are scheduled at times that work for you." />
      <Panel>
        <AvailabilityForm slots={slots} />
      </Panel>
    </>
  );
}
