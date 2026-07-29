import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";

function csvValue(value: unknown) {
  const raw = value == null ? "" : String(value);
  const string = /^[\t\r ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${string.replaceAll('"', '""')}"`;
}

export async function GET() {
  try {
    await requireAdmin("/admin/newsletter");
    const { data, error } = await getSupabaseAdminClient()
      .from("newsletter_subscribers")
      .select("email,status,source,locale,country,subscribed_at,unsubscribed_at,created_at")
      .order("subscribed_at", { ascending: false });
    if (error) throw error;
    const headers = ["email", "status", "source", "locale", "country", "subscribed_at", "unsubscribed_at", "created_at"];
    const csv = `\uFEFF${headers.join(",")}\n${(data ?? []).map((row) => headers.map((header) => csvValue((row as Record<string, unknown>)[header])).join(",")).join("\n")}\n`;
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(new Date());
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=\"yara-newsletter-subscribers-${date}.csv\"`, "Cache-Control": "no-store" } });
  } catch (error) {
    logSupabaseError("admin-newsletter", "export-subscribers", error, { route: "/api/admin/newsletter/export", table: "newsletter_subscribers" });
    return NextResponse.json({ error: "Unable to export newsletter subscribers." }, { status: 500 });
  }
}
