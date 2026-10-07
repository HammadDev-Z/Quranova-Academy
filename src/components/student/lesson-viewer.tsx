"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui";
import { Icon } from "@/components/teacher/icons";
import { lessonImageUrl } from "@/lib/lesson-image";

export type ViewerPage = { id: string; label: string; pageNo: number };

/** Page-by-page viewer: arrows, keyboard, slider and a thumbnail strip. */
export function LessonViewer({ pages, startIndex, currentPageNo }: { pages: ViewerPage[]; startIndex: number; currentPageNo: number }) {
  const [index, setIndex] = useState(startIndex);
  const strip = useRef<HTMLDivElement>(null);
  const page = pages[index];

  const go = (i: number) => setIndex(Math.min(pages.length - 1, Math.max(0, i)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type !== "range") return;
      if (e.key === "ArrowRight") setIndex((i) => Math.min(pages.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pages.length]);

  // Fetch the neighbouring pages ahead of time so turning a page feels instant.
  useEffect(() => {
    for (const p of [pages[index + 1], pages[index - 1]]) if (p) new Image().src = lessonImageUrl(p.id, 1200);
  }, [index, pages]);

  // Keep the active thumbnail in view as the page changes.
  useEffect(() => {
    strip.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [index]);

  return (
    <div className="rounded-3xl bg-white p-4 shadow-[0_6px_24px_-12px_rgba(15,60,45,0.25)] sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Current page</p>
          <p className="font-sans text-lg font-extrabold text-slate-900">
            {page.label}
            {page.pageNo === currentPageNo && <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 align-middle text-[11px] font-extrabold text-emerald-700">Your teacher&apos;s page</span>}
          </p>
        </div>
        <a
          href={`/files/lessons/${page.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100"
        >
          <Icon name="expand" className="h-4 w-4" /> Open full page
        </a>
      </div>

      <div className="relative flex min-h-[55vh] items-center justify-center rounded-2xl bg-slate-100 p-2 sm:p-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous page"
          className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white shadow-md transition hover:bg-emerald-50 disabled:opacity-40 sm:left-4"
        >
          <Icon name="chevron-left" className="h-5 w-5" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element -- served by an authenticated route, not the image optimiser */}
        <img src={lessonImageUrl(page.id, 1200)} alt={`Lesson page ${page.pageNo}`} decoding="async" className="mx-auto max-h-[75vh] w-auto max-w-full rounded-xl bg-white object-contain shadow-sm" />
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === pages.length - 1}
          aria-label="Next page"
          className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white shadow-md transition hover:bg-emerald-50 disabled:opacity-40 sm:right-4"
        >
          <Icon name="chevron-right" className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <p className="w-20 flex-none text-xs font-extrabold text-slate-600">
          {index + 1} of {pages.length}
        </p>
        <input
          type="range"
          min={1}
          max={pages.length}
          value={index + 1}
          onChange={(e) => go(Number(e.target.value) - 1)}
          aria-label="Page position"
          className="h-2 w-full cursor-pointer accent-emerald-700"
        />
      </div>

      <div ref={strip} className="mt-4 flex gap-2 overflow-x-auto pb-2" role="list" aria-label="Pages">
        {pages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="listitem"
            onClick={() => go(i)}
            aria-current={i === index}
            aria-label={`Page ${p.pageNo}`}
            className={cn("relative h-24 w-16 flex-none overflow-hidden rounded-lg border-2 bg-white transition", i === index ? "border-emerald-600" : "border-transparent opacity-70 hover:opacity-100")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- served by an authenticated route */}
            <img src={lessonImageUrl(p.id, 160)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
            {p.pageNo === currentPageNo && <span className="absolute bottom-0 inset-x-0 bg-emerald-700 text-center text-[9px] font-extrabold text-white">NOW</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
