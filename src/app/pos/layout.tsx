import { PosRouteLayout } from "@/modules/pos/PosRouteLayout";
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) { return <PosRouteLayout>{children}</PosRouteLayout>; }
