import { CookieConsent } from "@/components/cookie-consent";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getCourses } from "@/lib/content";
import { getSite } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, courses] = await Promise.all([getSite(), getCourses()]);

  const organization = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: site.name,
    url: site.url,
    description: site.description,
    email: site.email,
    telephone: site.phoneHref,
    knowsAbout: ["Quran recitation", "Tajweed", "Noorani Qaida", "Hifz", "Arabic language", "Islamic studies"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: site.phoneHref,
        email: site.email,
        contactType: "customer service",
        availableLanguage: ["English", "Urdu", "Arabic"],
      },
    ],
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-brand-800"
      >
        Skip to content
      </a>
      <Header
        courses={courses.map((c) => ({ slug: c.slug, title: c.title }))}
        trialDays={site.trialDays}
        phoneDisplay={site.phoneDisplay}
        phoneHref={site.phoneHref}
        email={site.email}
        announcement={site.announcement}
      />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppButton />
      <CookieConsent />
      <JsonLd data={organization} />
    </>
  );
}
