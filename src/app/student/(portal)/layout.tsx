import { HelpCard } from "@/components/student/help-card";
import { StudentShell } from "@/components/student/shell";
import { formatDayShort, formatTimePadded } from "@/lib/admin/time-family";
import { logoutParent } from "@/lib/auth/actions";
import { requireParent } from "@/lib/auth/session";
import { markNoticesRead } from "@/lib/student/actions";
import { getNotices } from "@/lib/student/data";

export default async function FamilyPortalLayout({ children }: { children: React.ReactNode }) {
  const parent = await requireParent();
  const { items, unread } = await getNotices(parent);

  return (
    <StudentShell
      initial={(parent.guardianName[0] ?? "F").toUpperCase()}
      unread={unread}
      notices={items.map((n) => ({
        id: n.id,
        text: n.text,
        href: n.href,
        when: `${formatDayShort(n.at, parent.timezone)}, ${formatTimePadded(n.at, parent.timezone)}`,
      }))}
      logoutAction={logoutParent}
      markReadAction={markNoticesRead}
      sidebarFooter={<HelpCard />}
    >
      {children}
    </StudentShell>
  );
}
