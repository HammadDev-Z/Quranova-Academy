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
