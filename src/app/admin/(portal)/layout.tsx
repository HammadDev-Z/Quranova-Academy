import { and, count, eq, lt, ne } from "drizzle-orm";
import { AdminNav, type NavGroup } from "@/components/admin/admin-nav";
import { db, invoices, leads, progressReports } from "@/db";
import { todayKey } from "@/lib/admin/time";
import { logout } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const { adminTimezone } = await getRawSettings();

  const [[newLeads], [overdue], [submittedReports]] = await Promise.all([
    db.select({ n: count() }).from(leads).where(eq(leads.status, "new")),
    db
      .select({ n: count() })
      .from(invoices)
      .where(and(eq(invoices.status, "unpaid"), lt(invoices.dueOn, todayKey(adminTimezone)), ne(invoices.dueOn, ""))),
    db.select({ n: count() }).from(progressReports).where(eq(progressReports.status, "submitted")),
  ]);

  const groups: NavGroup[] = [
    { title: "Overview", items: [{ href: "/admin", label: "Dashboard" }] },
    { title: "Sales", items: [{ href: "/admin/leads", label: "Leads", badge: newLeads.n }] },
    {
      title: "People",
      items: [
        { href: "/admin/students", label: "Students" },
        { href: "/admin/guardians", label: "Parents" },
        { href: "/admin/teachers", label: "Teachers" },
      ],
    },
    {
      title: "Teaching",
      items: [
        { href: "/admin/classes", label: "Class schedule" },
        { href: "/admin/reports", label: "Progress reports", badge: submittedReports.n },
        { href: "/admin/materials", label: "Learning materials" },
        { href: "/admin/lesson-pages", label: "Lesson pages" },
        { href: "/admin/certificates", label: "Certificates" },
      ],
    },
    { title: "Money", items: [{ href: "/admin/invoices", label: "Invoices", badge: overdue.n }] },
    {
      title: "Website",
      items: [
        { href: "/admin/courses", label: "Courses" },
        { href: "/admin/packages", label: "Packages & prices" },
        { href: "/admin/posts", label: "Blog posts" },
        { href: "/admin/faqs", label: "FAQs" },
        { href: "/admin/testimonials", label: "Reviews" },
        { href: "/admin/settings", label: "Site settings" },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/admin/users", label: "Admin users" },
        { href: "/admin/activity", label: "Activity log" },
      ],
    },
  ];

  return (
    <>
      <AdminNav groups={groups} userName={user.name} logoutAction={logout} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </>
  );
}
