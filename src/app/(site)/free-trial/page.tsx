import type { Metadata } from "next";
import { TrialForm } from "@/components/trial-form";
import { Card, CheckList, Container, PageHero } from "@/components/ui";
import { getCourses } from "@/lib/content";
import { getSite, whatsappLink } from "@/lib/settings";
import { siteStatic } from "@/content/site";

export const metadata: Metadata = {
  title: "Book a Free Trial",
  description: `Book free one-to-one Quran lessons with ${siteStatic.name}. No card needed and no obligation.`,
  alternates: { canonical: "/free-trial" },
};

type Props = { searchParams: Promise<{ course?: string }> };

export default async function FreeTrialPage({ searchParams }: Props) {
  const { course: slug } = await searchParams;
  const [site, courses] = await Promise.all([getSite(), getCourses()]);
  const defaultCourse = courses.find((c) => c.slug === slug)?.title;

  return (
    <>
      <PageHero
        title="Book your free trial"
        text={`${site.trialDays} days of free one-to-one lessons. No card needed, no obligation.`}
      />
      <Container className="grid gap-8 py-12 lg:grid-cols-[1.5fr_0.8fr]">
        <Card className="p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-bold text-brand-800">Tell us about the student</h2>
          <p className="mb-6 mt-1 text-muted">We will contact you on WhatsApp or email to arrange the first class.</p>
          <TrialForm courseTitles={courses.map((c) => c.title)} defaultCourse={defaultCourse} />
        </Card>

        <aside className="space-y-5">
          <Card>
            <h2 className="font-serif text-xl font-bold text-brand-800">What happens next</h2>
            <ol className="mt-4 space-y-3 text-sm">
              <li>
                <span className="font-semibold text-brand-700">1. We contact you</span>
                <br />
                Usually within a day, on WhatsApp or email.
              </li>
              <li>
                <span className="font-semibold text-brand-700">2. You meet your teacher</span>
                <br />
                {site.trialDays} days of free live lessons.
              </li>
              <li>
                <span className="font-semibold text-brand-700">3. You decide</span>
                <br />
                Continue with a plan, or stop. No obligation.
              </li>
            </ol>
          </Card>
          <Card>
            <h2 className="font-serif text-xl font-bold text-brand-800">Included</h2>
            <div className="mt-4 text-sm">
              <CheckList
                items={[
                  "One-to-one live classes",
                  "Male or female teacher",
                  "Flexible timings",
                  `${site.siblingDiscountPercent}% sibling discount`,
                ]}
              />
            </div>
          </Card>
          <p className="text-center text-sm text-muted">
            Prefer to chat?{" "}
            <a href={whatsappLink(site)} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 underline">
              Message us on WhatsApp
            </a>
          </p>
        </aside>
      </Container>
    </>
  );
}
