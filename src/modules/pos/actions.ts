"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
import type { PosActionState } from "./action-state";

const saleSchema = z.object({
  payment_method: z.enum(["cash", "card", "bank_transfer"]),
  currency: z.enum(["LKR", "AED"]),
  discount: z.coerce.number().min(0).max(999999999),
  items: z.string().transform((value, context) => { try { return JSON.parse(value) as unknown; } catch { context.addIssue({ code: "custom", message: "Invalid cart." }); return z.NEVER; } }).pipe(z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive().max(1000) })).min(1).max(200)),
});

type PosDatabaseError = { code?: string; message?: string; details?: string; hint?: string };

function posSaleErrorMessage(error: PosDatabaseError) {
  const message = error.message ?? "";
  const safeMessages = new Set([
    "Product is unavailable.",
    "Discount cannot exceed subtotal.",
    "Invalid payment method.",
    "Invalid currency.",
    "Invalid quantity.",
    "Sale must contain items.",
  ]);
  if (safeMessages.has(message) || message.startsWith("Insufficient stock for ")) return message;
  return messageFromSupabaseError(error, "Unable to complete the sale.");
}

export async function completePosSaleAction(_state: PosActionState, formData: FormData): Promise<PosActionState> {
  const staff = await requireStaff("/pos");
  const parsed = saleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the sale details." };
  const supabase = getSupabaseAdminClient();
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: PosDatabaseError | null }>;
  const { data, error } = await rpc("complete_admin_pos_sale", {
    p_payment_method: parsed.data.payment_method,
    p_discount: parsed.data.discount,
    p_items: parsed.data.items,
    p_currency: parsed.data.currency,
    p_actor_id: staff.userId,
  });
  if (error) {
    logSupabaseError("pos-sale", "complete-sale", error, {
      route: "/pos",
      table: "pos_sales",
      userId: staff.userId,
    });
    return { status: "error", message: posSaleErrorMessage(error) };
  }
  const result = (Array.isArray(data) ? data[0] : data) as {
    sale_id: string;
    sale_number: string;
    total_amount: number;
    created_at: string;
  } | null;
  if (!result) return { status: "error", message: "The sale did not return a receipt." };
  revalidatePath("/pos"); revalidatePath("/admin"); revalidatePath("/admin/inventory"); revalidatePath("/admin/reports");
  return { status: "success", message: "Sale completed successfully.", sale: { id: String(result.sale_id), number: String(result.sale_number), total: Number(result.total_amount), cashier: staff.profile.full_name || staff.email, createdAt: String(result.created_at), currency: parsed.data.currency, paymentMethod: parsed.data.payment_method } };
}
