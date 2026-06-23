import { AdminRouteLayout } from "@/modules/admin/AdminRouteLayout";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) { return <AdminRouteLayout>{children}</AdminRouteLayout>; }
