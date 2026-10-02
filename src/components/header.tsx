"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav } from "@/content/site";
import { Logo } from "./logo";
import { Button, cn } from "./ui";

type HeaderProps = {
  courses: { slug: string; title: string }[];
  trialDays: number;
  phoneDisplay: string;
  phoneHref: string;
  email: string;
  announcement: string;
};

export function Header({ courses, trialDays, phoneDisplay, phoneHref, email, announcement }: HeaderProps) {
  const pathname = usePathname();
  // The menu is "open" only on the page it was opened from, so it closes
  // itself after navigating without needing an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-cream/95 backdrop-blur">
      {announcement && (
        <p className="bg-gold-500 px-4 py-1.5 text-center text-sm font-medium text-brand-900">{announcement}</p>
      )}
      <div className="hidden bg-brand-800 text-sm text-brand-100 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-1.5">
          <p>Free {trialDays}-day trial. No card needed.</p>
          <p className="flex gap-5">
            <a href={`tel:${phoneHref}`} className="hover:text-white">
              {phoneDisplay}
            </a>
            <a href={`mailto:${email}`} className="hover:text-white">
              {email}
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) =>
            item.href === "/courses" ? (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium hover:bg-brand-50",
                    isActive(item.href) ? "text-brand-600" : "text-ink",
                  )}
                >
                  {item.label}
                </Link>
                <div className="invisible absolute left-0 top-full w-72 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <ul className="rounded-2xl border border-brand-100 bg-white p-2 shadow-lg">
                    {courses.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/courses/${c.slug}`}
                          className="block rounded-xl px-3 py-2 text-sm text-ink hover:bg-brand-50 hover:text-brand-700"
                        >
                          {c.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium hover:bg-brand-50",
                  isActive(item.href) ? "text-brand-600" : "text-ink",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button href="/free-trial" variant="gold" className="hidden sm:inline-flex">
            Free Trial
          </Button>
          <button
            type="button"
            className="rounded-full p-2 text-brand-800 hover:bg-brand-50 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpenAt(open ? null : pathname)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-brand-100 bg-white lg:hidden">
          <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 font-medium",
                    isActive(item.href) ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-brand-50",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Button href="/free-trial" variant="gold" className="w-full">
                Book Free Trial
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
