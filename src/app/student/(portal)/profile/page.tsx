import { and, count, eq, gt } from "drizzle-orm";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { PasswordForm, TimezoneForm } from "@/components/student/forms";
import { Hero, SCard, SubHeader } from "@/components/student/ui";
import { Icon } from "@/components/teacher/icons";
import { db, sessions } from "@/db";
import { logoutParent } from "@/lib/auth/actions";
import { requireParent } from "@/lib/auth/session";
import { signOutRememberedDevices } from "@/lib/student/actions";

export const metadata = { title: "Profile & Security" };

export default async function ProfilePage() {
  const parent = await requireParent();
  const [remembered] = await db
    .select({ n: count() })
    .from(sessions)
    .where(and(eq(sessions.userId, parent.id), eq(sessions.remembered, true), gt(sessions.expiresAt, new Date())));
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];

  return (
    <>
      <SubHeader eyebrow="Account settings" title="Profile & Security" />

      <Hero className="mb-5 px-6 py-7 sm:px-8">
        <p className="text-xs font-extrabold text-emerald-100">Signed in as</p>
        <p className="mt-1 font-sans text-3xl font-extrabold">{parent.guardianName}</p>
        {parent.username && <p className="mt-2 text-sm text-emerald-100">Username: {parent.username}</p>}
      </Hero>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <SCard>
            <h2 className="font-sans text-lg font-extrabold text-slate-900">Time zone</h2>
            <p className="mb-4 mt-1 text-sm text-slate-600">So class times match your clock.</p>
            <TimezoneForm current={parent.timezone} zones={zones} />
          </SCard>
        </div>

        <div className="space-y-5">
          <SCard>
            <h2 className="mb-4 font-sans text-lg font-extrabold text-slate-900">Change password</h2>
            <PasswordForm />
          </SCard>

          <SCard>
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-lg font-extrabold text-slate-900">Remembered devices</h2>
              <span className="text-xs font-extrabold text-emerald-700">{remembered.n} active</span>
            </div>
            <p className="mb-4 mt-1 text-sm text-slate-600">
              {remembered.n === 0 ? "No device is currently using the 10-day sign-in option." : "These devices stay signed in for up to 10 days without asking for your password."}
            </p>
            <div className="space-y-2.5">
              <form action={signOutRememberedDevices}>
                <ConfirmButton
                  message="Sign out all other remembered devices? You stay signed in here."
                  className="w-full rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  Sign out remembered devices
                </ConfirmButton>
              </form>
              <form action={logoutParent}>
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-5 py-3 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100">
                  <Icon name="logout" className="h-4 w-4" /> Logout from this device
                </button>
              </form>
            </div>
          </SCard>
        </div>
      </div>
    </>
  );
}
