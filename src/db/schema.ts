import { randomUUID } from "node:crypto";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());
const bool = (name: string, def = true) => integer(name, { mode: "boolean" }).notNull().default(def);
const list = (name: string) => text(name, { mode: "json" }).$type<string[]>().notNull().$defaultFn(() => []);

/* ───────── Accounts ───────── */

export const roles = ["admin", "teacher", "student", "parent"] as const;
export type Role = (typeof roles)[number];

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: roles }).notNull().default("admin"),
  active: bool("active"),
  phone: text("phone").notNull().default(""),
  lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

export const sessions = sqliteTable("sessions", {
  // SHA-256 of the cookie token, so a leaked database cannot be used to log in.
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt(),
});

/* ───────── Website content ───────── */

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const courses = sqliteTable("courses", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  arabic: text("arabic").notNull().default(""),
  short: text("short").notNull(),
  audience: text("audience").notNull().default(""),
  level: text("level").notNull().default(""),
  intro: text("intro").notNull().default(""),
  outcomes: list("outcomes"),
  syllabus: list("syllabus"),
  published: bool("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const packages = sqliteTable("packages", {
  id: id(),
  name: text("name").notNull(),
  // Pence, always GBP. Other currencies are shown as indicative on the site.
  priceMinor: integer("price_minor").notNull(),
  classesPerMonth: integer("classes_per_month").notNull(),
  blurb: text("blurb").notNull().default(""),
  popular: bool("popular", false),
  published: bool("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const faqs = sqliteTable("faqs", {
  id: id(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  published: bool("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const testimonials = sqliteTable("testimonials", {
  id: id(),
  quote: text("quote").notNull(),
  name: text("name").notNull(),
  location: text("location").notNull().default(""),
  published: bool("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const posts = sqliteTable("posts", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("Learning"),
  content: text("content").notNull(),
  published: bool("published", false),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ───────── People ───────── */

export const teachers = sqliteTable("teachers", {
  id: id(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  title: text("title").notNull().default("Quran teacher"),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  timezone: text("timezone").notNull().default("Asia/Karachi"),
  qualifications: list("qualifications"),
  languages: list("languages"),
  bio: text("bio").notNull().default(""),
  availability: text("availability").notNull().default(""),
  notes: text("notes").notNull().default(""),
  active: bool("active"),
  showOnWebsite: bool("show_on_website", false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const guardians = sqliteTable("guardians", {
  id: id(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  country: text("country").notNull().default(""),
  timezone: text("timezone").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
});

export const studentStatuses = ["trial", "active", "paused", "completed", "left"] as const;

export const students = sqliteTable("students", {
  id: id(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  guardianId: text("guardian_id").references(() => guardians.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender", { enum: ["male", "female"] }),
  country: text("country").notNull().default(""),
  timezone: text("timezone").notNull().default(""),
  status: text("status", { enum: studentStatuses }).notNull().default("trial"),
  courseId: text("course_id").references(() => courses.id, { onDelete: "set null" }),
  teacherId: text("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
  packageId: text("package_id").references(() => packages.id, { onDelete: "set null" }),
  startDate: text("start_date").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ───────── Sales ───────── */

export const leadStatuses = ["new", "contacted", "trial_scheduled", "trial_done", "enrolled", "lost"] as const;

export const leads = sqliteTable("leads", {
  id: id(),
  type: text("type", { enum: ["trial", "contact"] }).notNull(),
  status: text("status", { enum: leadStatuses }).notNull().default("new"),
  parentName: text("parent_name").notNull().default(""),
  studentName: text("student_name").notNull().default(""),
  studentAge: integer("student_age"),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  country: text("country").notNull().default(""),
  timezone: text("timezone").notNull().default(""),
  course: text("course").notNull().default(""),
  teacherPreference: text("teacher_preference").notNull().default(""),
  preferredTime: text("preferred_time").notNull().default(""),
  message: text("message").notNull().default(""),
  notes: text("notes").notNull().default(""),
  studentId: text("student_id").references(() => students.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ───────── Teaching ───────── */

export const classStatuses = ["scheduled", "completed", "missed_student", "missed_teacher", "cancelled"] as const;

export const classSessions = sqliteTable("class_sessions", {
  id: id(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
  courseId: text("course_id").references(() => courses.id, { onDelete: "set null" }),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  durationMin: integer("duration_min").notNull().default(30),
  status: text("status", { enum: classStatuses }).notNull().default("scheduled"),
  isTrial: bool("is_trial", false),
  meetingUrl: text("meeting_url").notNull().default(""),
  lessonNotes: text("lesson_notes").notNull().default(""),
  homework: text("homework").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const progressReports = sqliteTable("progress_reports", {
  id: id(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
  month: text("month").notNull(), // YYYY-MM
  covered: text("covered").notNull().default(""),
  strengths: text("strengths").notNull().default(""),
  improvements: text("improvements").notNull().default(""),
  rating: integer("rating"), // 1-5
  createdAt: createdAt(),
});

/* ───────── Money ───────── */

export const invoiceStatuses = ["unpaid", "paid", "void"] as const;

export const invoices = sqliteTable("invoices", {
  id: id(),
  number: text("number").notNull().unique(),
  studentId: text("student_id").references(() => students.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("GBP"),
  issuedOn: text("issued_on").notNull(),
  dueOn: text("due_on").notNull(),
  status: text("status", { enum: invoiceStatuses }).notNull().default("unpaid"),
  paidOn: text("paid_on").notNull().default(""),
  method: text("method").notNull().default(""),
  reference: text("reference").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
});

/* ───────── Audit ───────── */

export const activity = sqliteTable("activity", {
  id: id(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  userName: text("user_name").notNull().default(""),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull().default(""),
  summary: text("summary").notNull().default(""),
  createdAt: createdAt(),
});
