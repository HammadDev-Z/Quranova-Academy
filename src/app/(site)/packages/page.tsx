import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import { Pricing } from "@/components/pricing";
import { PageHero, Section } from "@/components/ui";
import { getPackages } from "@/lib/content";
import { getSite } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const [site, packages] = await Promise.all([getSite(), getPackages()]);
  const cheapest = packages.length ? Math.min(...packages.map((p) => p.priceMinor)) / 100 : null;
  return {
    title: "Packages & Fees",
    description: `One-to-one live Quran classes${cheapest ? ` from £${cheapest}/month` : ""}. ${site.siblingDiscountPercent}% sibling discount and a free ${site.trialDays}-day trial.`,
    alternates: { canonical: "/packages" },
  };
}

export default async function PackagesPage() {
  const [site, packages] = await Promise.all([getSite(), getPackages()]);
  return (
    <>
      <PageHero
        title="Packages & Fees"
        text="Pick the weekly schedule that suits your family. Start with a free trial, then choose your plan."
      />
      <Section>
        <Pricing
          packages={packages.map((p) => ({
            id: p.id,
            name: p.name,
            priceMinor: p.priceMinor,
            classesPerMonth: p.classesPerMonth,
            blurb: p.blurb,
            popular: p.popular,
          }))}
          rates={site.rates}
          sessionMinutes={site.sessionMinutes}
          siblingDiscountPercent={site.siblingDiscountPercent}
        />
      </Section>
      <CtaBanner />
    </>
  );
}
