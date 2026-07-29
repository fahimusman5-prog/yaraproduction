import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email";
import { logSupabaseError } from "@/lib/supabase/log";

export async function POST(request: Request) {
  const parsed = z.object({ reason: z.string().trim().max(1000).default("") }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Check the deletion request." }, { status: 400 });
  try {
    const session = await getSupabaseServerClient();
    const { data } = session ? await session.auth.getClaims() : { data: null };
    const userId = data?.claims?.sub;
    const email = data?.claims?.email;
    const issuedAt = Number(data?.claims?.iat ?? 0) * 1000;
    if (!userId || typeof email !== "string") return NextResponse.json({ error: "Sign in again to continue." }, { status: 401 });
    if (!issuedAt || Date.now() - issuedAt > 10 * 60 * 1000) return NextResponse.json({ error: "Re-authentication is required before requesting deletion." }, { status: 401 });
    const created = await getSupabaseAdminClient().from("account_deletion_requests").insert({ user_id: userId, requested_email: email.toLowerCase(), reason: parsed.data.reason, status: "pending" });
    if (created.error?.code === "23505") return NextResponse.json({ error: "An active deletion request already exists." }, { status: 409 });
    if (created.error) throw created.error;
    await sendTransactionalEmail({ template: "account_deletion_requested", recipient: email, subject: "YARA account deletion requested", intro: "Your account deletion request was recorded with a seven-day cancellation window.", nextSteps: "Orders and accounting records required by law will be retained in anonymised form. Saved addresses and profile data will be removed during processing." });
    return NextResponse.json({ message: "Deletion requested. You can cancel it from your account during the cancellation window." }, { status: 201 });
  } catch (error) {
    logSupabaseError("account-deletion", "request", error, { route: "/api/account/deletion", table: "account_deletion_requests" });
    return NextResponse.json({ error: "Deletion request could not be created." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSupabaseServerClient();
    const { data } = session ? await session.auth.getClaims() : { data: null };
    const userId = data?.claims?.sub;
    if (!userId) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    const { data: request, error } = await getSupabaseAdminClient().from("account_deletion_requests").update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("user_id", userId).eq("status", "pending").gte("cancellable_until", new Date().toISOString()).select("id").maybeSingle();
    if (error) throw error;
    if (!request) return NextResponse.json({ error: "No cancellable deletion request was found." }, { status: 404 });
    return NextResponse.json({ message: "Account deletion request cancelled." });
  } catch (error) {
    logSupabaseError("account-deletion", "cancel", error, { route: "/api/account/deletion", table: "account_deletion_requests" });
    return NextResponse.json({ error: "Deletion request could not be cancelled." }, { status: 500 });
  }
}
