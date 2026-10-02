import type { Metadata } from "next";
import Link from "next/link";
import { CtaBanner } from "@/components/cta-banner";
import { PageHero, Section } from "@/components/ui";
import { getCourses } from "@/lib/content";

export const metadata: Metadata = {
  title: "Quran Courses",
  description:
    "Noorani Qaida, Quran reading, Tajweed, Hifz, Translation and Tafseer, Arabic and Islamic Studies, taught one-to-one online by qualified teachers.",
  alternates: { canonical: "/courses" },
};

export default async function CoursesPage() {
  const courses = await getCourses();
  return (
    <>
      <PageHero
        title="Our Courses"
        text="From the first Arabic letter to memorising the Quran, choose the course that fits where you are today."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((c) => (
            <Link
              key={c.slug}
              href={`/courses/${c.slug}`}
              className="group rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold text-brand-800">{c.title}</h2>
                <span lang="ar" dir="rtl" className="font-arabic text-2xl text-gold-600">
                  {c.arabic}
                </span>
              </div>
              <p className="mt-3 text-muted">{c.short}</p>
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <div>
                  <dt className="inline font-semibold text-brand-700">Level: </dt>
                  <dd className="inline text-ink">{c.level}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-brand-700">For: </dt>
                  <dd className="inline text-ink">{c.audience}</dd>
                </div>
              </dl>
              <span className="mt-4 inline-block font-semibold text-brand-600 group-hover:underline">View course →</span>
            </Link>
          ))}
        </div>
      </Section>
      <CtaBanner />
    </>
  );
}
