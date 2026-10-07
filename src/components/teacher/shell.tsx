"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/logo";
import { cn } from "@/components/ui";
import { Icon, type IconName } from "./icons";
import { Avatar } from "./ui";

type Tab = { href: string; label: string; icon: IconName; color: string; exact?: boolean };

const tabs: Tab[] = [
  { href: "/teacher", label: "Dashboard", icon: "home", color: "text-green-600", exact: true },
  { href: "/teacher/classes", label: "Daily Classes", icon: "calendar", color: "text-blue-500" },
  { href: "/teacher/students", label: "Students", icon: "user", color: "text-rose-500" },
  { href: "/teacher/reports", label: "Reports", icon: "document", color: "text-emerald-500" },
  { href: "/teacher/materials", label: "Learning Material", icon: "monitor", color: "text-purple-500" },
  { href: "/teacher/reschedule", label: "Reschedules", icon: "swap", color: "text-pink-500" },
  { href: "/teacher/availability", label: "Availability", icon: "calendar-clock", color: "text-amber-500" },
];

export function TeacherShell({
  name,
  badges,
  logoutAction,
  children,
}: {
  name: string;
  badges: Record<string, number>;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Menus are open only on the page they were opened from, so they close after navigating.
  const [drawerAt, setDrawerAt] = useState<string | null>(null);
  const [userMenuAt, setUserMenuAt] = useState<string | null>(null);
  const drawer = drawerAt === pathname;
  const userMenu = userMenuAt === pathname;

  const isActive = (t: Tab) => (t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(t.href + "/"));

  return (
    <div className="min-h-screen bg-sage-100">
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-sage-100/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <Link href="/teacher" className="flex flex-none items-center gap-2.5" aria-label="Quranova teacher portal home">
          <LogoMark className="h-11 w-11" />
          <span className="hidden font-sans text-lg font-extrabold leading-none text-navy min-[1500px]:block">
            Quranova
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-green-700">Teacher portal</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-2 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] lg:flex">
          {tabs.map((t) => {
            const active = isActive(t);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-none items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-2.5 text-sm font-semibold transition duration-200 active:scale-[0.97] xl:px-3.5",
                  active ? "bg-white text-navy shadow-sm" : "text-slate-700 hover:bg-white/60",
                )}
              >
                <Icon name={t.icon} className={cn("hidden h-[1.15rem] w-[1.15rem] min-[1180px]:block", active ? t.color : "text-slate-500")} />
                {t.label}
                {badges[t.href] ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">{badges[t.href]}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="relative ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUserMenuAt(userMenu ? null : pathname)}
            aria-expanded={userMenu}
            aria-haspopup="menu"
            aria-label="Account menu"
            className="flex items-center gap-2 rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-sage-300"
          >
            <Avatar name={name} className="h-11 w-11 text-sm" />
          </button>
          {userMenu && (
            <div role="menu" className="pop-in absolute right-0 top-14 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="truncate px-3 py-2 text-sm font-semibold text-navy">{name}</p>
              <Link role="menuitem" href="/teacher/account" className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-sage-100">
                Account & password
              </Link>
              <Link role="menuitem" href="/" target="_blank" className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-sage-100">
                View website ↗
              </Link>
              <form action={logoutAction}>
                <button role="menuitem" type="submit" className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">
                  <Icon name="logout" className="h-4 w-4" /> Sign out
                </button>
              </form>
            </div>
          )}

          <button
            type="button"
            onClick={() => setDrawerAt(drawer ? null : pathname)}
            aria-expanded={drawer}
            aria-controls="teacher-drawer"
            aria-label={drawer ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-navy transition hover:bg-sage-200/70 active:scale-90 lg:hidden"
          >
            <Icon name={drawer ? "close" : "menu"} className="h-6 w-6" />
          </button>
        </div>
      </header>

      {drawer && (
        <nav id="teacher-drawer" aria-label="Mobile" className="pop-in mx-4 mb-3 rounded-2xl bg-white p-2 shadow-lg lg:hidden">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 font-semibold transition-colors",
                isActive(t) ? "bg-sage-200 text-navy" : "text-slate-700 hover:bg-sage-100",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon name={t.icon} className={cn("h-5 w-5", t.color)} />
                {t.label}
              </span>
              {badges[t.href] ? <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{badges[t.href]}</span> : null}
            </Link>
          ))}
        </nav>
      )}

      <main className="min-h-[calc(100vh-5rem)] rounded-tl-[2.25rem] rounded-tr-[2.25rem] bg-white px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto min-w-0 max-w-[84rem]">{children}</div>
      </main>
    </div>
  );
}
