import type { Metadata } from "next";
import "../index.css";
import "./staff.css";

export const metadata: Metadata = {
  title: "YARA | Luxury Skincare",
  description: "YARA luxury skincare, commerce administration, and point of sale.",
  metadataBase: new URL("https://www.yaraproduct.com"),
  alternates: { canonical: "/en" },
  openGraph: {
    type: "website",
    siteName: "YARA",
    title: "YARA | Luxury Skincare",
    description: "Discover YARA luxury skincare.",
    url: "https://www.yaraproduct.com/en",
  },
  twitter: { card: "summary_large_image", title: "YARA | Luxury Skincare", description: "Discover YARA luxury skincare." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
