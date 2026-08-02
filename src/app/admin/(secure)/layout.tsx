import { AdminRouteLayout } from "@/modules/admin/AdminRouteLayout";
import { privateMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = privateMetadata("Admin");

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) { return <AdminRouteLayout>{children}</AdminRouteLayout>; }
