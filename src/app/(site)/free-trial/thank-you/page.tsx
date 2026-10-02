import type { Metadata } from "next";
import { Button, Container } from "@/components/ui";
import { getSite, whatsappLink } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Request Received",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage() {
  const site = await getSite();
  return (
    <Container className="py-20 text-center">
      <p lang="ar" dir="rtl" className="font-arabic text-3xl text-gold-600">
        جَزَاكَ اللَّهُ خَيْرًا
      </p>
      <h1 className="mt-3 text-4xl font-bold text-brand-800">Thank you, request received</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
        We will contact you on WhatsApp or email shortly to arrange your free trial. If you gave us your email, a
        confirmation is on its way.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button href={whatsappLink(site)} variant="primary" size="lg">
          Message us on WhatsApp
        </Button>
        <Button href="/courses" variant="outline" size="lg">
          Explore courses
        </Button>
      </div>
      <p className="mt-6 text-sm text-muted">
        Or call {site.phoneDisplay} / email {site.email}
      </p>
    </Container>
  );
}
