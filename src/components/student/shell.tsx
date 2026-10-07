"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoMark } from "@/components/logo";
import { cn } from "@/components/ui";
import { Icon, type IconName } from "@/components/teacher/icons";

type Item = { href: string; label: string; icon: IconName; exact?: boolean };

const sidebar: Item[] = [
  { href: "/student", label: "Home", icon: "home", exact: true },
  { href: "/student/students", label: "Students", icon: "users" },
  { href: "/student/certificates", label: "Certificates", icon: "award" },
  { href: "/student/schedule", label: "Schedule", icon: "calendar" },
  { href: "/student/classes", label: "Classes", icon: "clock" },
  { href: "/student/profile", label: "Profile", icon: "user" },
];

// Phones get the five everyday pages as a bottom bar; Certificates is reachable from Students.
const bottom: Item[] = sidebar.filter((i) => i.label !== "Certificates");

export type NoticeView = { id: string; text: string; when: string; href: string };

export function StudentShell({
  initial,
  notices,
  unread,
  logoutAction,
  markReadAction,
  sidebarFooter,
  children,
}: {
  initial: string;
  notices: NoticeView[];
  unread: number;
  logoutAction: () => Promise<void>;
  markReadAction: () => Promise<void>;
  /** Rendered under the sidebar links (server-rendered by the layout). */
  sidebarFooter?: ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The bell panel is open only on the page it was opened from, so it closes after navigating.
  const [bellAt, setBellAt] = useState<string | null>(null);
  const bellOpen = bellAt === pathname;

  const active = (i: Item) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/"));

  const pill = (
    <div className="relative flex items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_6px_24px_-8px_rgba(15,60,45,0.25)] print:hidden">
      <button
        type="button"
        onClick={() => setBellAt(bellOpen ? null : pathname)}
        aria-expanded={bellOpen}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
      >
        <Icon name="bell" className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">{unread}</span>
        )}
      </button>
      <Link href="/student/profile" aria-label="My profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-700">
        {initial}
      </Link>
      <form action={logoutAction}>
        <button type="submit" aria-label="Sign out" title="Sign out" className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-500 transition hover:bg-rose-100">
          <Icon name="logout" className="h-5 w-5" />
        </button>
      </form>

      {bellOpen && (
        <div role="dialog" aria-label="Notifications" className="pop-in absolute right-0 top-14 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="font-sans text-base font-extrabold text-slate-900">Notifications</p>
            {unread > 0 && (
              <form action={markReadAction}>
                <button type="submit" className="text-xs font-bold text-emerald-700 hover:underline">
                  Mark all read
                </button>
              </form>
            )}
          </div>
          {notices.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-400">Nothing new. Updates about classes and reports appear here.</p>
          ) : (
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {notices.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} className="block rounded-xl px-3 py-2.5 hover:bg-emerald-50">
                    <span className="block text-sm font-semibold text-slate-800">{n.text}</span>
                    <span className="text-xs text-slate-400">{n.when}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6faf7] pb-24 print:bg-white print:pb-0 lg:pb-0">
      <div className="mx-auto flex max-w-[1500px] gap-5 p-3 sm:p-5">
        <aside className="hidden w-60 flex-none lg:block print:hidden">
          <div className="sticky top-5 max-h-[calc(100vh-2.5rem)] overflow-y-auto rounded-3xl bg-white p-4 shadow-[0_6px_24px_-10px_rgba(15,60,45,0.2)]">
            <Link href="/student" className="mb-6 mt-2 flex flex-col items-center gap-2 text-center" aria-label="Quranova student portal home">
              <LogoMark className="h-14 w-14" />
              <span className="font-sans text-xl font-extrabold leading-none text-slate-900">
                Quranova
                <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">Student portal</span>
              </span>
            </Link>
            <nav aria-label="Student portal" className="space-y-1.5">
              {sidebar.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={active(i) ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition duration-200",
                    active(i) ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  {active(i) && <span aria-hidden className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-600" />}
                  <Icon name={i.icon} className="h-5 w-5" />
                  {i.label}
                </Link>
              ))}
            </nav>
            {sidebarFooter}
          </div>
        </aside>

        <div className="relative min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between lg:absolute lg:right-0 lg:top-0 lg:z-40 lg:mb-0 print:hidden">
            <Link href="/student" className="flex items-center gap-2 lg:hidden" aria-label="Student portal home">
              <LogoMark className="h-10 w-10" />
              <span className="font-sans text-lg font-extrabold text-slate-900">Quranova</span>
            </Link>
            {pill}
          </div>
          {children}
        </div>
      </div>

      <nav aria-label="Main" className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-1 rounded-3xl bg-white p-2 shadow-[0_10px_30px_-8px_rgba(15,60,45,0.35)] lg:hidden print:hidden">
        {bottom.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active(i) ? "page" : undefined}
            className={cn("flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-bold transition active:scale-95", active(i) ? "bg-emerald-50 text-emerald-700" : "text-slate-500")}
          >
            <Icon name={i.icon} className="h-5 w-5" />
            {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
