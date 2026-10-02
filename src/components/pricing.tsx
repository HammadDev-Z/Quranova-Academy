"use client";

import { useState } from "react";
import { currencyMeta, everyPlanIncludes } from "@/content/plans";
import { Button, CheckList, cn } from "./ui";

export type PricingPackage = {
  id: string;
  name: string;
  priceMinor: number;
  classesPerMonth: number;
  blurb: string;
  popular: boolean;
};

type Props = {
  packages: PricingPackage[];
  rates: Record<string, number>;
  sessionMinutes: number;
  siblingDiscountPercent: number;
  compact?: boolean;
};

export function Pricing({ packages, rates, sessionMinutes, siblingDiscountPercent, compact }: Props) {
  const [code, setCode] = useState("GBP");
  const currency = currencyMeta.find((c) => c.code === code) ?? currencyMeta[0];
  const price = (minor: number) => `${currency.symbol}${Math.round((minor / 100) * (rates[code] ?? 1))}`;

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-2">
        <div role="group" aria-label="Currency" className="inline-flex flex-wrap justify-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-brand-100">
          {currencyMeta.map((c) => (
            <button
              key={c.code}
              type="button"
              aria-pressed={c.code === code}
              onClick={() => setCode(c.code)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                c.code === code ? "bg-brand-600 text-white" : "text-brand-700 hover:bg-brand-50",
              )}
            >
              {c.code}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">Billed in GBP. Other currencies are indicative only.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((p) => (
          <div
            key={p.id}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
              p.popular ? "border-gold-500 ring-2 ring-gold-500" : "border-brand-100",
            )}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-900">
                Most popular
              </span>
            )}
            <h3 className="text-xl font-bold text-brand-800">{p.name}</h3>
            <p className="mt-4">
              <span className="font-serif text-4xl font-bold text-brand-700">{price(p.priceMinor)}</span>
              <span className="text-muted"> / month</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-ink">
              <li>{p.classesPerMonth} live classes / month</li>
              <li>One-to-one with your teacher</li>
              <li>{sessionMinutes} minutes per session</li>
              {p.blurb && <li className="font-medium text-brand-700">{p.blurb}</li>}
            </ul>
            <Button href="/free-trial" variant={p.popular ? "gold" : "primary"} className="mt-6 w-full">
              Start free trial
            </Button>
            <p className="mt-2 text-center text-xs text-muted">No payment before your trial</p>
          </div>
        ))}
      </div>

      {!compact && (
        <>
          <div className="mt-10 rounded-2xl bg-brand-800 pattern p-6 text-center text-white sm:p-8">
            <p className="font-serif text-2xl font-bold">More than one child? Save {siblingDiscountPercent}%.</p>
            <p className="mt-2 text-brand-100">
              Every additional child learns for {siblingDiscountPercent}% less. Just ask when you book your free trial.
            </p>
            <Button href="/free-trial" variant="gold" className="mt-5">
              Claim sibling discount
            </Button>
          </div>

          <div className="mt-10 rounded-2xl border border-brand-100 bg-white p-6 sm:p-8">
            <h3 className="font-serif text-2xl font-bold text-brand-800">Every plan includes</h3>
            <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <CheckList items={everyPlanIncludes.slice(0, 4)} />
              <CheckList items={everyPlanIncludes.slice(4)} />
            </div>
            <p className="mt-5 text-sm text-muted">
              Need a different schedule? Custom timings and weekend classes are available. Tell us what suits you.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
