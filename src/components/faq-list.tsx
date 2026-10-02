import { JsonLd } from "./json-ld";

type Item = { q: string; a: string };

export function FaqList({ items }: { items: readonly Item[] }) {
  return (
    <>
      <div className="mx-auto max-w-3xl divide-y divide-brand-100 rounded-2xl border border-brand-100 bg-white">
        {items.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-800 [&::-webkit-details-marker]:hidden">
              {item.q}
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="h-5 w-5 flex-none text-gold-600 transition-transform group-open:rotate-45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M10 4v12M4 10h12" />
              </svg>
            </summary>
            <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((i) => ({
            "@type": "Question",
            name: i.q,
            acceptedAnswer: { "@type": "Answer", text: i.a },
          })),
        }}
      />
    </>
  );
}
