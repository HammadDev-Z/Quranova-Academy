import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { CtaBanner } from "@/components/cta-banner";
import { JsonLd } from "@/components/json-ld";
import { Container, PageHero } from "@/components/ui";
import { getSite } from "@/lib/settings";
import { formatDate, getPost, getPosts } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.publishedAt?.toISOString() },
  };
}

export default async function PostPage({ params }: Props) {
  const [post, site, allPosts] = await Promise.all([getPost((await params).slug), getSite(), getPosts()]);
  if (!post) notFound();

  const related = allPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  return (
    <>
      <PageHero title={post.title} text={`${post.category} · ${formatDate(post.publishedAt)} · ${post.readingMinutes} min read`} />
      <Container className="py-12">
        <article className="prose-content mx-auto max-w-3xl text-lg">
          <Markdown>{post.content}</Markdown>
        </article>

        {related.length > 0 && (
          <aside className="mx-auto mt-14 max-w-3xl border-t border-brand-100 pt-8">
            <h2 className="font-serif text-2xl font-bold text-brand-800">Keep reading</h2>
            <ul className="mt-4 space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/blog/${r.slug}`} className="font-medium text-brand-600 hover:underline">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </Container>
      <CtaBanner />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt?.toISOString(),
          author: { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name },
          mainEntityOfPage: `${site.url}/blog/${post.slug}`,
        }}
      />
    </>
  );
}
