"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { saveContactLead, saveTrialLead } from "@/lib/leads";
import { formatFields, sendMail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { getSite } from "@/lib/settings";
import { verifyTurnstile } from "@/lib/turnstile";
import { contactSchema, echoValues, fieldErrors, trialSchema, type FormState } from "@/lib/validation";

async function clientIp() {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

async function genericError(): Promise<FormState> {
  const site = await getSite();
  return {
    ok: false,
    message: `Something went wrong sending your request. Please message us on WhatsApp or email ${site.email}.`,
  };
}

async function guard(formData: FormData, scope: string): Promise<FormState | null> {
  const ip = await clientIp();

  // Honeypot: real visitors never see or fill this field. Pretend success to bots.
  if (String(formData.get("website") ?? "") !== "") return { ok: true };

  if (!rateLimit(`${scope}:${ip}`)) {
    return { ok: false, message: "Too many requests. Please try again later or contact us on WhatsApp." };
  }

  const token = String(formData.get("cf-turnstile-response") ?? "") || null;
  if (!(await verifyTurnstile(token, ip))) {
    return { ok: false, message: "Spam check failed. Please refresh the page and try again." };
  }
  return null;
}

export async function submitTrial(_prev: FormState, formData: FormData): Promise<FormState> {
  const blocked = await guard(formData, "trial");
  if (blocked) {
    if (blocked.ok) redirect("/free-trial/thank-you");
    return blocked;
  }

  const parsed = trialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values: echoValues(formData), message: "Please fix the highlighted fields." };
  }

  const { consent, ...data } = parsed.data;
  void consent;
  const site = await getSite();
  const saved = await saveTrialLead(data);

  const alert = await sendMail({
    to: site.notifyEmail,
    replyTo: data.email,
    subject: `New free trial request: ${data.studentName} (${data.course})`,
    text: `New free trial request on ${site.name}\n\n${formatFields(data)}\n\nWhatsApp: https://wa.me/${data.whatsapp.replace(/\D/g, "")}`,
  });

  await sendMail({
    to: data.email,
    subject: `We received your free trial request, ${site.name}`,
    text: `Assalamu alaikum ${data.parentName},\n\nThank you for requesting a free trial for ${data.studentName}. We will contact you on WhatsApp or email shortly to agree a class time.\n\nIf you would like to talk sooner, WhatsApp us on ${site.phoneDisplay}.\n\nJazakAllahu khairan,\n${site.name}`,
  });

  // Fail only when the request was lost everywhere (not on disk, not emailed).
  if (!saved && !alert) return genericError();

  redirect("/free-trial/thank-you");
}

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const blocked = await guard(formData, "contact");
  if (blocked) return blocked.ok ? { ok: true, message: "Thank you, we will be in touch soon." } : blocked;

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values: echoValues(formData), message: "Please fix the highlighted fields." };
  }

  const { consent, ...data } = parsed.data;
  void consent;
  const site = await getSite();
  const saved = await saveContactLead(data);
  const alert = await sendMail({
    to: site.notifyEmail,
    replyTo: data.email,
    subject: `New contact message from ${data.name}`,
    text: `New message on ${site.name}\n\n${formatFields(data)}`,
  });

  if (!saved && !alert) return genericError();
  return { ok: true, message: "Thank you! We have received your message and will reply soon." };
}
