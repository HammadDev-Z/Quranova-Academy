# Quranova Academy website (Phase 1)

Public marketing site for Quranova Academy: home, about, courses, packages, teachers, free-trial form, contact, FAQ, blog and legal pages.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4

## Run locally

```bash
npm install
cp .env.example .env.local   # then edit
npm run dev                  # http://localhost:3000
```

## Where to edit things

| What | File |
|---|---|
| Name, email, phone, WhatsApp number | `src/content/site.ts` |
| Courses | `src/content/courses.ts` |
| Prices and currencies | `src/content/packages.ts` |
| FAQ | `src/content/faqs.ts` |
| Teacher profiles and reviews | `src/content/teachers.ts` (sections stay hidden/generic until you add real entries) |
| Blog posts | `content/blog/*.md` (front matter: title, description, date, category) |
| Colours and fonts | `src/app/globals.css`, `src/app/layout.tsx` |

## Leads (free-trial and contact forms)

Each submission is validated, protected by a honeypot, rate limit and (optionally) Cloudflare Turnstile, then:

1. appended to `data/leads.jsonl` (only works on a writable disk, such as a VPS), and
2. emailed to `LEAD_NOTIFY_EMAIL`, with a confirmation sent to the parent, once SMTP is configured in `.env.local`.

Without SMTP the emails are printed to the server console. On Vercel the disk is read-only, so **configure SMTP there**, or wait for Phase 2 when leads move into a database.

## Deploy

**Vercel:** import the repo, add the environment variables from `.env.example`, deploy.

**VPS (Node):**

```bash
npm ci && npm run build
# next.config.ts uses output: "standalone"
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
PORT=3000 node .next/standalone/server.js     # run under PM2 or systemd, behind Nginx
```

Set `NEXT_PUBLIC_SITE_URL` to the real domain before building (it feeds canonical URLs, the sitemap and Open Graph).

## Before going live

- Replace placeholder content: teacher profiles, real reviews, logo and photos.
- Have the privacy policy, terms and refund policy reviewed for your business and country.
- Set up SMTP, Turnstile keys and (optionally) `NEXT_PUBLIC_GA_ID`.

## Roadmap

Phase 2 admin portal · Phase 3 teacher portal · Phase 4 student/parent portal. Route groups `(admin)`, `(teacher)` and `(student)` will sit beside the public pages in this same app.
