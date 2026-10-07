// Plain constants for the family portal (kept out of "use server" files).

/** A family can mark a class as on leave only this long before it starts. */
export const LEAVE_NOTICE_MINUTES = 120;

/** The Join button becomes active this long before the class. */
export const JOIN_OPENS_MINUTES = 10;

/** How far ahead the Classes page looks. */
export const UPCOMING_DAYS = 60;

/** Where "Mark as On Leave" may send the family back to afterwards. */
export const LEAVE_RETURN_PATHS = ["/student", "/student/classes"] as const;
