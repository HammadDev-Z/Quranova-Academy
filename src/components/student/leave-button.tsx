"use client";

import type { ReactNode } from "react";
import { markOnLeave } from "@/lib/student/actions";

/** "Mark as On Leave" with an "are you sure" step, because it cannot be undone from the family portal. */
export function LeaveButton({
  classId,
  returnTo,
  studentName,
  when,
  className,
  children,
}: {
  classId: string;
  returnTo: string;
  studentName: string;
  when: string;
  className: string;
  children?: ReactNode;
}) {
  return (
    <form action={markOnLeave.bind(null, classId, returnTo)}>
      <button
        type="submit"
        className={className}
        onClick={(e) => {
          if (!window.confirm(`Mark ${studentName}'s class on ${when} as on leave? The teacher will then arrange a make-up class.`)) e.preventDefault();
        }}
      >
        {children ?? "Mark as On Leave"}
      </button>
    </form>
  );
}
