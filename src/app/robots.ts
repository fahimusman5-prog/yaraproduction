import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.yaraproduct.com";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/pos", "/api", "/payment", "/cart", "/checkout", "/account", "/login", "/reset-password", "/search", "/*?*token=", "/*?*_vercel_share="] }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
