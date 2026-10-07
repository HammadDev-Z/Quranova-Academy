import { dayKey, safeZone } from "./time";

/** "05:00 PM" (zero-padded, as families see it) */
export function formatTimePadded(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: safeZone(tz), hour: "2-digit", minute: "2-digit", hour12: true }).format(date);
}

/** "Mon 5 Oct" */
export function formatDayShort(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: safeZone(tz), weekday: "short", day: "numeric", month: "short" }).format(date);
}

/** "Mon, 05 Oct" */
export function formatDayList(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: safeZone(tz), weekday: "short", day: "2-digit", month: "short" }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")}, ${get("day")} ${get("month")}`;
}

/** "Mon, 05 Oct 2026" */
export function formatDayListYear(date: Date, tz: string): string {
  return `${formatDayList(date, tz)} ${new Intl.DateTimeFormat("en-GB", { timeZone: safeZone(tz), year: "numeric" }).format(date)}`;
}

/** Month key (YYYY-MM) a date falls in, in tz. */
export function monthOf(date: Date, tz: string): string {
  return dayKey(date, tz).slice(0, 7);
}

