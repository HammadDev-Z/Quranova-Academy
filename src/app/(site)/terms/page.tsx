import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getSite } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const site = await getSite();
  return (
    <LegalPage title="Terms & Conditions" updated="2 October 2026">
      <p>By using this website or booking classes with {site.name}, you agree to these terms.</p>

      <h2>Classes</h2>
      <ul>
        <li>Classes are one-to-one, live and online, and last {site.sessionMinutes} minutes unless agreed otherwise.</li>
        <li>You need a suitable device, camera, microphone and internet connection to attend.</li>
        <li>Parents or guardians are responsible for supervising young children during lessons.</li>
      </ul>

      <h2>Free trial</h2>
      <p>
        The free trial lasts {site.trialDays} days, requires no payment details and carries no obligation to continue.
      </p>

      <h2>Fees and payment</h2>
      <ul>
        <li>Fees are charged monthly in advance, in GBP, according to the plan you choose.</li>
        <li>A {site.siblingDiscountPercent}% discount applies to each additional sibling enrolled.</li>
        <li>We will confirm the available payment methods before your first payment.</li>
      </ul>

      <h2>Changing or cancelling</h2>
      <p>
        You can change your schedule or cancel at any time. Please give us notice, and see our{" "}
        <a href="/refund-policy">refund policy</a> for how unused classes are handled.
      </p>

      <h2>Missed and rescheduled classes</h2>
      <p>
        Please tell us as early as you can if you cannot attend. We will do our best to reschedule classes missed with
        reasonable notice.
      </p>

      <h2>Conduct</h2>
      <p>
        We expect respectful behaviour from students, parents and teachers. We may end lessons where conduct is
        inappropriate.
      </p>

      <h2>Changes to these terms</h2>
      <p>We may update these terms from time to time. The date at the top shows when they were last changed.</p>

      <h2>Contact</h2>
      <p>
        Email <a href={`mailto:${site.email}`}>{site.email}</a> or call {site.phoneDisplay}.
      </p>
    </LegalPage>
  );
}
