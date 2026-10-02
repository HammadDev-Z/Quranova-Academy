import { count, desc } from "drizzle-orm";
import Link from "next/link";
import { AdminPageHeader, EmptyState, linkButtonOutline } from "@/components/admin/ui";
import { activity, db } from "@/db";
import { formatDateTime } from "@/lib/admin/time";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

export const metadata = { title: "Activity log" };
const PAGE_SIZE = 50;

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { adminTimezone: tz } = await getRawSettings();

  const [rows, [total]] = await Promise.all([
    db.select().from(activity).orderBy(desc(activity.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(activity),
  ]);
  const pages = Math.max(1, Math.ceil(total.n / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader title="Activity log" description="Who changed what, and when." />
      {rows.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-brand-50/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">When</th>
                <th scope="col" className="px-4 py-3 font-semibold">Who</th>
                <th scope="col" className="px-4 py-3 font-semibold">What</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDateTime(a.createdAt, tz)}</td>
                  <td className="px-4 py-2.5 font-medium text-brand-800">{a.userName || "System"}</td>
                  <td className="px-4 py-2.5">{a.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between text-sm">
          <p className="text-muted">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/activity?page=${page - 1}`} className={linkButtonOutline}>
                ← Newer
              </Link>
            )}
            {page < pages && (
              <Link href={`/admin/activity?page=${page + 1}`} className={linkButtonOutline}>
                Older →
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
