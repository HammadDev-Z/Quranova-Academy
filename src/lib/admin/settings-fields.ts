import type { SettingKey } from "@/content/site";
import type { FieldDef } from "./fields";

type SettingField = FieldDef & { name: SettingKey };

export const settingFields: SettingField[] = [
  { name: "email", label: "Public contact email", type: "email", required: true, half: true, hint: "Shown on the website" },
  { name: "notifyEmail", label: "Send lead alerts to", type: "email", required: true, half: true, hint: "Where new trial requests are emailed" },
  { name: "phoneDisplay", label: "Phone number (as shown)", type: "text", required: true, half: true, placeholder: "0316 5057787" },
  { name: "phoneHref", label: "Phone number (for tap-to-call)", type: "text", required: true, half: true, hint: "International format, e.g. +923165057787" },
  { name: "whatsapp", label: "WhatsApp number", type: "text", required: true, half: true, hint: "Digits only with country code, no + or spaces, e.g. 923165057787" },
  { name: "whatsappMessage", label: "WhatsApp pre-filled message", type: "text", half: true },
  { name: "trialDays", label: "Free trial length (days)", type: "text", required: true, half: true },
  { name: "sessionMinutes", label: "Class length (minutes)", type: "text", required: true, half: true },
  { name: "siblingDiscountPercent", label: "Sibling discount (%)", type: "text", required: true, half: true },
  { name: "adminTimezone", label: "Admin time zone", type: "text", required: true, half: true, hint: "Class times are entered and shown in this zone, e.g. Asia/Karachi" },
  { name: "announcement", label: "Announcement bar", type: "text", hint: "A gold bar at the top of every public page. Leave blank to hide it." },
  { name: "rateUSD", label: "1 GBP in USD", type: "text", required: true, half: true, hint: "Indicative rates for the price switcher" },
  { name: "rateEUR", label: "1 GBP in EUR", type: "text", required: true, half: true },
  { name: "rateAUD", label: "1 GBP in AUD", type: "text", required: true, half: true },
  { name: "rateCAD", label: "1 GBP in CAD", type: "text", required: true, half: true },
];
