# Quranova Academy

Public website (Phase 1) and admin portal (Phase 2).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · SQLite via Drizzle ORM and libsql

## Run locally

```bash
npm install
cp .env.example .env.local     # set ADMIN_EMAIL and ADMIN_PASSWORD
npm run db:setup               # creates the database, then seeds content and the first admin
npm run dev                    # http://localhost:3000
```

- Website: http://localhost:3000
- Admin portal: http://localhost:3000/admin (sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

`db:setup` is safe to re-run: it only fills empty tables and never overwrites the admin password.

## What the admin portal manages

| Area | What you can do |
|---|---|
| **Dashboard** | New leads, active students, classes today and this week, money collected, awaiting and overdue, recent activity |
| **Leads** | Every free-trial request and contact message. Search, filter by status, add notes, follow up by email, call or WhatsApp, and convert to a student in one click |
| **Students / Parents / Teachers** | Full records, links between them (parent, teacher, course, package), status, notes, and quick actions from each profile |
| **Class schedule** | Weekly view, add single classes, create a repeating weekly schedule, mark done or no-show. Times use the admin time zone |
| **Progress reports** | Monthly reports per student |
| **Invoices** | Auto-numbered invoices, overdue detection, mark paid with method and reference |
| **Website content** | Courses, packages and prices, blog posts (Markdown, draft or published), FAQs, reviews, teacher profiles. Changes appear on the public site immediately |
| **Site settings** | Phone, email, WhatsApp, free-trial length, class length, sibling discount, announcement bar, indicative exchange rates, admin time zone |
| **Admin users** | Add admins, reset passwords, deactivate accounts |
| **Activity log** | Who changed what, and when |
| **CSV export** | Leads, students, parents, teachers, classes and invoices |

## Demo data

```bash
npm run demo:load      # demo accounts, a teacher, 6 students, 100+ classes, lessons, invoices, leads
npm run demo:remove    # deletes exactly what demo:load created, nothing else
```

Demo sign-ins (deliberately weak passwords, local use only):

| Portal | Email | Password |
|---|---|---|
| Admin `/admin/login` | admin@gmail.com | admin |
| Teacher `/teacher/login` | teacher@gmail.com | teacher |
| Parent `/student/login` | parent@gmail.com (or username QN1001) | parent |
| Student `/student/login` | student@gmail.com (or username QS1001) | student |

**Run `npm run demo:remove` before you put the site on a real server.** The loader refuses to run in production or against a hosted database. It records what it creates in `data/demo-ids.json`; keep that file until you remove the demo.

## Student portal (students and parents)

Families sign in at `/student` with a short username (like `QN1001`) or their email.

- **Student logins:** Admin > Students > open a student > *Student portal login*. A student sees only their own classes, lessons and certificates and cannot add children.
- **Create a parent login:** Admin > Parents > open a parent > *Parent login (Student Portal)*. The username is generated; you set the first password and share both securely. One login covers all of that parent's children.
- **What families see:** next class with a live countdown and Join button (opens 10 minutes before), this month's class summary, children and progress, weekly schedule, upcoming classes, class history with lesson notes and homework, verified progress reports, certificates, and the lesson viewer.
- **Mark as On Leave:** families can do this at least 2 hours before a class. It opens the teacher's 30-day recovery window (shown under the teacher's Reschedules).
- **Lesson viewer:** upload page images under Admin > Lesson pages (course, part, first page number, images named 01, 02, 03...). Set each student's *current part and page* on their record and the viewer opens there. **Only upload material you have the right to use.**
- **Certificates:** Admin > Certificates. Families can view and print them.
- **Add another child:** families send a request that arrives in Admin > Leads, pre-filled.
- **Installable:** the portal can be installed as an app (Profile > Install). It has its own manifest and generated icons.
- **Remembered devices:** "keep me signed in" lasts 10 days and is listed on the Profile page, where all remembered devices can be signed out at once.

Uploads need a larger request size than the Next.js default. `next.config.ts` allows 60 MB. **On Vercel the platform limit is about 4.5 MB per request**, so large uploads need a VPS (or a storage service) in production.

## Security notes

- Passwords are hashed with scrypt. Sessions are random tokens stored hashed in the database, sent in an HTTP-only, SameSite cookie, and expire after 7 days.
- Every admin page, server action and CSV download checks the signed-in admin itself (`requireAdmin()`); the proxy only does a quick redirect for visitors with no cookie.
- Login is rate limited, and the error message never reveals whether an email exists.
- Admin pages are never cached and are excluded from search engines.
- CSV exports neutralise spreadsheet formula injection.

## Where things live

| What | Where |
|---|---|
| Database tables | `src/db/schema.ts` |
| Admin screens for each record type (fields, columns, filters) | `src/lib/admin/resources.ts` |
| Admin pages | `src/app/admin/` |
| Public pages | `src/app/(site)/` |
| Seed data (initial courses, prices, FAQs) | `src/db/seed-data/`, `content/blog/` |

To add a field: add the column in `schema.ts`, add it to the matching entry in `resources.ts`, run `npm run db:push`.

## Leads and email

Form submissions are saved to the database and appear under Admin > Leads. If SMTP is configured in `.env.local`, an alert is also emailed to the address in Site settings and the parent receives a confirmation. Without SMTP, emails are printed to the server console.

## Deploy

**VPS (Node):** the database is a file, so it persists on the server.

```bash
npm ci
npm run db:setup
npm run build
cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static
PORT=3000 node .next/standalone/server.js    # run under PM2 or systemd, behind Nginx with HTTPS
```

Back up `data/app.db` regularly. Set `NEXT_PUBLIC_SITE_URL` to the real domain before building. Run behind HTTPS: the session cookie is `Secure` in production.

**Vercel:** the filesystem is read-only, so use a hosted database. Create a free [Turso](https://turso.tech) database, set `DATABASE_URL` (`libsql://…`) and `DATABASE_AUTH_TOKEN` in Vercel, run `npm run db:setup` once from your machine with those variables, then deploy. Also set the SMTP variables.

## Before going live

- Change the admin password under Admin > My account.
- Add real teacher profiles and reviews. They stay hidden or generic until you do.
- Have the privacy policy, terms and refund policy reviewed for your business and country.
- Set up SMTP and Turnstile keys.

## Roadmap

Phase 3 teacher portal · Phase 4 student and parent portal. The `users` table already supports `teacher`, `student` and `parent` roles, and teachers, students and parents have a `userId` link ready for logins.
