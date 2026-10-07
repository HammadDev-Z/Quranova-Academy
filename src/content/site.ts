/**
 * Static site constants and the DEFAULT values for admin-editable settings.
 * Live values come from the database through getSite() in src/lib/settings.ts.
 */
export const siteStatic = {
  name: "Quranova Academy",
  shortName: "Quranova",
  tagline: "Learn the Quran one-to-one, from home",
  description:
    "One-to-one live online Quran classes with qualified male and female teachers. Noorani Qaida, Tajweed, Hifz, Arabic and more. Free 3-day trial, plans from £20/month.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const settingDefaults = {
  email: "hmddevx@gmail.com",
  notifyEmail: "hmddevx@gmail.com",
  phoneDisplay: "0316 5057787",
  phoneHref: "+923165057787",
  // WhatsApp wants the international number with no "+" or leading zero.
  whatsapp: "923165057787",
  whatsappMessage: "Assalamu alaikum! I would like to book a free trial class at Quranova Academy.",
  trialDays: "3",
  sessionMinutes: "30",
  siblingDiscountPercent: "10",
  announcement: "",
  adminTimezone: "Asia/Karachi",
  rateUSD: "1.3",
  rateEUR: "1.17",
  rateAUD: "2",
  rateCAD: "1.8",
} as const;

export type SettingKey = keyof typeof settingDefaults;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/teachers", label: "Teachers" },
  { href: "/packages", label: "Packages" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
] as const;
