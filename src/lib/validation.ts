import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid phone or WhatsApp number")
  .max(25, "Enter a valid phone or WhatsApp number")
  .regex(/^[+\d][\d\s()-]{5,}$/, "Enter a valid phone or WhatsApp number");

export const NOT_SURE_COURSE = "Not sure yet, please advise";

export const teacherPreferences = ["No preference", "Male teacher", "Female teacher"] as const;

export const trialSchema = z.object({
  parentName: z.string().trim().min(2, "Enter your name").max(80),
  studentName: z.string().trim().min(2, "Enter the student's name").max(80),
  studentAge: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number({ error: "Enter the student's age" }).int("Enter a whole number").min(3, "Minimum age is 3").max(100),
  ),
  country: z.string().trim().min(2, "Enter your country").max(60),
  timezone: z.string().trim().max(60).optional().default(""),
  course: z.string().trim().min(1, "Choose a course").max(120),
  teacherPreference: z.enum(teacherPreferences).default("No preference"),
  preferredTime: z.string().trim().min(2, "Tell us when suits you").max(200),
  whatsapp: phone,
  email: z.email("Enter a valid email address").max(120),
  message: z.string().trim().max(1000).optional().default(""),
  consent: z.literal("on", { error: "Please tick the box to continue" }),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email address").max(120),
  phone: z.string().trim().max(25).optional().default(""),
  message: z.string().trim().min(10, "Please write a short message").max(2000),
  consent: z.literal("on", { error: "Please tick the box to continue" }),
});

export type TrialInput = z.infer<typeof trialSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Echoed back on validation errors so the form keeps what the visitor typed. */
  values?: Record<string, string>;
};

export function echoValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && k !== "website" && !k.startsWith("cf-")) out[k] = v;
  }
  return out;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
