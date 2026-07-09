import type { PostgrestError } from "@supabase/supabase-js";

type SupabaseLikeError = Partial<Pick<PostgrestError, "code" | "message" | "details" | "hint">>;

export function logSupabaseError(area: string, action: string, error: unknown) {
  const supabaseError = (error ?? {}) as SupabaseLikeError;
  console.error({
    area,
    action,
    supabaseCode: supabaseError.code,
    message: supabaseError.message ?? (error instanceof Error ? error.message : String(error)),
    details: supabaseError.details,
    hint: supabaseError.hint,
  });
}

export function messageFromSupabaseError(error: unknown, fallback: string) {
  const supabaseError = (error ?? {}) as SupabaseLikeError;
  return supabaseError.message ?? (error instanceof Error ? error.message : fallback);
}
