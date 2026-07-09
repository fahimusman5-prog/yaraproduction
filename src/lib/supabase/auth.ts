import "server-only";

import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "./admin";
import { getSupabaseServerClient } from "./server";
import type { Profile, StaffRole } from "./types";

export interface StaffContext {
  userId: string;
  email: string;
  profile: Profile & { role: StaffRole };
}

export async function getStaffContext(): Promise<StaffContext | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return null;

  const { data: profile, error } = await getSupabaseAdminClient()
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .eq("id", userId)
    .single();
  const staffProfile = profile as Partial<Profile> | null;

  if (error || !staffProfile || !["admin", "staff"].includes(String(staffProfile.role))) return null;
  return {
    userId,
    email: String(claimsData.claims.email ?? staffProfile.email),
    profile: staffProfile as StaffContext["profile"],
  };
}

export async function requireStaff(nextPath = "/admin"): Promise<StaffContext> {
  const staff = await getStaffContext();
  if (!staff) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  return staff;
}

export async function requireAdmin(nextPath = "/admin"): Promise<StaffContext> {
  const staff = await requireStaff(nextPath);
  if (staff.profile.role !== "admin") redirect("/admin?error=admin-required");
  return staff;
}
