import "server-only";
import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { availabilitySlots, classSessions, db } from "@/db";
import { addDays, dayRange, formatTime12, fromLocalInput, weekdayAndMinutes } from "@/lib/admin/time";
import { BUSY_STATUSES, MIN_NOTICE_MINUTES, SLOT_MINUTES } from "./constants";

export type Slot = {
  /** ISO instant, sent back to the server when chosen. */
  iso: string;
  label: string;
  /** Student's local time, when their time zone is known. */
  studentLabel: string | null;
  available: boolean;
  /** Why a slot cannot be chosen. */
  reason: string | null;
};

type Ctx = {
  teacherId: string;
  teacherTz: string;
  studentId: string;
  studentTz: string;
  durationMin: number;
  /** The class(es) being moved, so they do not block their own old slots. */
  excludeClassIds: string[];
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Everything needed to judge whether a start time works, loaded once per day. */
async function loadDay(ctx: Ctx, dateKey: string) {
  const [from, to] = dayRange(addDays(dateKey, -1), addDays(dateKey, 2), ctx.teacherTz);
  const [mine, student, avail] = await Promise.all([
    db
      .select({ id: classSessions.id, startsAt: classSessions.startsAt, durationMin: classSessions.durationMin })
      .from(classSessions)
      .where(
        and(
          eq(classSessions.teacherId, ctx.teacherId),
          inArray(classSessions.status, [...BUSY_STATUSES]),
          gte(classSessions.startsAt, from),
          lt(classSessions.startsAt, to),
        ),
      ),
    db
      .select({ id: classSessions.id, startsAt: classSessions.startsAt, durationMin: classSessions.durationMin })
      .from(classSessions)
      .where(
        and(
          eq(classSessions.studentId, ctx.studentId),
          inArray(classSessions.status, [...BUSY_STATUSES]),
          gte(classSessions.startsAt, from),
          lt(classSessions.startsAt, to),
        ),
      ),
    db.select().from(availabilitySlots).where(eq(availabilitySlots.teacherId, ctx.teacherId)),
  ]);
  return { mine, student, avail };
}

type DayData = Awaited<ReturnType<typeof loadDay>>;

function judge(ctx: Ctx, data: DayData, start: Date): string | null {
  const startMs = start.getTime();
  const endMs = startMs + ctx.durationMin * 60000;

  if (startMs < Date.now() + MIN_NOTICE_MINUTES * 60000) {
    return `Too soon. Classes need at least ${MIN_NOTICE_MINUTES} minutes' notice`;
  }

  if (data.avail.length > 0) {
    const begin = weekdayAndMinutes(start, ctx.teacherTz);
    const finish = weekdayAndMinutes(new Date(endMs - 1), ctx.teacherTz);
    const sameDay = begin.weekday === finish.weekday;
    const fits = data.avail.some(
      (a) => a.weekday === begin.weekday && sameDay && begin.minutes >= toMinutes(a.startTime) && finish.minutes < toMinutes(a.endTime),
    );
    if (!fits) return "Outside your availability";
  }

  const clash = (rows: DayData["mine"]) =>
    rows.some((c) => !ctx.excludeClassIds.includes(c.id) && c.startsAt.getTime() < endMs && c.startsAt.getTime() + c.durationMin * 60000 > startMs);
  if (clash(data.mine)) return "You already have a class then";
  if (clash(data.student)) return "The student already has a class then";
  return null;
}

/** Every slot of the given local day, each marked available or blocked with a reason. */
export async function slotsForDay(ctx: Ctx, dateKey: string): Promise<Slot[]> {
  const data = await loadDay(ctx, dateKey);
  const out: Slot[] = [];
  for (let m = 0; m < 24 * 60; m += SLOT_MINUTES) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const start = fromLocalInput(`${dateKey}T${hh}:${mm}`, ctx.teacherTz);
    if (!start) continue;
    const reason = judge(ctx, data, start);
    out.push({
      iso: start.toISOString(),
      label: formatTime12(start, ctx.teacherTz),
      studentLabel: ctx.studentTz && ctx.studentTz !== ctx.teacherTz ? formatTime12(start, ctx.studentTz) : null,
      available: reason === null,
      reason,
    });
  }
  return out;
}

/** Server-side re-check of one chosen start time. Returns an error message or null. */
export async function checkSlot(ctx: Ctx, start: Date, dateKey: string): Promise<string | null> {
  const data = await loadDay(ctx, dateKey);
  return judge(ctx, data, start);
}
