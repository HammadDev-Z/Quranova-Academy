import { Icon } from "@/components/teacher/icons";
import { WhatsAppIcon } from "@/components/whatsapp-button";
import { getSite, whatsappLink } from "@/lib/settings";

/** "Need help?" card at the bottom of the sidebar: one tap to WhatsApp or email the academy. */
export async function HelpCard() {
  const site = await getSite();
  return (
    <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <p className="font-sans text-sm font-extrabold text-slate-900">Need help?</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">Questions about a class or a lesson? We usually reply the same day.</p>
      <div className="mt-3 space-y-2">
        <a
          href={whatsappLink(site, "Assalamu alaikum! I need some help with the Quranova student portal.")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white transition duration-200 hover:bg-[#1ebe5b] active:scale-[0.97]"
        >
          <WhatsAppIcon className="h-4 w-4" /> WhatsApp us
        </a>
        <a
          href={`mailto:${site.email}`}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-800 transition duration-200 hover:bg-emerald-50 active:scale-[0.97]"
        >
          <Icon name="chat" className="h-4 w-4" /> Email
        </a>
      </div>
    </div>
  );
}
