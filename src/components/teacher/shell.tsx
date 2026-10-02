"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/logo";
import { cn } from "@/components/ui";
import { Icon, type IconName } from "./icons";
import { Avatar } from "./ui";

type Tab = { href: string; label: string; icon: IconName; exact?: boolean };

const tabs: Tab[] = [
  { href: "/teacher", label: "Teacher's Dashboard", icon: "home", exact: true },
  { href: "/teacher/classes", label: "Daily Classes", icon: "calendar" },
  { href: "/teacher/students", label: "Student List", icon: "user" },
  { href: "/teacher/reports", label: "Reports", icon: "document" },
  { href: "/teacher/materials", label: "Learning Material", icon: "monitor" },
  { href: "/teacher/reschedule", label: "Reschedules", icon: "swap" },
];

// The slim left rail mirrors the main tabs with colour-coded icons.
const rail: { href: string; label: string; icon: IconName; color: string }[] = [
  { href: "/teacher/classes", label: "Daily Classes", icon: "calendar", color: "text-blue-500" },
  { href: "/teacher/students", label: "Student List", icon: "user", color: "text-rose-500" },
  { href: "/teacher/reschedule", label: "Reschedules", icon: "calendar-clock", color: "text-pink-500" },
  { href: "/teacher/reports", label: "Reports", icon: "document", color: "text-green-500" },
  { href: "/teacher/materials", label: "Learning Material", icon: "monitor", color: "text-purple-500" },
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

  const isActive = (t: { href: string; exact?: boolean }) => (t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(t.href + "/"));

  return (
    <div className="min-h-screen bg-sage-100">
      <header className="relative flex items-center gap-3 px-4 py-4 sm:px-6">
        <Link href="/teacher" className="flex flex-none items-center gap-2.5" aria-label="Quranova teacher portal home">
          <LogoMark className="h-11 w-11" />
          <span className="hidden font-sans text-lg font-extrabold leading-none text-navy sm:block">
            Quranova
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-green-700">Teacher portal</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-3 hidden flex-1 items-center gap-1 xl:flex">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActive(t) ? "page" : undefined}
              className={cn(
                "relative flex w-[8.2rem] items-center justify-center rounded-2xl px-3 py-3 text-center text-[15px] font-semibold leading-tight transition-colors",
                isActive(t) ? "bg-sage-300/80 text-navy" : "text-slate-700 hover:bg-sage-200/70",
              )}
            >
              {t.label}
              {badges[t.href] ? (
                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                  {badges[t.href]}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="relative ml-auto flex items-center gap-2">
          <Link
            href="/teacher/availability"
            title="My availability"
            aria-label="My availability"
            className={cn(
              "hidden h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-sage-200/70 sm:flex",
              pathname.startsWith("/teacher/availability") && "bg-sage-300/80 text-navy",
            )}
          >
            <Icon name="calendar-clock" className="h-6 w-6" />
          </Link>

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
            <div role="menu" className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="truncate px-3 py-2 text-sm font-semibold text-navy">{name}</p>
              <Link role="menuitem" href="/teacher/availability" className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-sage-100">
                My availability
              </Link>
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
            className="flex h-11 w-11 items-center justify-center rounded-xl text-navy hover:bg-sage-200/70 xl:hidden"
          >
            <Icon name={drawer ? "close" : "menu"} className="h-6 w-6" />
          </button>
        </div>
      </header>

      {drawer && (
        <nav id="teacher-drawer" aria-label="Mobile" className="mx-4 mb-3 rounded-2xl bg-white p-2 shadow-lg xl:hidden">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 font-semibold",
                isActive(t) ? "bg-sage-200 text-navy" : "text-slate-700 hover:bg-sage-100",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon name={t.icon} className="h-5 w-5" />
                {t.label}
              </span>
              {badges[t.href] ? <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{badges[t.href]}</span> : null}
            </Link>
          ))}
          <Link href="/teacher/availability" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-sage-100">
            <Icon name="calendar-clock" className="h-5 w-5" /> My availability
          </Link>
        </nav>
      )}

      <div className="flex min-h-[calc(100vh-5.5rem)] rounded-tl-[2.25rem] bg-white">
        <aside aria-label="Shortcuts" className="hidden w-[5.5rem] flex-none flex-col items-center gap-3 border-r border-slate-100 py-7 lg:flex">
          <Link href="/teacher/account" title="My account" aria-label="My account" className="mb-3">
            <Avatar name={name} className="h-14 w-14 text-base" />
          </Link>
          {rail.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              title={r.label}
              aria-label={r.label}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition hover:bg-slate-50",
                r.color,
                pathname.startsWith(r.href) && "bg-slate-100",
              )}
            >
              <Icon name={r.icon} className="h-6 w-6" />
            </Link>
          ))}
        </aside>
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[78rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
