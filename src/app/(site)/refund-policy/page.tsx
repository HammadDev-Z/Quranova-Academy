import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getSite } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Refund Policy",
  alternates: { canonical: "/refund-policy" },
};

export default async function RefundPage() {
  const site = await getSite();
  return (
    <LegalPage title="Refund Policy" updated="2 October 2026">
      <p>
        We want you to be happy with your lessons. That is why we offer a free {site.trialDays}-day trial before any
        payment is taken.
      </p>

      <h2>Free trial</h2>
      <p>No payment is needed for the trial, so there is nothing to refund if you decide not to continue.</p>

      <h2>Monthly fees</h2>
      <ul>
        <li>If you cancel before a new month starts, you will not be charged for that month.</li>
        <li>
          If you cancel part-way through a month, please contact us. We will review unused classes and, where
          appropriate, refund or credit them.
        </li>
        <li>Classes missed by us are rescheduled or refunded.</li>
      </ul>

      <h2>How to request a refund</h2>
      <p>
        Email <a href={`mailto:${site.email}`}>{site.email}</a> with the student&apos;s name and the reason. We aim to reply
        within a few working days.
      </p>
    </LegalPage>
  );
}
