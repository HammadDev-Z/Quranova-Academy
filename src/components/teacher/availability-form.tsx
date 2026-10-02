"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { saveAvailability, type AvailabilityState } from "@/lib/teacher/actions";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function AvailabilityForm({ slots }: { slots: Record<number, { start: string; end: string }> }) {
  const [state, action, pending] = useActionState(saveAvailability, {} as AvailabilityState);

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {state.message}
        </p>
      )}
      <div className="space-y-2">
        {DAYS.map((label, day) => (
          <div key={day} className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-cream px-4 py-3">
            <span className="w-28 flex-none font-medium text-brand-800">{label}</span>
            <label className="flex items-center gap-2 text-sm text-muted">
              From
              <input
                type="time"
                name={`start_${day}`}
                defaultValue={slots[day]?.start ?? ""}
                className="rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              To
              <input
                type="time"
                name={`end_${day}`}
                defaultValue={slots[day]?.end ?? ""}
                className="rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-sm"
              />
            </label>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">Leave both times blank for a day you are not available. Times are in your own time zone.</p>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save availability"}
      </Button>
    </form>
  );
}
