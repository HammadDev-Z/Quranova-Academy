import { redirect } from "next/navigation";
import { TeacherSignInForm } from "@/components/teacher/forms";
import { LogoMark } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Sign in" };

export default async function TeacherLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === "teacher") redirect("/teacher");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-sage-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <LogoMark className="mx-auto h-16 w-16" />
          <h1 className="mt-4 font-sans text-3xl font-extrabold text-navy">Teacher Sign In</h1>
          <p className="mt-1 text-slate-500">Quranova Academy teacher portal</p>
        </div>
        <div className="rounded-3xl bg-white p-7 shadow-sm sm:p-9">
          {error === "forbidden" && (
            <p role="alert" className="mb-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              This account does not have teacher access. If you are an admin, use the admin sign in instead.
            </p>
          )}
          <TeacherSignInForm />
        </div>
      </div>
    </main>
  );
}
