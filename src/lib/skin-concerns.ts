import "server-only";

import { cache } from "react";
import { getSupabaseServerClient } from "./supabase/server";

export type PublicSkinConcern = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  updated_at: string;
};

export const getActiveSkinConcernBySlug = cache(async (slug: string): Promise<PublicSkinConcern | null> => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("skin_concerns")
    .select("id,name,slug,description,updated_at")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) return null;
  return data as PublicSkinConcern | null;
});
