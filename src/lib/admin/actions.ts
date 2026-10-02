"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";
import { loadOptions } from "./options";
import { type AdminFormState, parseFields } from "./form";
import type { OptionSource } from "./fields";
import { logActivity } from "./log";
import { getResource } from "./resources";

function refresh(publicSite?: boolean) {
  revalidatePath("/admin", "layout");
  if (publicSite) revalidatePath("/", "layout");
}

/** Create or update any record described in resources.ts. `id` is "new" when creating. */
export async function saveResource(key: string, id: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const user = await requireAdmin();
  const res = getResource(key);
  if (!res) return { message: "Unknown record type" };

  const { adminTimezone: tz } = await getRawSettings();
  const creating = id === "new";

  const sources = [...new Set(res.fields.flatMap((f) => (f.optionsFrom ? [f.optionsFrom] : [])))] as OptionSource[];
  const loaded = await loadOptions(sources);
  const optionValues = Object.fromEntries(sources.map((s) => [s, new Set((loaded[s] ?? []).map((o) => o.value))]));

  const { values, errors, echo } = parseFields(res.fields, formData, tz, optionValues);
  if (Object.keys(errors).length) return { errors, values: echo, message: "Please fix the highlighted fields." };

  let existing: Record<string, unknown> | undefined;
  if (!creating) {
    [existing] = await db.select().from(res.table).where(eq(res.table.id, id)).limit(1);
    if (!existing) return { message: "That record no longer exists.", values: echo };
  }

  // Read-only-on-edit fields must keep their stored value.
  if (existing) for (const f of res.fields) if (f.readOnlyOnEdit) delete values[f.column ?? f.name];

  const final = res.beforeSave ? await res.beforeSave(values, { existing, tz }) : values;

  try {
    if (creating) {
      const [row] = await db.insert(res.table).values(final).returning({ id: res.table.id });
      await logActivity(user, "created", res.singular, row.id, `Created ${res.singular}: ${String(final.name ?? final.title ?? final.question ?? final.number ?? "")}`);
    } else {
      await db.update(res.table).set(final).where(eq(res.table.id, id));
      await logActivity(user, "updated", res.singular, id, `Updated ${res.singular}: ${String(final.name ?? final.title ?? final.question ?? final.number ?? "")}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? `${err.message} ${String((err as { cause?: unknown }).cause ?? "")}` : "";
    if (/UNIQUE/i.test(msg)) {
      const field = /slug/i.test(msg) ? "slug" : "number";
      return { errors: { [field]: "That value is already in use" }, values: echo, message: "Please fix the highlighted fields." };
    }
    console.error(`[admin] save ${key} failed:`, err);
    return { message: "Could not save. Please try again.", values: echo };
  }

  refresh(res.publicSite);
  redirect(`/admin/${key}?saved=1`);
}

export async function deleteResource(key: string, id: string) {
  const user = await requireAdmin();
  const res = getResource(key);
  if (!res) return;

  const [existing] = await db.select().from(res.table).where(eq(res.table.id, id)).limit(1);
  if (!existing) redirect(`/admin/${key}`);

  if (res.beforeDelete) await res.beforeDelete(id);
  await db.delete(res.table).where(eq(res.table.id, id));
  await logActivity(user, "deleted", res.singular, id, `Deleted ${res.singular}: ${String(existing.name ?? existing.title ?? existing.question ?? existing.number ?? id)}`);

  refresh(res.publicSite);
  redirect(`/admin/${key}?deleted=1`);
}

/** Flip a boolean column (published, active, ...) straight from a list row. */
export async function toggleResourceFlag(key: string, id: string, column: string) {
  const user = await requireAdmin();
  const res = getResource(key);
  const allowed = res?.fields.some((f) => f.type === "checkbox" && (f.column ?? f.name) === column);
  if (!res || !allowed) return;

  const [row] = await db.select().from(res.table).where(eq(res.table.id, id)).limit(1);
  if (!row) return;
  await db.update(res.table).set({ [column]: !row[column] }).where(eq(res.table.id, id));
  await logActivity(user, "updated", res.singular, id, `${row[column] ? "Turned off" : "Turned on"} ${column} for ${String(row.name ?? row.title ?? row.question ?? id)}`);
  refresh(res.publicSite);
}
