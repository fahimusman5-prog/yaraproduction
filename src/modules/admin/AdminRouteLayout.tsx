import { requireStaff } from "@/lib/supabase/auth";
import { StaffShell } from "./components/StaffShell";

export async function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("/admin");
  return <StaffShell staff={staff}>{children}</StaffShell>;
}
