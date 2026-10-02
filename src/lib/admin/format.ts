export const currencySymbols: Record<string, string> = { GBP: "£", USD: "$", EUR: "€", AUD: "A$", CAD: "C$", PKR: "Rs " };

export function formatMoney(minor: number, currency = "GBP"): string {
  const symbol = currencySymbols[currency] ?? `${currency} `;
  return `${symbol}${(minor / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Escapes one CSV cell, and neutralises spreadsheet formula injection. */
export function csvCell(value: unknown): string {
  let s = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
