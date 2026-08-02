import { PosRouteLayout } from "@/modules/pos/PosRouteLayout";
import { privateMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = privateMetadata("Point of sale");
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) { return <PosRouteLayout>{children}</PosRouteLayout>; }
