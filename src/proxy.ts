import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: Array<{ name: string; value: string; options: Parameters<typeof response.cookies.set>[2] }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { error: claimsError } = await supabase.auth.getClaims();
  if (claimsError?.code === "refresh_token_not_found") {
    // Remove only Supabase auth cookies so an expired session can cleanly reach
    // the login page instead of repeatedly failing every protected request.
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"))
        response.cookies.delete(cookie.name);
    }
  }

  const productMatch = request.nextUrl.pathname.match(/^\/(en|si|ta|ar)\/product\/([^/]+)$/);
  if (request.method === "GET" && productMatch) {
    const { data, error } = await supabase.from("products").select("id").eq("slug", productMatch[2]).eq("status", "active").maybeSingle();
    if (!error && !data) return new NextResponse("Not Found", { status: 404, headers: { "x-robots-tag": "noindex" } });
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/pos/:path*", "/:locale/product/:slug"],
};
