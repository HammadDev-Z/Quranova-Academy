import { getSite, whatsappLink } from "@/lib/settings";
import { Button, Container } from "./ui";
import { WhatsAppIcon } from "./whatsapp-button";

export async function CtaBanner({ title = "Start your free trial today" }: { title?: string }) {
  const site = await getSite();
  return (
    <section className="bg-brand-700 pattern py-16 text-white">
      <Container className="text-center">
        <p lang="ar" dir="rtl" className="font-arabic text-2xl text-gold-300">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-brand-100">
          {site.trialDays} days of free one-to-one lessons. No card needed, no obligation.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/free-trial" variant="gold" size="lg">
            Book free trial
          </Button>
          <Button href={whatsappLink(site)} variant="light" size="lg">
            <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
            WhatsApp us
          </Button>
        </div>
      </Container>
    </section>
  );
}
