import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { FamilyLoginForm } from "@/components/student/forms";
import { Hero } from "@/components/student/ui";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Sign in" };

export default async function FamilyLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === "parent") redirect("/student");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Hero className="mb-5 px-7 py-8 text-center">
          <LogoMark className="mx-auto h-16 w-16" />
          <h1 className="mt-4 font-sans text-3xl font-extrabold">Student Portal</h1>
          <p className="mt-1 text-emerald-100">Classes, lessons and progress for your family</p>
        </Hero>
        <div className="rounded-3xl bg-white p-7 shadow-[0_6px_24px_-12px_rgba(15,60,45,0.25)] sm:p-8">
          {error === "forbidden" && (
            <p role="alert" className="mb-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              This account does not have student portal access.
            </p>
          )}
          <FamilyLoginForm />
          <p className="mt-5 text-center text-sm text-slate-400">Your username was given to you by the academy. Forgotten it? Contact us and we will send it again.</p>
        </div>
      </div>
    </main>
  );
}
