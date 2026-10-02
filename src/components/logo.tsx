import Link from "next/link";
import { siteStatic } from "@/content/site";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" className="fill-brand-600" />
      <path
        d="M24 7l5.2 9.6L39 21.8l-9.8 5.2L24 41l-5.2-14-9.8-5.2 9.8-5.2z"
        className="fill-gold-500"
      />
      <path d="M24 15l3 5.6 5.6 3-5.6 3-3 5.6-3-5.6-5.6-3 5.6-3z" className="fill-brand-700" />
    </svg>
  );
}

export function Logo({ invert }: { invert?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${siteStatic.name} home`}>
      <LogoMark />
      <span className="leading-none">
        <span className={`block font-serif text-xl font-bold ${invert ? "text-white" : "text-brand-800"}`}>
          {siteStatic.shortName}
        </span>
        <span className={`block text-[11px] font-semibold uppercase tracking-[0.2em] ${invert ? "text-gold-300" : "text-gold-600"}`}>
          Academy
        </span>
      </span>
    </Link>
  );
}
