import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, guardians, sessions, students, teachers, users } from "@/db";
import { DAY_MS } from "@/lib/constants";
import { getRawSettings } from "@/lib/settings";

const SESSION_COOKIE = "qa_session";
const SESSION_DAYS = 7;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type SessionOptions = {
  /** How long the session lasts. Default 7 days. */
  days?: number;
  /** Persistent cookies survive closing the browser. Default true. */
  persistent?: boolean;
  /** Marks a "keep me signed in" session so it appears under Remembered devices. */
  remembered?: boolean;
  userAgent?: string;
};

export async function createSession(userId: string, opts: SessionOptions = {}) {
  const { days = SESSION_DAYS, persistent = true, remembered = false, userAgent = "" } = opts;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + days * DAY_MS);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt, remembered, userAgent: userAgent.slice(0, 200) });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(persistent ? { expires: expiresAt } : {}),
  });
}

/** Hash identifying the current browser's session, used to keep it when signing out other devices. */
export async function currentSessionId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? hashToken(token) : null;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

export type CurrentUser = { id: string; email: string; name: string; role: (typeof users.$inferSelect)["role"] };

/** The signed-in, active user for this request (or null). Memoised per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date()), eq(users.active, true)))
    .limit(1);

  return row ?? null;
});

/**
 * Authorisation gate. Call it at the top of every admin page AND every admin
 * server action: layouts do not re-run on client navigation, and server actions
 * are public HTTP endpoints, so the proxy check alone is not enough.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/admin/login?error=forbidden");
  return user;
}

export type CurrentTeacher = CurrentUser & { teacherId: string; timezone: string };

/**
 * Same idea as requireAdmin(), for the teacher portal. Resolves the linked teacher record too.
 * Memoised per request, so the layout and the page share one lookup.
 */
export const requireTeacher = cache(async (): Promise<CurrentTeacher> => {
  const user = await getCurrentUser();
  if (!user) redirect("/teacher/login");
  if (user.role !== "teacher") redirect("/teacher/login?error=forbidden");

  const [teacher] = await db
    .select({ id: teachers.id, active: teachers.active, timezone: teachers.timezone })
    .from(teachers)
    .where(eq(teachers.userId, user.id))
    .limit(1);
  if (!teacher || !teacher.active) redirect("/teacher/login?error=forbidden");

  return { ...user, teacherId: teacher.id, timezone: teacher.timezone };
});

export type CurrentParent = CurrentUser & {
  guardianId: string;
  /** The name to greet: the parent's own name, or the child's name for a student account. */
  guardianName: string;
  username: string | null;
  /** The family's own time zone, used to show class times. */
  timezone: string;
  notificationsSeenAt: Date | null;
  /** Set for student accounts: the only child this login may see. Null for parents. */
  studentId: string | null;
};

/**
 * Gate for the family portal. Parents see all of their children; a student
 * account sees only its own record (but still uses the family's time zone).
 */
export const requireParent = cache(async (): Promise<CurrentParent> => {
  const user = await getCurrentUser();
  if (!user) redirect("/student/login");
  if (user.role !== "parent" && user.role !== "student") redirect("/student/login?error=forbidden");

  let guardianId: string;
  let guardianName: string;
  let guardianTz = "";
  let studentId: string | null = null;

  if (user.role === "parent") {
    const [guardian] = await db
      .select({ id: guardians.id, name: guardians.name, timezone: guardians.timezone })
      .from(guardians)
      .where(eq(guardians.userId, user.id))
      .limit(1);
    if (!guardian) redirect("/student/login?error=forbidden");
    ({ id: guardianId, name: guardianName, timezone: guardianTz } = guardian);
  } else {
    const [child] = await db
      .select({ id: students.id, name: students.name, guardianId: students.guardianId, timezone: students.timezone })
      .from(students)
      .where(eq(students.userId, user.id))
      .limit(1);
    if (!child || !child.guardianId) redirect("/student/login?error=forbidden");
    const [guardian] = await db.select({ timezone: guardians.timezone }).from(guardians).where(eq(guardians.id, child.guardianId)).limit(1);
    guardianId = child.guardianId;
    guardianName = child.name;
    guardianTz = guardian?.timezone || child.timezone;
    studentId = child.id;
  }

  const [[account], [firstChild], settings] = await Promise.all([
    db.select({ username: users.username, seen: users.notificationsSeenAt }).from(users).where(eq(users.id, user.id)).limit(1),
    db.select({ timezone: students.timezone }).from(students).where(eq(students.guardianId, guardianId)).limit(1),
    getRawSettings(),
  ]);

  return {
    ...user,
    guardianId,
    guardianName,
    username: account?.username ?? null,
    timezone: guardianTz || firstChild?.timezone || settings.adminTimezone,
    notificationsSeenAt: account?.seen ?? null,
    studentId,
  };
});
