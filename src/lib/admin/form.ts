import type { FieldDef, Option } from "./fields";
import { addDays, fromLocalInput, toLocalInput, todayKey } from "./time";

export type AdminFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Echoed back on error so React's form reset does not wipe the user's input. */
  values?: Record<string, string | boolean>;
};

type Parsed = { values: Record<string, unknown>; errors: Record<string, string>; echo: Record<string, string | boolean> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates submitted form data against field definitions. `optionValues`
 * supplies valid ids for database-backed selects.
 */
export function parseFields(
  fields: FieldDef[],
  formData: FormData,
  tz: string,
  optionValues: Record<string, Set<string>> = {},
): Parsed {
  const values: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  const echo: Record<string, string | boolean> = {};

  for (const f of fields) {
    const col = f.column ?? f.name;
    const rawValue = formData.get(f.name);
    const raw = typeof rawValue === "string" ? rawValue : "";
    const text = f.type === "textarea" || f.type === "markdown" || f.type === "list" ? raw.replace(/\r\n/g, "\n").trim() : raw.trim();
    const fail = (msg: string) => {
      errors[f.name] ??= msg;
    };

    echo[f.name] = f.type === "checkbox" ? raw === "on" : raw;

    if (f.type === "checkbox") {
      values[col] = raw === "on";
      continue;
    }

    if (!text) {
      if (f.required) {
        fail(`${f.label} is required`);
        continue;
      }
      switch (f.type) {
        case "number":
          values[col] = f.nullable ? null : 0;
          break;
        case "list":
          values[col] = [];
          break;
        case "select":
          values[col] = f.nullable || f.optionsFrom ? null : "";
          break;
        case "datetime":
          values[col] = null;
          break;
        default:
          values[col] = "";
      }
      continue;
    }

    if (text.length > 50000) {
      fail(`${f.label} is too long`);
      continue;
    }

    switch (f.type) {
      case "number": {
        const n = Number(text);
        if (!Number.isFinite(n) || !Number.isInteger(n)) fail(`${f.label} must be a whole number`);
        else if (n < 0) fail(`${f.label} cannot be negative`);
        else values[col] = n;
        break;
      }
      case "money": {
        const n = Number(text.replace(/,/g, ""));
        if (!Number.isFinite(n) || n < 0) fail(`${f.label} must be a valid amount`);
        else values[col] = Math.round(n * 100);
        break;
      }
      case "email":
        if (!EMAIL.test(text)) fail("Enter a valid email address");
        else values[col] = text.toLowerCase();
        break;
      case "url":
        if (!/^https?:\/\/\S+$/i.test(text)) fail("Enter a full link starting with http:// or https://");
        else values[col] = text;
        break;
      case "date":
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) fail(`${f.label} must be a valid date`);
        else values[col] = text;
        break;
      case "month":
        if (!/^\d{4}-\d{2}$/.test(text)) fail(`${f.label} must be a valid month`);
        else values[col] = text;
        break;
      case "datetime": {
        const d = fromLocalInput(text, tz);
        if (!d || Number.isNaN(d.getTime())) fail(`${f.label} must be a valid date and time`);
        else values[col] = d;
        break;
      }
      case "list":
        values[col] = text.split("\n").map((l) => l.trim()).filter(Boolean);
        break;
      case "select": {
        if (f.optionsFrom) {
          if (!optionValues[f.optionsFrom]?.has(text)) fail(`Choose a valid ${f.label.toLowerCase()}`);
          else values[col] = text;
        } else if (!(f.options ?? []).some((o: Option) => o.value === text)) {
          fail(`Choose a valid ${f.label.toLowerCase()}`);
        } else values[col] = text;
        break;
      }
      default:
        values[col] = text;
    }
  }

  return { values, errors, echo };
}

/** Turns a database row (or defaults) into the string values the form inputs show. */
export function toFormValues(
  fields: FieldDef[],
  row: Record<string, unknown> | undefined,
  tz: string,
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  const today = todayKey(tz);

  for (const f of fields) {
    const col = f.column ?? f.name;
    const v = row?.[col];

    if (!row) {
      if (f.type === "checkbox") out[f.name] = f.initial === "on";
      else if (f.type === "date" && f.initial?.startsWith("today")) {
        const plus = Number(f.initial.split("+")[1] ?? 0);
        out[f.name] = plus ? addDays(today, plus) : today;
      } else out[f.name] = f.initial ?? "";
      continue;
    }

    if (f.type === "checkbox") out[f.name] = Boolean(v);
    else if (f.type === "list") out[f.name] = Array.isArray(v) ? v.join("\n") : "";
    else if (f.type === "money") out[f.name] = typeof v === "number" ? (v / 100).toFixed(2) : "";
    else if (f.type === "datetime") out[f.name] = v instanceof Date ? toLocalInput(v, tz) : "";
    else out[f.name] = v === null || v === undefined ? "" : String(v);
  }
  return out;
}
