import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Card, Container, PageHero } from "@/components/ui";
import { getSite, whatsappLink } from "@/lib/settings";
import { siteStatic } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact ${siteStatic.name} by WhatsApp, phone or email, or send us a message. We reply quickly.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const site = await getSite();
  return (
    <>
      <PageHero title="Contact us" text="Questions about courses, fees or timings? We are happy to help." />
      <Container className="grid gap-8 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-bold text-brand-800">Send us a message</h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </Card>

        <aside className="space-y-5">
          <Card>
            <h2 className="font-serif text-xl font-bold text-brand-800">Reach us directly</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li>
                <span className="block font-semibold text-brand-700">WhatsApp</span>
                <a href={whatsappLink(site)} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  {site.phoneDisplay}
                </a>
              </li>
              <li>
                <span className="block font-semibold text-brand-700">Phone</span>
                <a href={`tel:${site.phoneHref}`} className="text-brand-600 hover:underline">
                  {site.phoneDisplay}
                </a>
              </li>
              <li>
                <span className="block font-semibold text-brand-700">Email</span>
                <a href={`mailto:${site.email}`} className="break-all text-brand-600 hover:underline">
                  {site.email}
                </a>
              </li>
            </ul>
          </Card>
          <Card className="bg-brand-800 text-white">
            <h2 className="font-serif text-xl font-bold">Ready to start?</h2>
            <p className="mt-2 text-sm text-brand-100">Book {site.trialDays} days of free one-to-one lessons.</p>
            <a
              href="/free-trial"
              className="mt-4 inline-flex rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-900 hover:bg-gold-400"
            >
              Book free trial
            </a>
          </Card>
        </aside>
      </Container>
    </>
  );
}
