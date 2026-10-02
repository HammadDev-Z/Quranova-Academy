"use server";

import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, sessions, teachers as teachersTable, users } from "@/db";
import { logActivity } from "@/lib/admin/log";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword, passwordProblem, verifyPassword } from "./password";
import { createSession, destroySession, getCurrentUser, requireAdmin } from "./session";

export type AuthState = { ok?: boolean; message?: string; errors?: Record<string, string>; email?: string };

async function performLogin(formData: FormData, role: "admin" | "teacher", home: string): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { message: "Enter your email and password." };

  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`login:${email}:${ip}`, 8, 15 * 60 * 1000) || !rateLimit(`login-ip:${ip}`, 30, 15 * 60 * 1000)) {
    return { message: "Too many attempts. Please wait 15 minutes and try again.", email };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok || !user.active) return { message: "Incorrect email or password.", email };
  if (user.role !== role) return { message: `This account does not have access to the ${role} portal.`, email };

  await createSession(user.id);
  await logActivity({ id: user.id, email: user.email, name: user.name, role: user.role }, "login", "session", user.id, `${user.name} signed in`);
  redirect(home);
}

// Verified against when the email is unknown, so response time does not reveal
// which emails have accounts.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return performLogin(formData, "admin", "/admin");
}

export async function loginTeacher(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return performLogin(formData, "teacher", "/teacher");
}

async function performLogout(redirectTo: string) {
  await destroySession();
  redirect(redirectTo);
}

export async function logout() {
  await performLogout("/admin/login");
}

export async function logoutTeacher() {
  await performLogout("/teacher/login");
}

/* ───────── Admin accounts ───────── */

export async function changeOwnPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  // Any signed-in role can change their own password; the page itself is
  // already gated by requireAdmin()/requireTeacher().
  const me = await getCurrentUser();
  if (!me) return { message: "Your session has expired. Please sign in again." };
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

/* ───────── Teacher portal logins ───────── */

/** Creates a portal login for an existing teacher record, using their saved email. */
export async function createTeacherLogin(teacherId: string, _prev: AuthState, formData: FormData): Promise<AuthState> {
  const me = await requireAdmin();
  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, teacherId)).limit(1);
  if (!teacher) return { message: "Teacher not found." };
  if (teacher.userId) return { message: "This teacher already has a portal login." };
  if (!teacher.email) return { message: "Add an email address for this teacher first, then save and try again." };

  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { errors: { password: problem } };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, teacher.email)).limit(1);
  if (existing) return { message: `An account already exists for ${teacher.email}. Use a different email on the teacher record first.` };

  const [row] = await db
    .insert(users)
    .values({ name: teacher.name, email: teacher.email, passwordHash: await hashPassword(password), role: "teacher" })
    .returning({ id: users.id });
  await db.update(teachersTable).set({ userId: row.id }).where(eq(teachersTable.id, teacherId));
  await logActivity(me, "created", "user", row.id, `Created teacher portal login for ${teacher.email}`);
  revalidatePath(`/admin/teachers/${teacherId}`);
  return { ok: true, message: `Portal login created for ${teacher.email}. Share the password with them securely.` };
}
