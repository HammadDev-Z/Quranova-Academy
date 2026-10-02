import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string; replyTo?: string };

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/** Returns true if the message was handed to the SMTP server. */
export async function sendMail(mail: Mail): Promise<boolean> {
  const t = transport();
  if (!t) {
    console.log(`[mail] SMTP not configured. Would send to ${mail.to}:\n${mail.subject}\n${mail.text}\n`);
    return false;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM ?? `Quranova Academy <${process.env.SMTP_USER}>`,
      ...mail,
    });
    return true;
  } catch (err) {
    console.error("[mail] send failed:", err);
    return false;
  }
}

export const formatFields = (fields: Record<string, unknown>) =>
  Object.entries(fields)
    .filter(([, v]) => v !== "" && v !== undefined)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
