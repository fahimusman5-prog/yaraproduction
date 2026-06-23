import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  if (!config) return null;

  browserClient ??= createBrowserClient(config.url, config.publishableKey);
  return browserClient;
}
