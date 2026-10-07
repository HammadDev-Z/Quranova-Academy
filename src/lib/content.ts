import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, courses, faqs, packages, posts, teachers, testimonials } from "@/db";

export type Post = typeof posts.$inferSelect & { readingMinutes: number };

export const getCourses = () =>
  db.select().from(courses).where(eq(courses.published, true)).orderBy(asc(courses.sortOrder), asc(courses.title));

export async function getCourse(slug: string) {
  const [row] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.slug, slug), eq(courses.published, true)))
    .limit(1);
  return row;
}

export const getPackages = () =>
  db.select().from(packages).where(eq(packages.published, true)).orderBy(asc(packages.sortOrder));

export const getFaqs = () =>
  db.select().from(faqs).where(eq(faqs.published, true)).orderBy(asc(faqs.sortOrder));

export const getTestimonials = () =>
  db.select().from(testimonials).where(eq(testimonials.published, true)).orderBy(asc(testimonials.sortOrder));

export const getPublicTeachers = () =>
  db
    .select()
    .from(teachers)
    .where(and(eq(teachers.active, true), eq(teachers.showOnWebsite, true)))
    .orderBy(asc(teachers.sortOrder), asc(teachers.name));

const withReadingTime = (p: typeof posts.$inferSelect): Post => ({
  ...p,
  readingMinutes: Math.max(1, Math.round(p.content.trim().split(/\s+/).length / 200)),
});

export async function getPosts(): Promise<Post[]> {
  const rows = await db.select().from(posts).where(eq(posts.published, true)).orderBy(desc(posts.publishedAt));
  return rows.map(withReadingTime);
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const [row] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.published, true)))
    .limit(1);
  return row ? withReadingTime(row) : undefined;
}

export const formatDate = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
