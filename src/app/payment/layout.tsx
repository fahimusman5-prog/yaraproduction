import { privateMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = privateMetadata("Payment");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
