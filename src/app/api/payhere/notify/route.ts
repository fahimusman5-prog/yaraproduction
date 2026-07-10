import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";
import { verifyPayHereNotification } from "@/lib/payhere";

export async function POST(request: Request) {
  const form = await request.formData();
  const values = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  if (!verifyPayHereNotification(values)) return new Response("Invalid signature", { status: 401 });

  const statusCode = Number(values.status_code);
  const amount = Number(values.payhere_amount);
  if (!Number.isInteger(statusCode) || !Number.isFinite(amount)) return new Response("Invalid payload", { status: 400 });

  const admin = getSupabaseAdminClient();
  const rpc = admin.rpc.bind(admin) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>;
  const { error } = await rpc("update_payhere_payment", {
    p_order_number: values.order_id,
    p_provider_payment_id: values.payment_id || "",
    p_status_code: statusCode,
    p_amount: amount,
    p_currency: values.payhere_currency,
  });
  if (error) {
    logSupabaseError("payhere-webhook", "update-payment", error, {
      route: "/api/payhere/notify",
      table: "orders",
      orderNumber: values.order_id,
    });
    return new Response("Unable to update order", { status: 500 });
  }
  return new Response("OK");
}
