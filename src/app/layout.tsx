import type { Metadata } from "next";
import { JsonLd, organizationSchema, SITE_NAME, SITE_ORIGIN, websiteSchema } from "@/lib/seo";
import "../index.css";
import "./staff.css";

export const metadata: Metadata = {
  title: "YARA Productions | Premium Skincare in Sri Lanka & UAE",
  description: "Shop premium YARA Productions skincare, beauty and herbal products in Sri Lanka and the UAE. Explore face care, body care, hair care and bestselling beauty essentials.",
  metadataBase: new URL(SITE_ORIGIN),
  openGraph: { type: "website", siteName: SITE_NAME, title: "YARA Productions | Premium Skincare in Sri Lanka & UAE", description: "Shop premium YARA Productions skincare, beauty and herbal products in Sri Lanka and the UAE.", url: `${SITE_ORIGIN}/en`, images: [{ url: `${SITE_ORIGIN}/opengraph-image`, alt: "YARA Productions skincare" }] },
  twitter: { card: "summary_large_image", title: "YARA Productions | Premium Skincare in Sri Lanka & UAE", description: "Shop premium YARA Productions skincare, beauty and herbal products in Sri Lanka and the UAE.", images: [`${SITE_ORIGIN}/opengraph-image`] },
  icons: {
    icon: "/icon",
    apple: "/icon",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><JsonLd data={organizationSchema()} /><JsonLd data={websiteSchema()} />{children}</body></html>;
}
