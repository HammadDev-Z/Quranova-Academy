import Link from "next/link";
import { getCourses } from "@/lib/content";
import { getSite, whatsappLink } from "@/lib/settings";
import { Logo } from "./logo";
import { Container } from "./ui";

const company = [
  { href: "/about", label: "About us" },
  { href: "/teachers", label: "Our teachers" },
  { href: "/packages", label: "Packages & fees" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const legal = [
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms", label: "Terms & conditions" },
  { href: "/refund-policy", label: "Refund policy" },
];

export async function Footer() {
  const [site, courses] = await Promise.all([getSite(), getCourses()]);
  return (
    <footer className="bg-brand-900 pattern text-brand-100">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo invert />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            One-to-one live Quran classes with qualified male and female teachers, from the comfort of your home.
          </p>
          <p lang="ar" dir="rtl" className="mt-4 font-arabic text-xl text-gold-300">
            خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
          </p>
        </div>

        <div>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-gold-300">Courses</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {courses.map((c) => (
              <li key={c.slug}>
                <Link href={`/courses/${c.slug}`} className="hover:text-white">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-gold-300">Academy</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {company.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-gold-300">Get in touch</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={whatsappLink(site)} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp: {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`tel:${site.phoneHref}`} className="hover:text-white">
                Call: {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="break-all hover:text-white">
                {site.email}
              </a>
            </li>
          </ul>
          <Link
            href="/free-trial"
            className="mt-5 inline-flex rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-900 hover:bg-gold-400"
          >
            Book a free trial
          </Link>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-sm sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
