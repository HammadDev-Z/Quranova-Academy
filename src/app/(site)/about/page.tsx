import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import { Card, PageHero, Section, SectionHeading } from "@/components/ui";
import { getSite } from "@/lib/settings";
import { siteStatic } from "@/content/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `${siteStatic.name} offers one-to-one live Quran classes with qualified male and female teachers. Learn about our approach and what we believe in.`,
  alternates: { canonical: "/about" },
};

const values = [
  { title: "Accuracy first", text: "Correct pronunciation from the very first lesson, so students never have to unlearn mistakes." },
  { title: "Patience and respect", text: "Every student learns at their own pace. We never rush, and we never shame a mistake." },
  { title: "Consistency", text: "Short, regular lessons and daily practice build lasting progress." },
  { title: "Trust", text: "Clear pricing, a free trial before you pay and the freedom to change or cancel." },
];

export default async function AboutPage() {
  const site = await getSite();
  return (
    <>
      <PageHero
        title={`About ${site.name}`}
        arabic="إِنَّ أَفْضَلَكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"
        text="Quality Quran teaching, one student at a time, from wherever you are."
      />

      <Section>
        <div className="mx-auto max-w-3xl space-y-5 text-lg leading-relaxed text-ink">
          <p>
            {site.name} exists to make good Quran teaching easy to reach. Many families live far from a qualified
            teacher, or cannot fit a drive to the mosque around school and work. Live online lessons remove both
            problems.
          </p>
          <p>
            Every lesson is one-to-one. Your teacher listens to you, corrects you as you recite and adjusts the pace to
            suit you. Children and adults, complete beginners and experienced readers all learn this way.
          </p>
          <p>
            We offer male and female teachers so that every student, and every parent, feels comfortable. You start with
            a free {site.trialDays}-day trial, so you can meet a teacher and see how lessons feel before deciding.
          </p>
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading eyebrow="What we believe" title="Our values" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <Card key={v.title}>
              <h3 className="text-lg font-bold text-brand-800">{v.title}</h3>
              <p className="mt-2 text-muted">{v.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="How we teach" title="A simple, proven structure" />
        <ol className="mx-auto max-w-3xl space-y-4 text-ink">
          {[
            "A short assessment so the teacher knows exactly where the student is.",
            "A personal plan: Noorani Qaida, Quran reading, tajweed, hifz or Arabic.",
            `Live ${site.sessionMinutes}-minute one-to-one lessons on the days that suit your family.`,
            "Daily practice goals between lessons.",
            "A monthly progress report so you always know what has been achieved.",
          ].map((s, i) => (
            <li key={s} className="flex gap-4 rounded-2xl border border-brand-100 bg-white p-4">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gold-500 font-serif font-bold text-brand-900">
                {i + 1}
              </span>
              <span className="self-center">{s}</span>
            </li>
          ))}
        </ol>
      </Section>

      <CtaBanner />
    </>
  );
}
