import { getSite, whatsappLink } from "@/lib/settings";

export function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      <path d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.55 4.18 1.6 6L4 28l7.1-1.86a12 12 0 005.94 1.56h.01C23.68 27.7 29 22.3 29 15.66 29 9.02 22.68 3 16.04 3zm0 22.1a9.97 9.97 0 01-5.08-1.39l-.36-.22-4.21 1.1 1.12-4.1-.24-.38a9.97 9.97 0 01-1.53-5.3c0-5.5 4.49-9.98 10.02-9.98 5.52 0 10.01 4.48 10.01 10 0 5.5-4.5 9.97-10.03 9.97l.3.3zm5.5-7.47c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.25-.58-.5-.5-.68-.5h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.08 4.5.7.3 1.26.48 1.7.62.72.23 1.37.2 1.88.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.12-.28-.2-.58-.35z" />
    </svg>
  );
}

export async function WhatsAppButton() {
  const site = await getSite();
  return (
    <a
      href={whatsappLink(site)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebe5b]"
    >
      <WhatsAppIcon />
      <span className="hidden text-sm font-semibold sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
