import "server-only";
import { db, leads } from "@/db";
import type { ContactInput, TrialInput } from "@/lib/validation";

/** Stores a free-trial request. Returns the new lead id, or null if the write failed. */
export async function saveTrialLead(data: Omit<TrialInput, "consent">): Promise<string | null> {
  try {
    const [row] = await db
      .insert(leads)
      .values({
        type: "trial",
        parentName: data.parentName,
        studentName: data.studentName,
        studentAge: data.studentAge,
        email: data.email,
        phone: data.whatsapp,
        country: data.country,
        timezone: data.timezone,
        course: data.course,
        teacherPreference: data.teacherPreference,
        preferredTime: data.preferredTime,
        message: data.message,
      })
      .returning({ id: leads.id });
    return row.id;
  } catch (err) {
    console.error("[leads] could not save trial lead:", err);
    return null;
  }
}

export async function saveContactLead(data: Omit<ContactInput, "consent">): Promise<string | null> {
  try {
    const [row] = await db
      .insert(leads)
      .values({
        type: "contact",
        parentName: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
      })
      .returning({ id: leads.id });
    return row.id;
  } catch (err) {
    console.error("[leads] could not save contact lead:", err);
    return null;
  }
}
