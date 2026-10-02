import { redirect } from "next/navigation";
import { TeacherLoginForm } from "@/components/admin/auth-forms";
import { LogoMark } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Sign in" };

export default async function TeacherLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === "teacher") redirect("/teacher");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <LogoMark className="mx-auto h-14 w-14" />
          <h1 className="mt-4 text-3xl font-bold text-brand-800">Teacher sign in</h1>
          <p className="mt-1 text-muted">Quranova Academy teacher portal</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
          {error === "forbidden" && (
            <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              This account does not have teacher access. If you are an admin, use the admin sign in instead.
            </p>
          )}
          <TeacherLoginForm />
        </div>
      </div>
    </main>
  );
}
