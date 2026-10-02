import { desc, getTableColumns } from "drizzle-orm";
import { db } from "@/db";
import { toCsv } from "@/lib/admin/format";
import { getResource } from "@/lib/admin/resources";
import { getCurrentUser } from "@/lib/auth/session";

// CSV download. Auth is checked here too: route handlers are not covered by the layout guard.
export async function GET(_req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Unauthorized", { status: 401 });

  const res = getResource((await params).resource);
  if (!res?.exportable) return new Response("Not found", { status: 404 });

  const rows = await db.select().from(res.table).orderBy(desc(res.table[res.sort.column]));
  const keys = Object.keys(getTableColumns(res.table));

  const csv = toCsv(
    keys,
    rows.map((r) => keys.map((k) => (Array.isArray(r[k]) ? r[k].join("; ") : r[k]))),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${res.key}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
