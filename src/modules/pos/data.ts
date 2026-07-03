import "server-only";
import { requireStaff } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/types";

async function client(nextPath: string) {
  await requireStaff(nextPath);
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function getPosProducts() {
  const supabase = await client("/pos");
  const { data, error } = await supabase.from("products").select("*,categories(name)").eq("status", "active").order("name");
  if (error) { console.error("[pos:data:products]", error); throw new Error(`Load POS products failed: ${error.message}`); } return (data ?? []) as Product[];
}

export async function getPosSales() {
  const supabase = await client("/pos/history");
  const { data, error } = await supabase.from("pos_sales").select("*,profiles(full_name)").order("created_at", { ascending: false }).limit(500);
  if (error) { console.error("[pos:data:sales]", error); throw new Error(`Load POS sales failed: ${error.message}`); } return data ?? [];
}
