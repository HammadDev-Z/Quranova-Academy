"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Friendly fallback for an unexpected error inside a route. The shell around it stays usable. */
export function ErrorView({ error, retry, home }: { error: Error & { digest?: string }; retry: () => void; home: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="page-in mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-700" aria-hidden>
        !
      </span>
      <h1 className="mt-5 font-sans text-2xl font-extrabold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-500">This page could not be loaded. It is usually temporary, so please try again.</p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition duration-200 hover:bg-emerald-800 active:scale-[0.97]"
        >
          Try again
        </button>
        <Link href={home} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:bg-emerald-50 active:scale-[0.97]">
          Go back
        </Link>
      </div>
    </div>
  );
}
