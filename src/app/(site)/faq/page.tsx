import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import { FaqList } from "@/components/faq-list";
import { PageHero, Section } from "@/components/ui";
import { getFaqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about our free trial, class length, fees, teachers, timings and how online Quran lessons work.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getFaqs();
  return (
    <>
      <PageHero title="Frequently Asked Questions" text="Everything parents and students ask before they start." />
      <Section>
        <FaqList items={faqs.map((f) => ({ q: f.question, a: f.answer }))} />
      </Section>
      <CtaBanner title="Still have questions? Try a free class" />
    </>
  );
}
