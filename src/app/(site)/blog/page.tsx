import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui";
import { formatDate, getPosts } from "@/lib/content";
import { siteStatic } from "@/content/site";

export const metadata: Metadata = {
  title: "Blog",
  description: `Guides on learning the Quran, tajweed, Noorani Qaida and supporting your child, from the ${siteStatic.name} team.`,
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <PageHero title="Blog" text="Guides and tips for learning the Quran and supporting your family's journey." />
      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <article
              key={p.slug}
              className="flex flex-col rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">{p.category}</p>
              <h2 className="mt-2 text-xl font-bold text-brand-800">
                <Link href={`/blog/${p.slug}`} className="hover:underline">
                  {p.title}
                </Link>
              </h2>
              <p className="mt-3 flex-1 text-muted">{p.description}</p>
              <p className="mt-4 text-sm text-muted">
                <time dateTime={p.publishedAt?.toISOString()}>{formatDate(p.publishedAt)}</time> · {p.readingMinutes} min read
              </p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
