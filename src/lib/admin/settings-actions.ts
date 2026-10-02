"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { settingDefaults, type SettingKey } from "@/content/site";
import { db, settings } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { type AdminFormState, parseFields } from "./form";
import { logActivity } from "./log";
import { settingFields } from "./settings-fields";
import { safeZone } from "./time";

const numeric: SettingKey[] = ["trialDays", "sessionMinutes", "siblingDiscountPercent"];
const rates: SettingKey[] = ["rateUSD", "rateEUR", "rateAUD", "rateCAD"];

export async function saveSettings(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const user = await requireAdmin();
  const { values, errors, echo } = parseFields(settingFields, formData, "UTC");
  const v = values as Record<SettingKey, string>;

  for (const k of numeric) {
    if (!errors[k] && !/^\d{1,3}$/.test(v[k]) ) errors[k] = "Enter a whole number";
  }
  if (!errors.siblingDiscountPercent && Number(v.siblingDiscountPercent) > 90) errors.siblingDiscountPercent = "Enter 0 to 90";
  for (const k of rates) {
    if (!errors[k] && !(Number(v[k]) > 0 && Number(v[k]) < 10000)) errors[k] = "Enter a positive number";
  }
  if (!errors.whatsapp && !/^\d{8,15}$/.test(v.whatsapp)) errors.whatsapp = "Digits only, 8 to 15 long, no + or spaces";
  if (!errors.phoneHref && !/^\+\d{8,15}$/.test(v.phoneHref)) errors.phoneHref = "Use international format, e.g. +923165057787";
  if (!errors.adminTimezone && safeZone(v.adminTimezone) !== v.adminTimezone) errors.adminTimezone = "Not a valid time zone name";
  if (!errors.announcement && v.announcement.length > 200) errors.announcement = "Keep it under 200 characters";

  if (Object.keys(errors).length) return { errors, values: echo, message: "Please fix the highlighted fields." };

  const keys = Object.keys(settingDefaults) as SettingKey[];
  await db.transaction(async (tx) => {
    for (const key of keys) {
      await tx
        .insert(settings)
        .values({ key, value: String(v[key] ?? "") })
        .onConflictDoUpdate({ target: settings.key, set: { value: String(v[key] ?? "") } });
    }
  });

  await logActivity(user, "updated", "settings", "site", "Updated site settings");
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  redirect("/admin/settings?saved=1");
}
