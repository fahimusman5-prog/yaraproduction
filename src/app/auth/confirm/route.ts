import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const allowedNext = /^\/(?:en|si|ta|ar)\/account(?:[/?#]|$)/;
const errorCodes = new Set(["otp_expired", "access_denied", "invalid", "rate_limit"]);

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/en/account";
  return allowedNext.test(value) ? value : "/en/account";
}

function failure(request: Request, code: string) {
  const url = new URL("/en/auth/confirmation-error", request.url);
  url.searchParams.set("code", errorCodes.has(code) ? code : "invalid");
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const config = getSupabaseConfig();
  if (!config) return failure(request, "invalid");

  const cookieStore = await cookies();
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });

  const verification = tokenHash && type
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "email" })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Missing confirmation parameters") };
  if (verification.error) return failure(request, "code" in verification.error ? verification.error.code ?? "invalid" : "invalid");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user || !userData.user.email_confirmed_at) return failure(request, "invalid");

  try {
    const admin = getSupabaseAdminClient();
    const profile = await admin.from("profiles").select("id,role").eq("id", userData.user.id).maybeSingle();
    if (profile.error) return failure(request, "invalid");
    if (!profile.data) {
      const created = await admin.from("profiles").insert({ id: userData.user.id, email: userData.user.email, full_name: String(userData.user.user_metadata?.full_name ?? ""), role: "customer" }).select("id").single();
      if (created.error) return failure(request, "invalid");
    }
  } catch {
    return failure(request, "invalid");
  }

  const destination = new URL(next, request.url);
  destination.searchParams.set("confirmed", "true");
  return NextResponse.redirect(destination);
}
