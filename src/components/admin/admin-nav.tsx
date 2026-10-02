"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/logo";
import { cn } from "@/components/ui";

export type NavGroup = { title: string; items: { href: string; label: string; badge?: number }[] };

export function AdminNav({ groups, userName, logoutAction }: { groups: NavGroup[]; userName: string; logoutAction: () => Promise<void> }) {
  const pathname = usePathname();
  // Mobile drawer is open only on the page it was opened from, so it closes after navigating.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-800 bg-brand-900 px-4 py-3 text-white lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-serif text-lg font-bold">
          <LogoMark className="h-8 w-8" /> Admin
        </Link>
        <button
          type="button"
          onClick={() => setOpenAt(open ? null : pathname)}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-lg p-2 hover:bg-brand-800"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <aside
        id="admin-sidebar"
        className={cn(
          "bg-brand-900 text-brand-100 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col",
          open ? "block" : "hidden lg:flex",
        )}
      >
        <div className="hidden items-center gap-2.5 px-5 py-5 lg:flex">
          <LogoMark />
          <div className="leading-tight">
            <p className="font-serif text-lg font-bold text-white">Quranova</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">Admin portal</p>
          </div>
        </div>

        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((g) => (
            <div key={g.title} className="mt-4 first:mt-0">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-gold-300/80">{g.title}</p>
              <ul className="space-y-0.5">
                {g.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium",
                        isActive(item.href) ? "bg-brand-700 text-white" : "hover:bg-brand-800 hover:text-white",
                      )}
                    >
                      {item.label}
                      {item.badge ? (
                        <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-brand-900">{item.badge}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-brand-800 p-4">
          <p className="truncate text-sm font-medium text-white">{userName}</p>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <Link href="/admin/account" className="hover:text-white">
              Account
            </Link>
            <Link href="/" target="_blank" className="hover:text-white">
              View site ↗
            </Link>
            <form action={logoutAction} className="ml-auto">
              <button type="submit" className="rounded-md px-2 py-1 font-medium text-gold-300 hover:bg-brand-800 hover:text-gold-300">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
