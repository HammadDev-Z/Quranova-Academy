import type { MetadataRoute } from "next";
import { siteStatic } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/free-trial/thank-you", "/admin"] },
    sitemap: `${siteStatic.url}/sitemap.xml`,
  };
}
