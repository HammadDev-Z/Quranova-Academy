import "server-only";
import { activity, db } from "@/db";
import type { CurrentUser } from "@/lib/auth/session";

export async function logActivity(user: CurrentUser, action: string, entity: string, entityId: string, summary: string) {
  try {
    await db.insert(activity).values({ userId: user.id, userName: user.name, action, entity, entityId, summary: summary.slice(0, 200) });
  } catch (err) {
    // Logging must never break the action that triggered it.
    console.error("[activity] could not log:", err);
  }
}
