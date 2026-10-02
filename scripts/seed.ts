/**
 * Seeds the database. Safe to run more than once: it only fills tables that are
 * empty and only creates the admin account if it does not exist yet.
 *
 *   npm run db:seed
 *
 * Reads ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD from .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import { count, eq } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import matter from "gray-matter";
import { courses, db, faqs, packages, posts, users } from "../src/db";
import { courses as courseSeed } from "../src/db/seed-data/courses";
import { faqs as faqSeed } from "../src/db/seed-data/faqs";
import { packages as packageSeed } from "../src/db/seed-data/packages";
import { hashPassword, passwordProblem } from "../src/lib/auth/password";

async function isEmpty(table: SQLiteTable) {
  const [row] = await db.select({ n: count() }).from(table);
  return row.n === 0;
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (email && password) {
    const problem = passwordProblem(password);
    if (problem) throw new Error(`ADMIN_PASSWORD rejected: ${problem}`);
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (!existing) {
      await db.insert(users).values({
        email,
        name: process.env.ADMIN_NAME?.trim() || "Admin",
        passwordHash: await hashPassword(password),
        role: "admin",
      });
      console.log(`Created admin account for ${email}`);
    } else {
      console.log(`Admin ${email} already exists (password not changed)`);
    }
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set: skipped creating an admin account");
  }

  if (await isEmpty(courses)) {
    await db.insert(courses).values(courseSeed.map((c, i) => ({ ...c, sortOrder: i })));
    console.log(`Seeded ${courseSeed.length} courses`);
  }

  if (await isEmpty(packages)) {
    await db.insert(packages).values(
      packageSeed.map((p, i) => ({
        name: p.name,
        priceMinor: p.pricePerMonthGBP * 100,
        classesPerMonth: p.classesPerMonth,
        blurb: p.blurb,
        popular: !!p.popular,
        sortOrder: i,
      })),
    );
    console.log(`Seeded ${packageSeed.length} packages`);
  }

  if (await isEmpty(faqs)) {
    await db.insert(faqs).values(faqSeed.map((f, i) => ({ question: f.q, answer: f.a, sortOrder: i })));
    console.log(`Seeded ${faqSeed.length} FAQs`);
  }

  if (await isEmpty(posts)) {
    const dir = path.join(process.cwd(), "content", "blog");
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")) : [];
    for (const file of files) {
      const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const date = data.date instanceof Date ? data.date : new Date(String(data.date));
      await db.insert(posts).values({
        slug: file.replace(/\.md$/, ""),
        title: String(data.title),
        description: String(data.description),
        category: String(data.category ?? "Learning"),
        content: content.trim(),
        published: true,
        publishedAt: date,
      });
    }
    console.log(`Seeded ${files.length} blog posts`);
  }

  console.log("Seed complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
