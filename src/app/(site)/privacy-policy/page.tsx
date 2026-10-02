import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getSite } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPage() {
  const site = await getSite();
  return (
    <LegalPage title="Privacy Policy" updated="2 October 2026">
      <p>
        {site.name} (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy explains what information we collect through this
        website, why we collect it and how we look after it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Trial and contact forms:</strong> parent or guardian name, student name and age, country, timezone,
          email address, WhatsApp or phone number, course interest, preferred times and any message you write.
        </li>
        <li>
          <strong>Analytics (optional):</strong> if you accept cookies, we use Google Analytics to understand how the site
          is used. Nothing is tracked if you decline.
        </li>
        <li>
          <strong>Technical data:</strong> your IP address is used briefly to prevent spam and abuse.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To contact you about your trial request or enquiry</li>
        <li>To match the student with a suitable teacher and schedule</li>
        <li>To improve our website and services</li>
        <li>To keep the website secure</li>
      </ul>

      <h2>Children&apos;s information</h2>
      <p>
        Many of our students are children. We only collect a child&apos;s details from a parent or guardian, and only what we
        need to arrange lessons.
      </p>

      <h2>Sharing your information</h2>
      <p>
        We do not sell your information. We share it only with the teachers and service providers who need it to deliver
        lessons and run the website, or where the law requires it.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep enquiry details for as long as needed to respond to you and to run your lessons, and then delete or
        anonymise them.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct or delete the personal information we hold about you at any time. Email us at{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email <a href={`mailto:${site.email}`}>{site.email}</a> or call {site.phoneDisplay}.
      </p>
    </LegalPage>
  );
}
