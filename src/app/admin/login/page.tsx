import { AdminLoginPage } from "@/modules/admin/AdminLoginPage";
import { privateMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = privateMetadata("Admin login");

export default function Page() { return <AdminLoginPage />; }
