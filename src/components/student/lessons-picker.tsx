"use client";

import Link from "next/link";
import { useRef } from "react";
import { Icon } from "@/components/teacher/icons";

export type LessonOption = { label: string; sub: string; href: string; icon: "book" | "layers" };

/** Opens a small dialog where the family picks which course's lessons to open. */
export function LessonsPicker({ studentName, options, className }: { studentName: string; options: LessonOption[]; className: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  if (options.length === 0) {
    return (
      <span aria-disabled title="No course has been set up for this student yet" className={className + " cursor-not-allowed opacity-50"}>
        Lesson
      </span>
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>
        Lesson
      </button>
      <dialog
        ref={ref}
        aria-labelledby={`lessons-${studentName}`}
        className="m-auto w-[min(92vw,28rem)] rounded-3xl p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="p-6">
          <div className="mb-1 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Lessons for</p>
              <h2 id={`lessons-${studentName}`} className="font-sans text-2xl font-extrabold text-slate-900">
                {studentName}
              </h2>
            </div>
            <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
          <p className="mb-5 text-slate-500">Choose the course you want to open.</p>
          <div className="space-y-3">
            {options.map((o) => (
              <Link key={o.label} href={o.href} className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 transition hover:bg-emerald-50">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-emerald-700 text-white">
                  <Icon name={o.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-sans text-base font-extrabold text-emerald-900">{o.label}</span>
                  <span className="block truncate text-sm text-slate-500">{o.sub}</span>
                </span>
                <Icon name="arrow-right" className="h-5 w-5 flex-none text-emerald-900" />
              </Link>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
