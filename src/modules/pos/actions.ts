"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PosActionState } from "./action-state";

const saleSchema = z.object({
  payment_method: z.enum(["cash", "card", "bank_transfer"]),
  currency: z.enum(["LKR", "AED"]),
  discount: z.coerce.number().min(0).max(999999999),
  items: z.string().transform((value, context) => { try { return JSON.parse(value) as unknown; } catch { context.addIssue({ code: "custom", message: "Invalid cart." }); return z.NEVER; } }).pipe(z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive().max(1000) })).min(1).max(200)),
});

export async function completePosSaleAction(_state: PosActionState, formData: FormData): Promise<PosActionState> {
  const staff = await requireStaff("/pos");
  const parsed = saleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the sale details." };
  const supabase = await getSupabaseServerClient(); if (!supabase) return { status: "error", message: "Supabase is not configured." };
  const { data, error } = await supabase.rpc("complete_pos_sale", { p_payment_method: parsed.data.payment_method, p_discount: parsed.data.discount, p_items: parsed.data.items, p_currency: parsed.data.currency });
  if (error) return { status: "error", message: error.message };
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) return { status: "error", message: "The sale did not return a receipt." };
  revalidatePath("/pos"); revalidatePath("/admin"); revalidatePath("/admin/inventory"); revalidatePath("/admin/reports");
  return { status: "success", message: "Sale completed successfully.", sale: { id: String(result.sale_id), number: String(result.sale_number), total: Number(result.total_amount), cashier: staff.profile.full_name || staff.email, createdAt: String(result.created_at), currency: parsed.data.currency, paymentMethod: parsed.data.payment_method } };
}
