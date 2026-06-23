import { requireStaff } from "@/lib/supabase/auth";

export async function PosRouteLayout({ children }: { children: React.ReactNode }) {
  await requireStaff("/pos");
  return <div className="staff-root">{children}</div>;
}
