import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.yaraproduct.com";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/pos", "/api", "/payment"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
