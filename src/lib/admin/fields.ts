// Shared between server and client components: plain data only, no server imports.

export type Option = { value: string; label: string };

/** Entities whose records can be picked in a <select>. Resolved on the server. */
export type OptionSource = "courses" | "teachers" | "students" | "guardians" | "packages";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "money" // entered in pounds, stored in pence
  | "textarea"
  | "markdown"
  | "select"
  | "checkbox"
  | "list" // one item per line
  | "date"
  | "datetime" // interpreted in the admin time zone
  | "month";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  /** Database column when it differs from `name` (e.g. money: price -> priceMinor). */
  column?: string;
  required?: boolean;
  /** Empty input is stored as NULL (number/select) instead of 0 / empty string. */
  nullable?: boolean;
  hint?: string;
  placeholder?: string;
  /** Static options, or a source to load from the database. */
  options?: Option[];
  optionsFrom?: OptionSource;
  /** Occupies half the row on wide screens. */
  half?: boolean;
  readOnlyOnEdit?: boolean;
  /** Default for new records. Dates also accept "today" and "today+N". */
  initial?: string;
  rows?: number;
};

export type ColumnDef = {
  key: string;
  label: string;
  kind?: "text" | "badge" | "bool" | "date" | "datetime" | "money" | "ref" | "count";
  /** For kind "ref": which entity the id points at. */
  ref?: OptionSource;
  /** For kind "money": column holding the currency code. */
  currencyKey?: string;
  /** Primary column links to the edit page. */
  primary?: boolean;
  /** Secondary text shown under the value, from another row key. */
  sub?: string;
};

export type FilterDef = { name: string; label: string; options: Option[] };

const labelOverrides: Record<string, string> = {
  missed_student: "Absent",
  missed_teacher: "Teacher absent",
  student_leave: "Student on leave",
  teacher_leave: "Teacher on leave",
};

export const formatLabel = (value: string) =>
  labelOverrides[value] ?? value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
