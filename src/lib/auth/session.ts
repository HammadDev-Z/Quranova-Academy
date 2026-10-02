import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, sessions, teachers, users } from "@/db";

export const SESSION_COOKIE = "qa_session";
const SESSION_DAYS = 7;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
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

/** Same idea as requireAdmin(), for the teacher portal. Resolves the linked teacher record too. */
export async function requireTeacher(): Promise<CurrentTeacher> {
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
}
