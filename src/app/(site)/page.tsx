import Link from "next/link";
import { CtaBanner } from "@/components/cta-banner";
import { FaqList } from "@/components/faq-list";
import { LogoMark } from "@/components/logo";
import { Button, Card, CheckList, Container, Section, SectionHeading } from "@/components/ui";
import { getCourses, getFaqs, getPackages, getTestimonials } from "@/lib/content";
import { getSite } from "@/lib/settings";

const reasons = (siblingDiscountPercent: number) => [
  {
    title: "Truly one-to-one",
    text: "Your teacher teaches only you. Every mistake is heard and corrected, and the pace is yours.",
  },
  {
    title: "Word-by-word tajweed",
    text: "Pronunciation is corrected as you recite, with each rule explained in plain language.",
  },
  {
    title: "Male and female teachers",
    text: "Choose the teacher you or your child feels most comfortable with.",
  },
  {
    title: "Flexible timings",
    text: "Classes fit around school, work and prayer times, across the UK, Europe, USA, Canada and Australia.",
  },
  {
    title: "Monthly progress reports",
    text: "See exactly what has been learned and what comes next, so you always know where you stand.",
  },
  {
    title: "Honest, simple pricing",
    text: `Clear monthly plans, a ${siblingDiscountPercent}% sibling discount, and you can change or cancel at any time.`,
  },
];

export default async function Home() {
  const [site, courses, faqs, packages, testimonials] = await Promise.all([
    getSite(),
    getCourses(),
    getFaqs(),
    getPackages(),
    getTestimonials(),
  ]);

  const cheapest = packages.length ? Math.min(...packages.map((p) => p.priceMinor)) / 100 : 20;
  const trustPoints = [
    { big: "1-to-1", small: "Private live classes" },
    { big: "Male & Female", small: "Qualified teachers" },
    { big: `${site.trialDays}-Day`, small: "Free trial, no card" },
    { big: `${site.sessionMinutes} min`, small: "Focused sessions" },
    { big: `From £${cheapest}`, small: "Per month" },
  ];
  const steps = [
    { n: "1", title: "Book your free trial", text: "Tell us about the student and the times that suit you. It takes two minutes." },
    { n: "2", title: "Meet your teacher", text: `Try ${site.trialDays} days of free one-to-one lessons with a teacher matched to you.` },
    { n: "3", title: "Choose your plan", text: "Happy with the trial? Pick a weekly plan and start learning. If not, no obligation." },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-800 pattern text-white">
        <Container className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="stagger">
            <p lang="ar" dir="rtl" className="font-arabic text-2xl text-gold-300 sm:text-3xl lg:text-right">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Learn the Quran <span className="text-gold-300">one-to-one</span>, from home
            </h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">
              Live online classes with qualified male and female teachers for children and adults. Noorani Qaida,
              Tajweed, Hifz, Arabic and more, at a pace that suits you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/free-trial" variant="gold" size="lg">
                Book your free trial
              </Button>
              <Button href="/packages" variant="light" size="lg">
                See packages
              </Button>
            </div>
            <p className="mt-4 text-sm text-brand-200">
              {site.trialDays} days free. No card needed. Plans from £{cheapest}/month.
            </p>
          </div>

          <div className="sheet-in relative mx-auto w-full max-w-sm [animation-delay:200ms]">
            <div className="rounded-3xl border border-gold-500/40 bg-white/5 p-8 text-center backdrop-blur">
              <LogoMark className="mx-auto h-20 w-20" />
              <p lang="ar" dir="rtl" className="mt-6 font-arabic text-3xl text-gold-300">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <ul className="mt-6 space-y-2 text-left text-sm text-brand-50">
                {["Live one-to-one lessons", "Tajweed corrected word by word", "Children, teens and adults", "Free trial"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Trust strip */}
      <section className="border-b border-brand-100 bg-white">
        <Container className="reveal grid grid-cols-2 gap-y-6 py-8 text-center sm:grid-cols-3 lg:grid-cols-5">
          {trustPoints.map((t) => (
            <div key={t.big}>
              <p className="font-serif text-2xl font-bold text-brand-700">{t.big}</p>
              <p className="text-sm text-muted">{t.small}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Why choose us */}
      <Section>
        <SectionHeading
          eyebrow="Why Quranova"
          title="Learning that fits your family"
          text="Everything is designed around the student: the teacher, the pace and the schedule."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons(site.siblingDiscountPercent).map((r) => (
            <Card key={r.title}>
              <h3 className="text-lg font-bold text-brand-800">{r.title}</h3>
              <p className="mt-2 text-muted">{r.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Courses */}
      <Section tone="white" className="pattern-light">
        <SectionHeading
          eyebrow="Courses"
          title="From the first letter to full memorisation"
          text="Whatever the starting point, there is a course and a teacher to take you further."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((c) => (
            <Link
              key={c.slug}
              href={`/courses/${c.slug}`}
              className="group flex flex-col rounded-2xl border border-brand-100 bg-cream p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <span lang="ar" dir="rtl" className="font-arabic text-2xl text-gold-600">
                {c.arabic}
              </span>
              <h3 className="mt-2 text-lg font-bold text-brand-800">{c.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{c.short}</p>
              <span className="mt-4 text-sm font-semibold text-brand-600 group-hover:underline">Learn more →</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <SectionHeading eyebrow="How it works" title="Start in three simple steps" />
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="relative rounded-2xl border border-brand-100 bg-white p-6 pt-10 shadow-sm">
              <span className="absolute -top-5 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 font-serif text-xl font-bold text-brand-900">
                {s.n}
              </span>
              <h3 className="text-lg font-bold text-brand-800">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Teachers promise */}
      <Section tone="dark">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              invert
              eyebrow="Our teachers"
              title="Teachers who care about every student"
              text="Qualified, patient and trained to teach online, with both male and female teachers available."
            />
            <Button href="/teachers" variant="gold">
              How we choose our teachers
            </Button>
          </div>
          <CheckList
            invert
            items={[
              "Recognised qualifications in Quran and tajweed",
              "Tested and trained before they teach",
              "Patient with young children and adults alike",
              "Matched to your timezone and schedule",
              "Ask for a different teacher at any time",
            ]}
          />
        </div>
      </Section>

      {/* Testimonials (hidden until real ones are added) */}
      {testimonials.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Reviews" title="What families say" />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <p className="italic text-ink">“{t.quote}”</p>
                <p className="mt-4 font-semibold text-brand-800">{t.name}</p>
                <p className="text-sm text-muted">{t.location}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* FAQ */}
      <Section>
        <SectionHeading eyebrow="FAQ" title="Questions parents ask" />
        <FaqList items={faqs.slice(0, 5).map((f) => ({ q: f.question, a: f.answer }))} />
        <p className="mt-8 text-center">
          <Link href="/faq" className="font-semibold text-brand-600 hover:underline">
            See all questions →
          </Link>
        </p>
      </Section>

      <CtaBanner />
    </>
  );
}
