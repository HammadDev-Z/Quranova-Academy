"use client";

import { useActionState } from "react";
import { Input } from "@/components/form-fields";
import { Button } from "@/components/ui";
import { requestReschedule, type RescheduleState } from "@/lib/teacher/actions";

export function RescheduleForm({ classId }: { classId: string }) {
  const [state, action, pending] = useActionState(requestReschedule.bind(null, classId), {} as RescheduleState);
  const e = state.errors ?? {};

  if (state.ok) {
    return (
      <p role="status" className="text-sm font-medium text-brand-700">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-start gap-2">
      <div>
        <Input name="newStartsAt" type="datetime-local" aria-label="New date and time" error={e.newStartsAt} />
        {e.newStartsAt && <p className="mt-1 text-xs text-red-700">{e.newStartsAt}</p>}
      </div>
      <Button type="submit" size="md" disabled={pending}>
        {pending ? "Saving…" : "Reschedule"}
      </Button>
      {state.message && !state.ok && <p className="w-full text-xs text-red-700">{state.message}</p>}
    </form>
  );
}
