import type { MetadataRoute } from "next";
import { siteStatic } from "@/content/site";
import { getCourses, getPosts } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, posts] = await Promise.all([getCourses(), getPosts()]);
  const base = siteStatic.url;
  const staticPages = ["", "/about", "/courses", "/teachers", "/packages", "/free-trial", "/contact", "/faq", "/blog"];
  const legal = ["/privacy-policy", "/terms", "/refund-policy"];

  return [
    ...staticPages.map((p) => ({
      url: `${base}${p}`,
      changeFrequency: "monthly" as const,
      priority: p === "" ? 1 : p === "/free-trial" ? 0.9 : 0.7,
    })),
    ...courses.map((c) => ({ url: `${base}/courses/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...legal.map((p) => ({ url: `${base}${p}`, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
