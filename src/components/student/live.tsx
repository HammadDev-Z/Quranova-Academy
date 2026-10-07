"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/components/ui";
import { Icon } from "@/components/teacher/icons";

const TICK = 15_000;
const subscribe = (cb: () => void) => {
  const id = setInterval(cb, TICK);
  return () => clearInterval(id);
};
const snapshot = () => Math.floor(Date.now() / TICK);
// The server renders without a clock, so there is nothing to mismatch on hydration.
const serverSnapshot = () => 0;

/** Current time in ms, refreshed every few seconds. Null until the browser takes over. */
function useNow(): number | null {
  const t = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return t === 0 ? null : t * TICK;
}

export function LiveClock({ tz, className }: { tz: string; className?: string }) {
  const now = useNow();
  if (now === null) return <span className={className}>&nbsp;</span>;
  const d = new Date(now);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short" }).format(d);
  return (
    <span className={className}>
      {time} <span className="ml-1">{day}</span>
    </span>
  );
}

function relative(now: number, startsAt: number, endsAt: number): string {
  if (now >= endsAt) return "Class finished";
  if (now >= startsAt) return "Class in progress";
  const mins = Math.round((startsAt - now) / 60000);
  if (mins < 1) return "Starting now";
  if (mins < 60) return `In ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `In ${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `In ${days} day${days === 1 ? "" : "s"}`;
}

/** "In 3 days · Mon 5 Oct at 05:00 PM", counting down live. */
export function Countdown({ startsAt, endsAt, absolute, className }: { startsAt: number; endsAt: number; absolute: string; className?: string }) {
  const now = useNow();
  return (
    <span className={className}>
      {now === null ? "Upcoming" : relative(now, startsAt, endsAt)} · {absolute}
    </span>
  );
}

export function JoinButton({
  startsAt,
  endsAt,
  url,
  opensMinutes,
  className,
}: {
  startsAt: number;
  endsAt: number;
  url: string;
  opensMinutes: number;
  className?: string;
}) {
  const now = useNow();
  const base = "flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold";
  const open = now !== null && now >= startsAt - opensMinutes * 60000 && now < endsAt;

  if (open && url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cn(base, "bg-gradient-to-b from-green-500 to-green-600 text-white shadow-sm hover:from-green-600 hover:to-green-700", className)}>
        <Icon name="external" className="h-4 w-4" /> Join class
      </a>
    );
  }
  const note = open
    ? "Your teacher will share the class link"
    : now !== null && now >= endsAt
      ? "Class finished"
      : `Join opens ${opensMinutes} min before class`;
  return (
    <span aria-disabled className={cn(base, "border border-slate-200 bg-slate-50 text-slate-500", className)}>
      <Icon name="clock" className="h-4 w-4" /> {note}
    </span>
  );
}
