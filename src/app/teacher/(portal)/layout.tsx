import { and, count, eq, gt, lt } from "drizzle-orm";
import { AdminNav, type NavGroup } from "@/components/admin/admin-nav";
import { classSessions, db } from "@/db";
import { logoutTeacher } from "@/lib/auth/actions";
import { requireTeacher } from "@/lib/auth/session";
import { MAX_RESCHEDULES } from "@/lib/teacher/constants";

export default async function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  const me = await requireTeacher();

  const [eligible] = await db
    .select({ n: count() })
    .from(classSessions)
    .where(
      and(
        eq(classSessions.teacherId, me.teacherId),
        gt(classSessions.rescheduleDeadline, new Date()),
        lt(classSessions.rescheduleCount, MAX_RESCHEDULES),
      ),
    );

  const groups: NavGroup[] = [
    { title: "Overview", items: [{ href: "/teacher", label: "Dashboard" }] },
    {
      title: "Teaching",
      items: [
        { href: "/teacher/classes", label: "My classes" },
        { href: "/teacher/students", label: "My students" },
        { href: "/teacher/reschedule", label: "Reschedules", badge: eligible.n },
      ],
    },
    {
      title: "Reports & resources",
      items: [
        { href: "/teacher/reports", label: "Progress reports" },
        { href: "/teacher/materials", label: "Learning materials" },
      ],
    },
    { title: "Settings", items: [{ href: "/teacher/availability", label: "My availability" }] },
  ];

  return (
    <>
      <AdminNav
        groups={groups}
        userName={me.name}
        logoutAction={logoutTeacher}
        homeHref="/teacher"
        portalLabel="Teacher portal"
        accountHref="/teacher/account"
      />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </>
  );
}
