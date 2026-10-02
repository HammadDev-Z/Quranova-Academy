import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBanner } from "@/components/cta-banner";
import { JsonLd } from "@/components/json-ld";
import { Button, Card, CheckList, PageHero, Section } from "@/components/ui";
import { getCourse, getCourses } from "@/lib/content";
import { getSite } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getCourses()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [course, site] = await Promise.all([getCourse((await params).slug), getSite()]);
  if (!course) return {};
  return {
    title: `${course.title} Online`,
    description: `${course.short} One-to-one live ${course.title} classes online with qualified teachers. Free ${site.trialDays}-day trial.`,
    alternates: { canonical: `/courses/${course.slug}` },
  };
}

export default async function CoursePage({ params }: Props) {
  const [course, courses, site] = await Promise.all([getCourse((await params).slug), getCourses(), getSite()]);
  if (!course) notFound();

  const others = courses.filter((c) => c.slug !== course.slug).slice(0, 4);

  return (
    <>
      <PageHero title={course.title} arabic={course.arabic} text={course.short} />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-10">
            <p className="text-lg leading-relaxed text-ink">{course.intro}</p>

            <div>
              <h2 className="text-2xl font-bold text-brand-800">What you will achieve</h2>
              <div className="mt-4">
                <CheckList items={course.outcomes} />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-brand-800">What is covered</h2>
              <ol className="mt-4 space-y-2">
                {course.syllabus.map((s, i) => (
                  <li key={s} className="flex gap-3 rounded-xl border border-brand-100 bg-white p-3.5">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <Card>
              <h2 className="font-serif text-xl font-bold text-brand-800">Course details</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-brand-700">Level</dt>
                  <dd>{course.level}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-brand-700">Suitable for</dt>
                  <dd>{course.audience}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-brand-700">Format</dt>
                  <dd>One-to-one live, {site.sessionMinutes} minutes per class</dd>
                </div>
                <div>
                  <dt className="font-semibold text-brand-700">Plans</dt>
                  <dd>See packages</dd>
                </div>
              </dl>
              <Button href={`/free-trial?course=${course.slug}`} variant="gold" className="mt-5 w-full">
                Book free trial
              </Button>
              <p className="mt-2 text-center text-xs text-muted">{site.trialDays} days free, no card needed</p>
            </Card>

            <Card>
              <h2 className="font-serif text-lg font-bold text-brand-800">Other courses</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {others.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/courses/${c.slug}`} className="text-brand-600 hover:underline">
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </Section>

      <CtaBanner />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.intro,
          provider: { "@type": "EducationalOrganization", name: site.name, url: site.url },
          educationalLevel: course.level,
        }}
      />
    </>
  );
}
