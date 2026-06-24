import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/types";

export async function getPosProducts() {
  const supabase = await getSupabaseServerClient(); if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("products").select("*,categories(name)").eq("status", "active").order("name");
  if (error) throw new Error(error.message); return (data ?? []) as Product[];
}

export async function getPosSales() {
  const supabase = await getSupabaseServerClient(); if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("pos_sales").select("*,profiles(full_name)").order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message); return data ?? [];
}
