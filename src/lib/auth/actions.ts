"use server";

import { and, eq, ne, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, guardians as guardiansTable, sessions, students as studentsTable, teachers as teachersTable, users } from "@/db";
import { logActivity } from "@/lib/admin/log";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword, passwordProblem, verifyPassword } from "./password";
import { createSession, destroySession, getCurrentUser, requireAdmin } from "./session";

export type AuthState = { ok?: boolean; message?: string; errors?: Record<string, string>; email?: string };

// Verified against when the account is unknown, so response time does not
// reveal which usernames or emails exist.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

const REMEMBER_DAYS = 10;

async function performLogin(formData: FormData, role: "admin" | "teacher" | "parent", home: string): Promise<AuthState> {
  // Staff sign in with an email. Families can also use their short username.
  const ident = String(formData.get("email") ?? formData.get("identifier") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!ident || !password) return { message: role === "parent" ? "Enter your username and password." : "Enter your email and password." };

  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`login:${ident}:${ip}`, 8, 15 * 60 * 1000) || !rateLimit(`login-ip:${ip}`, 30, 15 * 60 * 1000)) {
    return { message: "Too many attempts. Please wait 15 minutes and try again.", email: ident };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, ident), eq(sql`lower(${users.username})`, ident)))
    .limit(1);
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok || !user.active) return { message: role === "parent" ? "Incorrect username or password." : "Incorrect email or password.", email: ident };
  // The student portal accepts both parent and student accounts.
  const allowed = role === "parent" ? ["parent", "student"] : [role];
  if (!allowed.includes(user.role)) return { message: `This account does not have access to the ${role === "parent" ? "family" : role} portal.`, email: ident };

  // Families: "keep me signed in" lasts 10 days; otherwise the login ends with the browser (1 day at most).
  const remember = role === "parent" && formData.get("remember") === "on";
  await createSession(
    user.id,
    role === "parent"
      ? { days: remember ? REMEMBER_DAYS : 1, persistent: remember, remembered: remember, userAgent: h.get("user-agent") ?? "" }
      : { userAgent: h.get("user-agent") ?? "" },
  );
  await logActivity({ id: user.id, email: user.email, name: user.name, role: user.role }, "login", "session", user.id, `${user.name} signed in`);
  redirect(home);
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return performLogin(formData, "admin", "/admin");
}

export async function loginTeacher(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return performLogin(formData, "teacher", "/teacher");
}

export async function loginParent(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return performLogin(formData, "parent", "/student");
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

export async function logoutParent() {
  await performLogout("/student/login");
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

/* ───────── Family (parent) portal logins ───────── */

async function nextUsername(): Promise<string> {
  const rows = await db.select({ u: users.username }).from(users).where(sql`${users.username} like 'QN%'`);
  const top = rows.reduce((m, r) => Math.max(m, parseInt((r.u ?? "").slice(2), 10) || 0), 1000);
  return `QN${top + 1}`;
}

/**
 * Creates the family login for a parent record. The family signs in with the
 * generated username (or the parent's email, if one is on file).
 */
export async function createParentLogin(guardianId: string, _prev: AuthState, formData: FormData): Promise<AuthState> {
  const me = await requireAdmin();
  const [guardian] = await db.select().from(guardiansTable).where(eq(guardiansTable.id, guardianId)).limit(1);
  if (!guardian) return { message: "Parent not found." };
  if (guardian.userId) return { message: "This parent already has a portal login." };

  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { errors: { password: problem } };

  const username = await nextUsername();
  // users.email is required and unique. Parents without an email get a placeholder on a reserved
  // domain that can never receive mail; they sign in with their username.
  let email = guardian.email.trim().toLowerCase();
  if (email) {
    const [clash] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (clash) email = "";
  }
  if (!email) email = `${username.toLowerCase()}@family.invalid`;

  const [row] = await db
    .insert(users)
    .values({ name: guardian.name, email, username, passwordHash: await hashPassword(password), role: "parent" })
    .returning({ id: users.id });
  await db.update(guardiansTable).set({ userId: row.id }).where(eq(guardiansTable.id, guardianId));
  await logActivity(me, "created", "user", row.id, `Created student portal login ${username} for ${guardian.name}`);
  revalidatePath(`/admin/guardians/${guardianId}`);
  return { ok: true, message: `Family login created. Username: ${username}. Share it and the password with the parent securely.` };
}

/**
 * Creates a student login: a child who signs in to see only their own classes,
 * lessons and certificates. They use the same sign-in page as parents.
 */
export async function createStudentLogin(studentId: string, _prev: AuthState, formData: FormData): Promise<AuthState> {
  const me = await requireAdmin();
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId)).limit(1);
  if (!student) return { message: "Student not found." };
  if (student.userId) return { message: "This student already has a portal login." };
  if (!student.guardianId) return { message: "Link this student to a parent first. Student logins use the parent record for time zone and contact details." };

  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { errors: { password: problem } };

  const rows = await db.select({ u: users.username }).from(users).where(sql`${users.username} like 'QS%'`);
  const top = rows.reduce((m, r) => Math.max(m, parseInt((r.u ?? "").slice(2), 10) || 0), 1000);
  const username = `QS${top + 1}`;

  const [row] = await db
    .insert(users)
    .values({ name: student.name, email: `${username.toLowerCase()}@family.invalid`, username, passwordHash: await hashPassword(password), role: "student" })
    .returning({ id: users.id });
  await db.update(studentsTable).set({ userId: row.id }).where(eq(studentsTable.id, studentId));
  await logActivity(me, "created", "user", row.id, `Created student portal login ${username} for ${student.name}`);
  revalidatePath(`/admin/students/${studentId}`);
  return { ok: true, message: `Student login created. Username: ${username}. Share it and the password with the student securely.` };
}
