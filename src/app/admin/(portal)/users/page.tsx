import { asc } from "drizzle-orm";
import { CreateAdminForm, ResetPasswordForm } from "@/components/admin/auth-forms";
import { AdminPageHeader, Badge, Panel } from "@/components/admin/ui";
import { db, users } from "@/db";
import { formatDateTime } from "@/lib/admin/time";
import { setUserActive } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

export const metadata = { title: "Admin users" };

export default async function UsersPage() {
  const me = await requireAdmin();
  const { adminTimezone: tz } = await getRawSettings();
  const list = await db.select().from(users).orderBy(asc(users.name));

  return (
    <>
      <AdminPageHeader title="Admin users" description="People who can sign in to this portal. Teacher and parent logins arrive with their own portals." />

      <Panel title="Accounts" className="mb-6">
        <ul className="divide-y divide-brand-100">
          {list.map((u) => (
            <li key={u.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-semibold text-brand-800">
                  {u.name} {u.id === me.id && <span className="text-xs font-normal text-muted">(you)</span>}
                </p>
                <p className="text-sm text-muted">{u.email}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Badge value={u.role} />
                  <Badge value={u.active ? "active" : "paused"} />
                  <span>{u.lastLoginAt ? `Last sign-in ${formatDateTime(u.lastLoginAt, tz)}` : "Never signed in"}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-3">
                <ResetPasswordForm userId={u.id} />
                {u.id !== me.id && (
                  <form action={setUserActive.bind(null, u.id, !u.active)}>
                    <button
                      type="submit"
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${u.active ? "border-red-300 text-red-700 hover:bg-red-50" : "border-brand-300 text-brand-700 hover:bg-brand-50"}`}
                    >
                      {u.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Add an admin">
        <CreateAdminForm />
      </Panel>
    </>
  );
}
