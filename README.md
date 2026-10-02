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
