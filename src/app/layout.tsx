import type { Metadata } from "next";
import "../index.css";
import "./staff.css";

export const metadata: Metadata = {
  title: "YARA | Luxury Skincare",
  description: "YARA luxury skincare, commerce administration, and point of sale.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
