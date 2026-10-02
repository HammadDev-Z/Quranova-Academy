// Date helpers. Class times are stored as UTC instants; the admin enters and
// reads them in one configured time zone (Settings -> Admin time zone).

function parts(ms: number, tz: string) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value;
  return o;
}

/** Offset (ms) of `tz` from UTC at the given instant. */
function offsetAt(ms: number, tz: string) {
  const p = parts(ms, tz);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return asUtc - Math.floor(ms / 60000) * 60000;
}

export function safeZone(tz: string): string {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/** "2026-10-05T17:30" typed in `tz` -> the real UTC Date. */
export function fromLocalInput(value: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const zone = safeZone(tz);
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let result = naive - offsetAt(naive, zone);
  result = naive - offsetAt(result, zone); // second pass handles DST edges
  return new Date(result);
}

/** Date -> value for <input type="datetime-local"> in `tz`. */
export function toLocalInput(date: Date, tz: string): string {
  const p = parts(date.getTime(), safeZone(tz));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function formatDateTime(date: Date | null | undefined, tz: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: safeZone(tz),
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatTimeOnly(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: safeZone(tz),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatDay(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: safeZone(tz),
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** yyyy-mm-dd for a Date in `tz`. */
export function dayKey(date: Date, tz: string): string {
  const p = parts(date.getTime(), safeZone(tz));
  return `${p.year}-${p.month}-${p.day}`;
}

export const todayKey = (tz: string) => dayKey(new Date(), tz);

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Monday (yyyy-mm-dd) of the week containing `key`. */
export function startOfWeek(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Mon=0
  return addDays(key, -dow);
}

export const monthKey = (tz: string) => todayKey(tz).slice(0, 7);

export function formatDateOnly(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Start/end instants (UTC) of the local day range [startKey, endKeyExclusive) in tz. */
export function dayRange(startKey: string, endKeyExclusive: string, tz: string): [Date, Date] {
  return [fromLocalInput(`${startKey}T00:00`, tz)!, fromLocalInput(`${endKeyExclusive}T00:00`, tz)!];
}

/** "10:30 PM" */
export function formatTime12(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: safeZone(tz),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** "02 Oct 2026" */
export function formatDateShort(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: safeZone(tz),
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** "Sat" */
export function formatWeekdayShort(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: safeZone(tz), weekday: "short" }).format(date);
}

/** Hour (0-23) of a Date in tz. */
export function hourOf(date: Date, tz: string): number {
  return Number(parts(date.getTime(), safeZone(tz)).hour);
}

/** Day of week in tz, 0 = Monday ... 6 = Sunday, and minutes since local midnight. */
export function weekdayAndMinutes(date: Date, tz: string): { weekday: number; minutes: number } {
  const zone = safeZone(tz);
  const p = parts(date.getTime(), zone);
  const key = `${p.year}-${p.month}-${p.day}`;
  const [y, m, d] = key.split("-").map(Number);
  const weekday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return { weekday, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

/** Morning / Afternoon / Evening / Night label for a class start time. */
export function shiftOf(date: Date, tz: string): "Morning" | "Afternoon" | "Evening" | "Night" {
  const h = hourOf(date, tz);
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17) return "Evening";
  return "Night";
}
