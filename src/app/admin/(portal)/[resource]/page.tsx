import { and, asc, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { AdminPageHeader, Badge, EmptyState, Flash, linkButton, linkButtonOutline } from "@/components/admin/ui";
import { db } from "@/db";
import { deleteResource, toggleResourceFlag } from "@/lib/admin/actions";
import type { ColumnDef, OptionSource } from "@/lib/admin/fields";
import { formatMoney } from "@/lib/admin/format";
import { loadLabels } from "@/lib/admin/options";
import { getResource, type Resource } from "@/lib/admin/resources";
import { formatDateOnly, formatDateTime, todayKey } from "@/lib/admin/time";
import { requireAdmin } from "@/lib/auth/session";
import { getRawSettings } from "@/lib/settings";

const PAGE_SIZE = 25;

type Props = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const res = getResource((await params).resource);
  return { title: res?.label ?? "Not found" };
}

export default async function ResourceListPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { resource: key } = await params;
  const res = getResource(key);
  if (!res) notFound();

  const sp = await searchParams;
  const { adminTimezone: tz } = await getRawSettings();
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);

  const conditions: SQL[] = [];
  if (q && res.searchColumns.length) {
    const pattern = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    conditions.push(or(...res.searchColumns.map((c) => like(res.table[c], pattern)))!);
  }
  for (const f of res.filters ?? []) {
    const value = sp[f.name];
    if (value && f.options.some((o) => o.value === value)) {
      conditions.push(eq(res.table[f.name], f.name === "published" ? value === "1" : value));
    }
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const sortCol = res.table[res.sort.column];
  const [rows, [total]] = await Promise.all([
    db
      .select()
      .from(res.table)
      .where(where)
      .orderBy(res.sort.dir === "asc" ? asc(sortCol) : desc(sortCol))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(res.table).where(where),
  ]);

  const refSources = [...new Set(res.columns.flatMap((c) => (c.ref ? [c.ref] : [])))] as OptionSource[];
  const labels = await loadLabels(refSources);
  const today = todayKey(tz);
  const pages = Math.max(1, Math.ceil(total.n / PAGE_SIZE));

  const qs = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...over })) if (v && k !== "saved" && k !== "deleted") p.set(k, v);
    const s = p.toString();
    return `/admin/${key}${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title={res.label}
        description={res.description}
        actions={
          <>
            {res.exportable && (
              <a href={`/admin/export/${key}`} className={linkButtonOutline}>
                Export CSV
              </a>
            )}
            <Link href={`/admin/${key}/new`} className={linkButton}>
              + Add {res.singular}
            </Link>
          </>
        }
      />
      <Flash saved={sp.saved} deleted={sp.deleted} />

      {(res.searchColumns.length > 0 || res.filters?.length) && (
        <form className="mb-5 flex flex-wrap items-end gap-3" action={`/admin/${key}`}>
          {res.searchColumns.length > 0 && (
            <div className="min-w-56 flex-1">
              <label htmlFor="q" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder={`Search ${res.label.toLowerCase()}…`}
                className="w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2 text-sm"
              />
            </div>
          )}
          {res.filters?.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                {f.label}
              </label>
              <select id={f.name} name={f.name} defaultValue={sp[f.name] ?? ""} className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm">
                <option value="">All</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Apply
          </button>
          {(q || res.filters?.some((f) => sp[f.name])) && (
            <Link href={`/admin/${key}`} className="py-2 text-sm font-medium text-brand-600 hover:underline">
              Clear
            </Link>
          )}
        </form>
      )}

      {rows.length === 0 ? (
        <EmptyState title={q || conditions.length ? "Nothing matches" : `No ${res.label.toLowerCase()} yet`}>
          {q || conditions.length ? (
            <Link href={`/admin/${key}`} className="font-semibold text-brand-600 underline">
              Clear filters
            </Link>
          ) : (
            <Link href={`/admin/${key}/new`} className="font-semibold text-brand-600 underline">
              Add the first {res.singular}
            </Link>
          )}
        </EmptyState>
      ) : (
        <>
        {/* Phones: one card per row instead of a table that scrolls sideways. */}
        <ul className="space-y-3 md:hidden">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
              <div className="text-base">
                <Cell res={res} col={res.columns[0]} row={row} labels={labels} tz={tz} today={today} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {res.columns.slice(1).map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{c.label}</dt>
                    <dd className="mt-0.5 break-words">
                      <Cell res={res} col={c} row={row} labels={labels} tz={tz} today={today} />
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex gap-2 border-t border-brand-100 pt-3">
                <Link href={`/admin/${key}/${row.id}`} className={`${linkButtonOutline} flex-1`}>
                  Edit
                </Link>
                <form action={deleteResource.bind(null, key, row.id)} className="flex-1">
                  <ConfirmButton
                    message={`Delete this ${res.singular}? This cannot be undone.`}
                    className="w-full rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 active:scale-[0.97]"
                  >
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-brand-50/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                {res.columns.map((c) => (
                  <th key={c.key} scope="col" className="px-4 py-3 font-semibold">
                    {c.label}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-brand-50/40">
                  {res.columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <Cell res={res} col={c} row={row} labels={labels} tz={tz} today={today} />
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link href={`/admin/${key}/${row.id}`} className="font-semibold text-brand-600 hover:underline">
                      Edit
                    </Link>
                    <form action={deleteResource.bind(null, key, row.id)} className="ml-4 inline">
                      <ConfirmButton message={`Delete this ${res.singular}? This cannot be undone.`} className="tap font-semibold text-red-700 hover:underline">
                        Delete
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between text-sm">
          <p className="text-muted">
            Page {page} of {pages} · {total.n} total
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={qs({ page: String(page - 1) })} className={linkButtonOutline}>
                ← Previous
              </Link>
            )}
            {page < pages && (
              <Link href={qs({ page: String(page + 1) })} className={linkButtonOutline}>
                Next →
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}

function Cell({
  res,
  col,
  row,
  labels,
  tz,
  today,
}: {
  res: Resource;
  col: ColumnDef;
  row: Record<string, unknown>;
  labels: Partial<Record<OptionSource, Record<string, string>>>;
  tz: string;
  today: string;
}) {
  const value = row[col.key];
  const sub = col.sub ? String(row[col.sub] ?? "") : "";

  let content: React.ReactNode;
  switch (col.kind) {
    case "badge": {
      let v = String(value ?? "");
      if (res.key === "invoices" && col.key === "status" && v === "unpaid" && String(row.dueOn) && String(row.dueOn) < today) v = "overdue";
      content = v ? <Badge value={v} /> : "—";
      break;
    }
    case "bool": {
      const toggleable = res.fields.some((f) => f.type === "checkbox" && (f.column ?? f.name) === col.key);
      const on = Boolean(value);
      const label = on ? "Yes" : "No";
      content = toggleable ? (
        <form action={toggleResourceFlag.bind(null, res.key, String(row.id), col.key)}>
          <button
            type="submit"
            title={`Click to turn ${on ? "off" : "on"}`}
            className={`tap rounded-full px-2.5 py-0.5 text-xs font-semibold ${on ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            {label}
          </button>
        </form>
      ) : (
        label
      );
      break;
    }
    case "date":
      content = value instanceof Date ? value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: tz }) : value ? formatDateOnly(String(value)) : "—";
      break;
    case "datetime":
      content = value instanceof Date ? formatDateTime(value, tz) : "—";
      break;
    case "money":
      content = typeof value === "number" ? formatMoney(value, col.currencyKey ? String(row[col.currencyKey]) : "GBP") : "—";
      break;
    case "ref": {
      const label = value && col.ref ? labels[col.ref]?.[String(value)] : undefined;
      content = label ?? <span className="text-muted">—</span>;
      break;
    }
    default:
      content = value === null || value === undefined || value === "" ? <span className="text-muted">—</span> : String(value).length > 90 ? `${String(value).slice(0, 90)}…` : String(value);
  }

  if (col.primary) {
    content = (
      <Link href={`/admin/${res.key}/${row.id}`} className="font-semibold text-brand-700 hover:underline">
        {content}
      </Link>
    );
  }

  return (
    <>
      {content}
      {sub && <span className="block text-xs text-muted">{sub}</span>}
    </>
  );
}
