import { eq } from "drizzle-orm";
import { availabilitySlots, db } from "@/db";
import { AvailabilityForm } from "@/components/teacher/forms";
import { PageTitle, TCard } from "@/components/teacher/ui";
import { requireTeacher } from "@/lib/auth/session";

export const metadata = { title: "My availability" };

export default async function AvailabilityPage() {
  const me = await requireTeacher();
  const rows = await db.select().from(availabilitySlots).where(eq(availabilitySlots.teacherId, me.teacherId));
  const slots = Object.fromEntries(rows.map((r) => [r.weekday, { start: r.startTime, end: r.endTime }]));

  return (
    <>
      <PageTitle title="My Availability" crumb="Dashboards" subtitle={`Tell the academy which days and hours you can teach. Times are in your time zone (${me.timezone}).`} />
      <TCard>
        <AvailabilityForm slots={slots} />
      </TCard>
    </>
  );
}
