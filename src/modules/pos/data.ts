import "server-only";
import { requireStaff } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
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
  if (error) {
    logSupabaseError("pos-products", "select-products", error, {
      route: "/pos",
      table: "products",
    });
    throw new Error(messageFromSupabaseError(error, "Unable to load POS products.", {
      schemaUnavailable: "The product catalog is unavailable.",
    }));
  }
  return (data ?? []) as Product[];
}

export async function getPosSales() {
  const supabase = await client("/pos/history");
  const { data, error } = await supabase.from("pos_sales").select("*,profiles(full_name)").order("created_at", { ascending: false }).limit(500);
  if (error) {
    logSupabaseError("pos-history", "select-sales", error, {
      route: "/pos/history",
      table: "pos_sales",
    });
    throw new Error(messageFromSupabaseError(error, "Unable to load POS sales.", {
      schemaUnavailable: "The POS sales relationship is unavailable.",
    }));
  }
  return data ?? [];
}
