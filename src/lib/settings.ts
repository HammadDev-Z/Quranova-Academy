import "server-only";
import { cache } from "react";
import { settingDefaults, siteStatic, type SettingKey } from "@/content/site";
import { db, settings } from "@/db";

export type Site = typeof siteStatic & {
  email: string;
  notifyEmail: string;
  phoneDisplay: string;
  phoneHref: string;
  whatsapp: string;
  whatsappMessage: string;
  trialDays: number;
  sessionMinutes: number;
  siblingDiscountPercent: number;
  announcement: string;
  adminTimezone: string;
  /** GBP -> currency, indicative only. */
  rates: Record<"GBP" | "USD" | "EUR" | "AUD" | "CAD", number>;
};

const num = (v: string, fallback: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : fallback);

/** Raw setting strings: database values layered over the defaults. */
export const getRawSettings = cache(async (): Promise<Record<SettingKey, string>> => {
  const rows = await db.select().from(settings);
  const out: Record<string, string> = { ...settingDefaults };
  for (const r of rows) if (r.key in settingDefaults) out[r.key] = r.value;
  return out as Record<SettingKey, string>;
});

export const getSite = cache(async (): Promise<Site> => {
  const s = await getRawSettings();
  return {
    ...siteStatic,
    email: s.email,
    notifyEmail: s.notifyEmail,
    phoneDisplay: s.phoneDisplay,
    phoneHref: s.phoneHref,
    whatsapp: s.whatsapp,
    whatsappMessage: s.whatsappMessage,
    trialDays: num(s.trialDays, 3),
    sessionMinutes: num(s.sessionMinutes, 30),
    siblingDiscountPercent: num(s.siblingDiscountPercent, 15),
    announcement: s.announcement,
    adminTimezone: s.adminTimezone,
    rates: {
      GBP: 1,
      USD: num(s.rateUSD, 1.3),
      EUR: num(s.rateEUR, 1.17),
      AUD: num(s.rateAUD, 2),
      CAD: num(s.rateCAD, 1.8),
    },
  };
});

export const whatsappLink = (site: Pick<Site, "whatsapp" | "whatsappMessage">, message?: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message ?? site.whatsappMessage)}`;
