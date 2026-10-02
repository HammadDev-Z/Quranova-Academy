import "server-only";
import { desc, eq } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import {
  classSessions,
  classStatuses,
  courses,
  db,
  faqs,
  guardians,
  invoices,
  invoiceStatuses,
  leadStatuses,
  leads,
  packages,
  posts,
  progressReports,
  studentStatuses,
  students,
  teachers,
  testimonials,
} from "@/db";
import type { ColumnDef, FieldDef, FilterDef, Option } from "./fields";
import { formatLabel } from "./fields";
import { slugify } from "./format";
import { todayKey } from "./time";

export type SaveContext = { existing?: Record<string, unknown>; tz: string };

export type Resource = {
  key: string;
  label: string;
  singular: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: SQLiteTable & Record<string, any>;
  fields: FieldDef[];
  columns: ColumnDef[];
  searchColumns: string[];
  sort: { column: string; dir: "asc" | "desc" };
  filters?: FilterDef[];
  /** Saving or deleting refreshes the public website. */
  publicSite?: boolean;
  exportable?: boolean;
  beforeSave?: (values: Record<string, unknown>, ctx: SaveContext) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeDelete?: (id: string) => Promise<void>;
};

const opts = (list: readonly string[]): Option[] => list.map((v) => ({ value: v, label: formatLabel(v) }));
const genders: Option[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const publishedField: FieldDef = {
  name: "published",
  label: "Published on the website",
  type: "checkbox",
  initial: "on",
};
const sortField: FieldDef = {
  name: "sortOrder",
  label: "Display order",
  type: "number",
  hint: "Lower numbers appear first",
  half: true,
  initial: "0",
};

export const paymentMethods: Option[] = ["Bank transfer", "Cash", "Card", "PayPal", "JazzCash", "Easypaisa", "Other"].map((m) => ({
  value: m,
  label: m,
}));

async function nextInvoiceNumber() {
  const [last] = await db.select({ number: invoices.number }).from(invoices).orderBy(desc(invoices.number)).limit(1);
  const n = last ? parseInt(last.number.replace(/\D/g, ""), 10) || 0 : 0;
  return `INV-${String(n + 1).padStart(4, "0")}`;
}

export const resources: Record<string, Resource> = {
  leads: {
    key: "leads",
    label: "Leads",
    singular: "lead",
    description: "Free-trial requests and contact messages from the website.",
    table: leads,
    exportable: true,
    searchColumns: ["parentName", "studentName", "email", "phone", "country", "course"],
    sort: { column: "createdAt", dir: "desc" },
    filters: [
      { name: "status", label: "Status", options: opts(leadStatuses) },
      {
        name: "type",
        label: "Type",
        options: [
          { value: "trial", label: "Trial request" },
          { value: "contact", label: "Contact message" },
        ],
      },
    ],
    columns: [
      { key: "createdAt", label: "Received", kind: "datetime" },
      { key: "parentName", label: "Parent / contact", kind: "text", primary: true, sub: "email" },
      { key: "studentName", label: "Student", kind: "text", sub: "course" },
      { key: "phone", label: "Phone / WhatsApp", kind: "text" },
      { key: "type", label: "Type", kind: "badge" },
      { key: "status", label: "Status", kind: "badge" },
    ],
    fields: [
      { name: "status", label: "Status", type: "select", options: opts(leadStatuses), required: true, initial: "new", half: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "trial", label: "Trial request" },
          { value: "contact", label: "Contact message" },
        ],
        required: true,
        initial: "trial",
        half: true,
      },
      { name: "parentName", label: "Parent / guardian name", type: "text", half: true },
      { name: "studentName", label: "Student name", type: "text", half: true },
      { name: "studentAge", label: "Student age", type: "number", nullable: true, half: true },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "phone", label: "Phone / WhatsApp", type: "tel", half: true },
      { name: "country", label: "Country", type: "text", half: true },
      { name: "timezone", label: "Time zone", type: "text", half: true },
      { name: "course", label: "Course interested in", type: "text", half: true },
      { name: "teacherPreference", label: "Teacher preference", type: "text", half: true },
      { name: "preferredTime", label: "Preferred class times", type: "text" },
      { name: "message", label: "Message", type: "textarea" },
      { name: "notes", label: "Internal notes", type: "textarea", hint: "Only visible to admins" },
    ],
  },

  students: {
    key: "students",
    label: "Students",
    singular: "student",
    description: "Everyone who is learning, or trialling, with the academy.",
    table: students,
    exportable: true,
    searchColumns: ["name", "country", "notes"],
    sort: { column: "name", dir: "asc" },
    filters: [{ name: "status", label: "Status", options: opts(studentStatuses) }],
    columns: [
      { key: "name", label: "Student", kind: "text", primary: true, sub: "country" },
      { key: "status", label: "Status", kind: "badge" },
      { key: "guardianId", label: "Parent / guardian", kind: "ref", ref: "guardians" },
      { key: "courseId", label: "Course", kind: "ref", ref: "courses" },
      { key: "teacherId", label: "Teacher", kind: "ref", ref: "teachers" },
      { key: "packageId", label: "Package", kind: "ref", ref: "packages" },
    ],
    fields: [
      { name: "name", label: "Student name", type: "text", required: true, half: true },
      { name: "status", label: "Status", type: "select", options: opts(studentStatuses), required: true, initial: "trial", half: true },
      { name: "age", label: "Age", type: "number", nullable: true, half: true },
      { name: "gender", label: "Gender", type: "select", options: genders, nullable: true, half: true },
      { name: "guardianId", label: "Parent / guardian", type: "select", optionsFrom: "guardians", half: true },
      { name: "startDate", label: "Start date", type: "date", half: true },
      { name: "country", label: "Country", type: "text", half: true },
      { name: "timezone", label: "Time zone", type: "text", placeholder: "e.g. Europe/London", half: true },
      { name: "courseId", label: "Main course", type: "select", optionsFrom: "courses", half: true },
      { name: "teacherId", label: "Teacher", type: "select", optionsFrom: "teachers", half: true },
      { name: "packageId", label: "Package", type: "select", optionsFrom: "packages", half: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    beforeDelete: async (id) => {
      await db.delete(classSessions).where(eq(classSessions.studentId, id));
      await db.delete(progressReports).where(eq(progressReports.studentId, id));
      await db.update(invoices).set({ studentId: null }).where(eq(invoices.studentId, id));
      await db.update(leads).set({ studentId: null }).where(eq(leads.studentId, id));
    },
  },

  guardians: {
    key: "guardians",
    label: "Parents",
    singular: "parent",
    description: "Parents and guardians. Link each student to one.",
    table: guardians,
    exportable: true,
    searchColumns: ["name", "email", "phone", "country"],
    sort: { column: "name", dir: "asc" },
    columns: [
      { key: "name", label: "Name", kind: "text", primary: true, sub: "email" },
      { key: "phone", label: "Phone / WhatsApp", kind: "text" },
      { key: "country", label: "Country", kind: "text" },
      { key: "timezone", label: "Time zone", kind: "text" },
      { key: "createdAt", label: "Added", kind: "date" },
    ],
    fields: [
      { name: "name", label: "Full name", type: "text", required: true, half: true },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "phone", label: "Phone / WhatsApp", type: "tel", half: true },
      { name: "country", label: "Country", type: "text", half: true },
      { name: "timezone", label: "Time zone", type: "text", placeholder: "e.g. Europe/London", half: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    beforeDelete: async (id) => {
      await db.update(students).set({ guardianId: null }).where(eq(students.guardianId, id));
    },
  },

  teachers: {
    key: "teachers",
    label: "Teachers",
    singular: "teacher",
    description: "Your teaching staff. Turn on “Show on website” to publish a profile.",
    table: teachers,
    exportable: true,
    searchColumns: ["name", "email", "phone", "title"],
    sort: { column: "name", dir: "asc" },
    publicSite: true,
    columns: [
      { key: "name", label: "Teacher", kind: "text", primary: true, sub: "title" },
      { key: "gender", label: "Gender", kind: "badge" },
      { key: "phone", label: "Phone", kind: "text" },
      { key: "timezone", label: "Time zone", kind: "text" },
      { key: "active", label: "Active", kind: "bool" },
      { key: "showOnWebsite", label: "On website", kind: "bool" },
    ],
    fields: [
      { name: "name", label: "Full name", type: "text", required: true, half: true },
      { name: "gender", label: "Gender", type: "select", options: genders, required: true, initial: "male", half: true },
      { name: "title", label: "Title", type: "text", initial: "Quran teacher", half: true },
      { name: "timezone", label: "Time zone", type: "text", initial: "Asia/Karachi", half: true },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "phone", label: "Phone / WhatsApp", type: "tel", half: true },
      { name: "qualifications", label: "Qualifications", type: "list", hint: "One per line", half: true },
      { name: "languages", label: "Languages", type: "list", hint: "One per line", half: true },
      { name: "bio", label: "Public bio", type: "textarea", hint: "Shown on the website if “Show on website” is on" },
      { name: "availability", label: "Availability", type: "textarea", hint: "Days and times this teacher can teach" },
      { name: "notes", label: "Internal notes", type: "textarea" },
      { name: "active", label: "Active (can be assigned classes)", type: "checkbox", initial: "on", half: true },
      { name: "showOnWebsite", label: "Show profile on the website", type: "checkbox", half: true },
      sortField,
    ],
    beforeDelete: async (id) => {
      await db.update(students).set({ teacherId: null }).where(eq(students.teacherId, id));
      await db.update(classSessions).set({ teacherId: null }).where(eq(classSessions.teacherId, id));
      await db.update(progressReports).set({ teacherId: null }).where(eq(progressReports.teacherId, id));
    },
  },

  courses: {
    key: "courses",
    label: "Courses",
    singular: "course",
    description: "Courses shown on the public website.",
    table: courses,
    publicSite: true,
    searchColumns: ["title", "slug", "short"],
    sort: { column: "sortOrder", dir: "asc" },
    columns: [
      { key: "title", label: "Course", kind: "text", primary: true, sub: "slug" },
      { key: "level", label: "Level", kind: "text" },
      { key: "published", label: "Published", kind: "bool" },
      { key: "sortOrder", label: "Order", kind: "text" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, half: true },
      { name: "slug", label: "URL slug", type: "text", hint: "Leave blank to generate from the title", half: true },
      { name: "arabic", label: "Arabic title", type: "text", half: true },
      { name: "level", label: "Level", type: "text", placeholder: "e.g. Beginner", half: true },
      { name: "audience", label: "Suitable for", type: "text" },
      { name: "short", label: "Short description", type: "text", required: true },
      { name: "intro", label: "Introduction", type: "textarea", rows: 5 },
      { name: "outcomes", label: "What students achieve", type: "list", hint: "One per line", half: true, rows: 6 },
      { name: "syllabus", label: "What is covered", type: "list", hint: "One per line", half: true, rows: 6 },
      publishedField,
      sortField,
    ],
    beforeSave: (v) => ({ ...v, slug: slugify(String(v.slug || v.title)) }),
    beforeDelete: async (id) => {
      await db.update(students).set({ courseId: null }).where(eq(students.courseId, id));
      await db.update(classSessions).set({ courseId: null }).where(eq(classSessions.courseId, id));
    },
  },

  packages: {
    key: "packages",
    label: "Packages",
    singular: "package",
    description: "Monthly plans and prices. Prices are in GBP.",
    table: packages,
    publicSite: true,
    searchColumns: ["name"],
    sort: { column: "sortOrder", dir: "asc" },
    columns: [
      { key: "name", label: "Package", kind: "text", primary: true, sub: "blurb" },
      { key: "priceMinor", label: "Price / month", kind: "money" },
      { key: "classesPerMonth", label: "Classes / month", kind: "text" },
      { key: "popular", label: "Most popular", kind: "bool" },
      { key: "published", label: "Published", kind: "bool" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g. 3 Days a Week", half: true },
      { name: "price", column: "priceMinor", label: "Price per month (£)", type: "money", required: true, half: true },
      { name: "classesPerMonth", label: "Classes per month", type: "number", required: true, half: true },
      { name: "blurb", label: "Tagline", type: "text", placeholder: "e.g. Great steady pace", half: true },
      { name: "popular", label: "Mark as “Most popular”", type: "checkbox", half: true },
      publishedField,
      sortField,
    ],
    beforeDelete: async (id) => {
      await db.update(students).set({ packageId: null }).where(eq(students.packageId, id));
    },
  },

  faqs: {
    key: "faqs",
    label: "FAQs",
    singular: "FAQ",
    description: "Questions and answers shown on the website.",
    table: faqs,
    publicSite: true,
    searchColumns: ["question", "answer"],
    sort: { column: "sortOrder", dir: "asc" },
    columns: [
      { key: "question", label: "Question", kind: "text", primary: true },
      { key: "published", label: "Published", kind: "bool" },
      { key: "sortOrder", label: "Order", kind: "text" },
    ],
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Answer", type: "textarea", required: true, rows: 5 },
      publishedField,
      sortField,
    ],
  },

  testimonials: {
    key: "testimonials",
    label: "Reviews",
    singular: "review",
    description: "Parent and student reviews. Only add real reviews.",
    table: testimonials,
    publicSite: true,
    searchColumns: ["name", "quote", "location"],
    sort: { column: "sortOrder", dir: "asc" },
    columns: [
      { key: "name", label: "Name", kind: "text", primary: true, sub: "location" },
      { key: "quote", label: "Review", kind: "text" },
      { key: "published", label: "Published", kind: "bool" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "location", label: "Location", type: "text", placeholder: "e.g. Manchester, UK", half: true },
      { name: "quote", label: "Review", type: "textarea", required: true },
      publishedField,
      sortField,
    ],
  },

  posts: {
    key: "posts",
    label: "Blog posts",
    singular: "post",
    description: "Articles on the public blog. Write in Markdown.",
    table: posts,
    publicSite: true,
    searchColumns: ["title", "slug", "category"],
    sort: { column: "createdAt", dir: "desc" },
    filters: [
      {
        name: "published",
        label: "State",
        options: [
          { value: "1", label: "Published" },
          { value: "0", label: "Draft" },
        ],
      },
    ],
    columns: [
      { key: "title", label: "Title", kind: "text", primary: true, sub: "slug" },
      { key: "category", label: "Category", kind: "text" },
      { key: "published", label: "Published", kind: "bool" },
      { key: "publishedAt", label: "Date", kind: "date" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, half: true },
      { name: "slug", label: "URL slug", type: "text", hint: "Leave blank to generate from the title", half: true },
      { name: "category", label: "Category", type: "text", initial: "Learning", half: true },
      { name: "published", label: "Published (visible on the website)", type: "checkbox", half: true },
      { name: "description", label: "Summary (used in search results)", type: "textarea", required: true, rows: 3 },
      {
        name: "content",
        label: "Article (Markdown)",
        type: "markdown",
        required: true,
        rows: 20,
        hint: "Use ## for headings, - for bullet lists, [text](/free-trial) for links",
      },
    ],
    beforeSave: (v, ctx) => ({
      ...v,
      slug: slugify(String(v.slug || v.title)),
      publishedAt: v.published ? ((ctx.existing?.publishedAt as Date | null) ?? new Date()) : (ctx.existing?.publishedAt ?? null),
    }),
  },

  classes: {
    key: "classes",
    label: "Classes",
    singular: "class",
    description: "Scheduled lessons.",
    table: classSessions,
    exportable: true,
    searchColumns: [],
    sort: { column: "startsAt", dir: "desc" },
    columns: [
      { key: "startsAt", label: "When", kind: "datetime", primary: true },
      { key: "studentId", label: "Student", kind: "ref", ref: "students" },
      { key: "teacherId", label: "Teacher", kind: "ref", ref: "teachers" },
      { key: "status", label: "Status", kind: "badge" },
    ],
    fields: [
      { name: "studentId", label: "Student", type: "select", optionsFrom: "students", required: true, half: true },
      { name: "teacherId", label: "Teacher", type: "select", optionsFrom: "teachers", half: true },
      { name: "startsAt", label: "Starts (admin time zone)", type: "datetime", required: true, half: true },
      { name: "durationMin", label: "Duration (minutes)", type: "number", required: true, initial: "30", half: true },
      { name: "courseId", label: "Course", type: "select", optionsFrom: "courses", half: true },
      { name: "status", label: "Status", type: "select", options: opts(classStatuses), required: true, initial: "scheduled", half: true },
      { name: "isTrial", label: "This is a free trial class", type: "checkbox", half: true },
      { name: "meetingUrl", label: "Meeting link", type: "url", placeholder: "https://meet.google.com/…", half: true },
      { name: "lessonNotes", label: "Lesson notes", type: "textarea", hint: "What was covered" },
      { name: "homework", label: "Homework", type: "textarea" },
    ],
  },

  reports: {
    key: "reports",
    label: "Progress reports",
    singular: "report",
    description: "Monthly progress reports for each student.",
    table: progressReports,
    searchColumns: ["covered", "strengths", "improvements"],
    sort: { column: "month", dir: "desc" },
    columns: [
      { key: "month", label: "Month", kind: "text", primary: true },
      { key: "studentId", label: "Student", kind: "ref", ref: "students" },
      { key: "teacherId", label: "Teacher", kind: "ref", ref: "teachers" },
      { key: "rating", label: "Rating (1-5)", kind: "text" },
    ],
    fields: [
      { name: "studentId", label: "Student", type: "select", optionsFrom: "students", required: true, half: true },
      { name: "teacherId", label: "Teacher", type: "select", optionsFrom: "teachers", half: true },
      { name: "month", label: "Month", type: "month", required: true, half: true },
      {
        name: "rating",
        label: "Overall rating",
        type: "select",
        nullable: true,
        options: [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} / 5` })),
        half: true,
      },
      { name: "covered", label: "What was covered", type: "textarea", rows: 4 },
      { name: "strengths", label: "Strengths", type: "textarea", rows: 3 },
      { name: "improvements", label: "Areas to improve", type: "textarea", rows: 3 },
    ],
    beforeSave: (v) => ({ ...v, rating: v.rating ? Number(v.rating) : null }),
  },

  invoices: {
    key: "invoices",
    label: "Invoices",
    singular: "invoice",
    description: "Fees you have billed, and what has been paid.",
    table: invoices,
    exportable: true,
    searchColumns: ["number", "description", "reference"],
    sort: { column: "createdAt", dir: "desc" },
    filters: [{ name: "status", label: "Status", options: opts(invoiceStatuses) }],
    columns: [
      { key: "number", label: "Invoice", kind: "text", primary: true, sub: "description" },
      { key: "studentId", label: "Student", kind: "ref", ref: "students" },
      { key: "amountMinor", label: "Amount", kind: "money", currencyKey: "currency" },
      { key: "dueOn", label: "Due", kind: "date" },
      { key: "status", label: "Status", kind: "badge" },
    ],
    fields: [
      { name: "studentId", label: "Student", type: "select", optionsFrom: "students", half: true },
      { name: "description", label: "Description", type: "text", required: true, placeholder: "e.g. October fees, 3 days a week", half: true },
      { name: "amount", column: "amountMinor", label: "Amount", type: "money", required: true, half: true },
      {
        name: "currency",
        label: "Currency",
        type: "select",
        options: ["GBP", "USD", "EUR", "AUD", "CAD", "PKR"].map((c) => ({ value: c, label: c })),
        required: true,
        initial: "GBP",
        half: true,
      },
      { name: "issuedOn", label: "Issued on", type: "date", required: true, initial: "today", half: true },
      { name: "dueOn", label: "Due on", type: "date", required: true, initial: "today+7", half: true },
      { name: "status", label: "Status", type: "select", options: opts(invoiceStatuses), required: true, initial: "unpaid", half: true },
      { name: "paidOn", label: "Paid on", type: "date", hint: "Filled in automatically when marked paid", half: true },
      { name: "method", label: "Payment method", type: "select", options: paymentMethods, half: true },
      { name: "reference", label: "Payment reference", type: "text", half: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    beforeSave: async (v, ctx) => {
      const out = { ...v };
      if (!ctx.existing) out.number = await nextInvoiceNumber();
      if (out.status === "paid" && !out.paidOn) out.paidOn = todayKey(ctx.tz);
      if (out.status !== "paid") out.paidOn = "";
      return out;
    },
  },
};

export const resourceList = Object.values(resources);
export const getResource = (key: string) => resources[key];
