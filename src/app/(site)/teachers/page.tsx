import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import { Card, PageHero, Section, SectionHeading } from "@/components/ui";
import { teacherStandards } from "@/content/teachers";
import { getPublicTeachers } from "@/lib/content";

export const metadata: Metadata = {
  title: "Our Teachers",
  description:
    "Qualified male and female Quran teachers, trained to teach online. See how we choose teachers and what to expect from your lessons.",
  alternates: { canonical: "/teachers" },
};

export default async function TeachersPage() {
  const teachers = await getPublicTeachers();
  return (
    <>
      <PageHero
        title="Our Teachers"
        text="Qualified, patient and trained to teach online, with both male and female teachers available."
      />

      {teachers.length > 0 && (
        <Section>
          <SectionHeading title="Meet the team" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map((t) => (
              <Card key={t.name}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 font-serif text-xl font-bold text-white">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <h3 className="mt-4 text-lg font-bold text-brand-800">{t.name}</h3>
                <p className="text-sm font-medium text-gold-600">
                  {t.title} · {t.gender === "female" ? "Female" : "Male"} teacher
                </p>
                <p className="mt-3 text-muted">{t.bio}</p>
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-brand-700">Qualifications: </span>
                  {t.qualifications.join(", ")}
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold text-brand-700">Languages: </span>
                  {t.languages.join(", ")}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Section tone={teachers.length > 0 ? "white" : "default"}>
        <SectionHeading
          eyebrow="Our standards"
          title="What every teacher brings"
          text="We match each student with a teacher who suits their age, level, language and timezone."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {teacherStandards.map((s) => (
            <Card key={s.title}>
              <h3 className="text-lg font-bold text-brand-800">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <CtaBanner title="Meet your teacher in a free trial" />
    </>
  );
}
