// Plain constants shared by the teacher actions and pages. Kept out of
// actions.ts because a "use server" file may only export async functions.
export const RESCHEDULE_WINDOW_DAYS = 30;
export const MAX_RESCHEDULES = 2;

/** Statuses that create a recovery class the teacher can reschedule. */
export const RECOVERY_STATUSES = ["missed_student", "missed_teacher", "student_leave", "teacher_leave"] as const;

/** Statuses that count as the class having been planned and still occupying the calendar. */
export const BUSY_STATUSES = ["scheduled", "completed"] as const;

/** Slots are offered in steps of this many minutes. */
export const SLOT_MINUTES = 30;

/** A class cannot be moved to a time less than this far in the future. */
export const MIN_NOTICE_MINUTES = 60;
