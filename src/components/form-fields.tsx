import Script from "next/script";
import type { ReactNode } from "react";
import { cn } from "./ui";

const control =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-ink placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function Field({
  label,
  name,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-brand-800">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = React.ComponentProps<"input"> & { name: string; error?: string };
export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      id={props.name}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.name}-error` : undefined}
      className={cn(control, error ? "border-red-400" : "border-brand-200", className)}
      {...props}
    />
  );
}

type SelectProps = React.ComponentProps<"select"> & {
  name: string;
  error?: string;
  options: readonly string[];
  /** Display text per option value (defaults to the value itself). */
  labels?: Record<string, string>;
  /** Disabled "Choose…" row shown first, for required selects. */
  placeholder?: string;
  /** Selectable empty row, for optional selects. */
  emptyLabel?: string;
};
export function Select({ error, options, labels, placeholder, emptyLabel, className, ...props }: SelectProps) {
  return (
    <select
      id={props.name}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.name}-error` : undefined}
      className={cn(control, error ? "border-red-400" : "border-brand-200", className)}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {emptyLabel && <option value="">{emptyLabel}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}

type TextareaProps = React.ComponentProps<"textarea"> & { name: string; error?: string };
export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      id={props.name}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.name}-error` : undefined}
      className={cn(control, "min-h-28", error ? "border-red-400" : "border-brand-200", className)}
      {...props}
    />
  );
}

/** Hidden from people, tempting to bots. Anything typed here is treated as spam. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="website">Leave this field empty</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

/** Renders the Cloudflare Turnstile widget when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. */
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div className="cf-turnstile" data-sitekey={siteKey} />
    </>
  );
}

export function Consent({ error }: { error?: string }) {
  return (
    <div>
      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input type="checkbox" name="consent" className="mt-1 h-4 w-4 rounded border-brand-300 accent-brand-600" />
        <span>
          I agree to be contacted about my request and have read the{" "}
          <a href="/privacy-policy" className="font-medium text-brand-600 underline">
            privacy policy
          </a>
          .
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
