"use server";

import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, sessions, users } from "@/db";
import { logActivity } from "@/lib/admin/log";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword, passwordProblem, verifyPassword } from "./password";
import { createSession, destroySession, requireAdmin } from "./session";

export type AuthState = { ok?: boolean; message?: string; errors?: Record<string, string>; email?: string };

// Verified against when the email is unknown, so response time does not reveal
// which emails have accounts.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { message: "Enter your email and password." };

  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // 8 attempts per 15 minutes per email+IP, and 30 per IP.
  if (!rateLimit(`login:${email}:${ip}`, 8, 15 * 60 * 1000) || !rateLimit(`login-ip:${ip}`, 30, 15 * 60 * 1000)) {
    return { message: "Too many attempts. Please wait 15 minutes and try again.", email };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok || !user.active) return { message: "Incorrect email or password.", email };
  if (user.role !== "admin") return { message: "This account does not have access to the admin portal.", email };

  await createSession(user.id);
  await logActivity({ id: user.id, email: user.email, name: user.name, role: user.role }, "login", "session", user.id, `${user.name} signed in`);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ───────── Admin accounts ───────── */

export async function changeOwnPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const me = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const [row] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!row || !(await verifyPassword(current, row.passwordHash))) return { errors: { current: "Current password is incorrect" } };
  const problem = passwordProblem(next);
  if (problem) return { errors: { next: problem } };
  if (next !== confirm) return { errors: { confirm: "Passwords do not match" } };

  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, me.id));
  // Sign out every other session, keeping this one by recreating it.
  await db.delete(sessions).where(eq(sessions.userId, me.id));
  await createSession(me.id);
  await logActivity(me, "updated", "user", me.id, "Changed own password");
  return { ok: true, message: "Password updated. Other devices have been signed out." };
}

export async function createAdminUser(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const me = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const errors: Record<string, string> = {};

  if (name.length < 2) errors.name = "Enter a name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";
  const problem = passwordProblem(password);
  if (problem) errors.password = problem;
  if (Object.keys(errors).length) return { errors };

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists) return { errors: { email: "An account with this email already exists" } };

  const [row] = await db
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password), role: "admin" })
    .returning({ id: users.id });
  await logActivity(me, "created", "user", row.id, `Created admin account for ${email}`);
  revalidatePath("/admin/users");
  return { ok: true, message: `Account created for ${email}.` };
}

export async function resetUserPassword(userId: string, _prev: AuthState, formData: FormData): Promise<AuthState> {
  const me = await requireAdmin();
  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { errors: { password: problem } };

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { message: "User not found" };

  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await logActivity(me, "updated", "user", userId, `Reset password for ${target.email}`);
  return { ok: true, message: `Password reset for ${target.email}. They have been signed out.` };
}

export async function setUserActive(userId: string, active: boolean) {
  const me = await requireAdmin();
  if (userId === me.id) return; // you cannot lock yourself out

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return;

  if (!active && target.role === "admin") {
    const others = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, userId)));
    if (others.length === 0) return; // keep at least one active admin
  }

  await db.update(users).set({ active }).where(eq(users.id, userId));
  if (!active) await db.delete(sessions).where(eq(sessions.userId, userId));
  await logActivity(me, "updated", "user", userId, `${active ? "Reactivated" : "Deactivated"} ${target.email}`);
  revalidatePath("/admin/users");
}
