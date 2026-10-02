"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input, Select, Textarea } from "@/components/form-fields";
import { Button, cn } from "@/components/ui";
import type { FieldDef, Option } from "@/lib/admin/fields";
import type { AdminFormState } from "@/lib/admin/form";

type Props = {
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  fields: FieldDef[];
  /** Resolved options for database-backed selects. */
  options: Record<string, Option[]>;
  defaults: Record<string, string | boolean>;
  cancelHref: string;
  submitLabel: string;
  editing: boolean;
};

export function ResourceForm({ action, fields, options, defaults, cancelHref, submitLabel, editing }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as AdminFormState);
  const e = state.errors ?? {};
  const v = { ...defaults, ...(state.values ?? {}) };

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((f) => {
          const span = f.half ? "" : "md:col-span-2";

          if (f.type === "checkbox") {
            return (
              <label key={f.name} className={cn("flex items-center gap-2.5 self-end rounded-xl border border-brand-100 bg-cream px-3.5 py-3 text-sm font-medium text-brand-800", span)}>
                <input type="checkbox" name={f.name} defaultChecked={Boolean(v[f.name])} className="h-4 w-4 accent-brand-600" />
                {f.label}
              </label>
            );
          }

          const locked = editing && f.readOnlyOnEdit;
          const value = String(v[f.name] ?? "");
          let control;

          if (f.type === "select") {
            const list = f.options ?? options[f.optionsFrom ?? ""] ?? [];
            control = (
              <Select
                name={f.name}
                defaultValue={value}
                error={e[f.name]}
                disabled={locked}
                options={list.map((o) => o.value)}
                placeholder={f.required ? "Choose…" : undefined}
                labels={Object.fromEntries(list.map((o) => [o.value, o.label]))}
                emptyLabel={f.required ? undefined : "None"}
              />
            );
          } else if (f.type === "textarea" || f.type === "markdown" || f.type === "list") {
            control = (
              <Textarea
                name={f.name}
                defaultValue={value}
                error={e[f.name]}
                rows={f.rows ?? 4}
                placeholder={f.placeholder}
                className={f.type === "markdown" ? "font-mono text-sm" : undefined}
              />
            );
          } else {
            const type =
              f.type === "datetime" ? "datetime-local" : f.type === "money" || f.type === "number" ? "text" : f.type;
            control = (
              <Input
                name={f.name}
                type={type}
                inputMode={f.type === "money" ? "decimal" : f.type === "number" ? "numeric" : undefined}
                defaultValue={value}
                error={e[f.name]}
                placeholder={f.placeholder}
                readOnly={locked}
              />
            );
          }

          return (
            <Field key={f.name} label={f.label + (f.required ? " *" : "")} name={f.name} error={e[f.name]} hint={f.hint} className={span}>
              {control}
            </Field>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-brand-100 pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link href={cancelHref} className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
