"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
import type { ActionState } from "./action-state";
import { formObject } from "./input";

const optionalNumber = z.preprocess((value) => value === "" ? null : value, z.coerce.number().min(0).nullable());

export async function createShippingZoneAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin("/admin/commerce");
  const parsed = z.object({ name: z.string().trim().min(2).max(120), country_code: z.enum(["LK", "AE"]), region_name: z.string().trim().max(120).default(""), active: z.enum(["true"]).optional() }).safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the shipping zone." };
  const { error } = await getSupabaseAdminClient().from("shipping_zones").insert({ ...parsed.data, active: parsed.data.active === "true" });
  if (error) {
    logSupabaseError("admin-commerce", "create-shipping-zone", error, { route: "/admin/commerce", table: "shipping_zones", userId: staff.userId });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to create shipping zone.", { duplicate: "That shipping zone already exists." }) };
  }
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Shipping zone created." };
}

export async function createShippingMethodAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin("/admin/commerce");
  const parsed = z.object({
    shipping_zone_id: z.string().uuid(), name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).default(""), fee: z.coerce.number().min(0).max(999999999),
    currency: z.enum(["LKR", "AED"]), free_shipping_threshold: optionalNumber,
    estimated_min_days: z.coerce.number().int().min(0).max(365),
    estimated_max_days: z.coerce.number().int().min(0).max(365), active: z.enum(["true"]).optional(),
  }).refine((value) => value.estimated_max_days >= value.estimated_min_days, { message: "Maximum delivery days must be at least the minimum." }).safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the shipping method." };
  const zone = await getSupabaseAdminClient().from("shipping_zones").select("country_code").eq("id", parsed.data.shipping_zone_id).maybeSingle();
  if (zone.error || !zone.data) return { status: "error", message: "Shipping zone not found." };
  if ((zone.data.country_code === "LK" ? "LKR" : "AED") !== parsed.data.currency) return { status: "error", message: "Shipping method currency must match its zone." };
  const { error } = await getSupabaseAdminClient().from("shipping_methods").insert({ ...parsed.data, active: parsed.data.active === "true" });
  if (error) {
    logSupabaseError("admin-commerce", "create-shipping-method", error, { route: "/admin/commerce", table: "shipping_methods", userId: staff.userId });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to create shipping method.") };
  }
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Shipping method created." };
}

export async function createCouponAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin("/admin/commerce");
  const parsed = z.object({
    code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
    discount_type: z.enum(["fixed", "percentage"]), discount_value: z.coerce.number().positive().max(999999999),
    country_scope: z.enum(["sri-lanka", "uae", "both"]), minimum_order_amount: z.coerce.number().min(0),
    maximum_discount: optionalNumber, usage_limit: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().positive().nullable()),
    per_customer_limit: z.coerce.number().int().positive().max(100), starts_at: z.string().optional(), ends_at: z.string().optional(),
    active: z.enum(["true"]).optional(),
  }).superRefine((value, context) => {
    if (value.discount_type === "percentage" && value.discount_value > 100) context.addIssue({ code: "custom", path: ["discount_value"], message: "Percentage discounts cannot exceed 100%." });
    if (value.starts_at && value.ends_at && new Date(value.ends_at) <= new Date(value.starts_at)) context.addIssue({ code: "custom", path: ["ends_at"], message: "Coupon expiry must be after its start." });
  }).safeParse(formObject(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the coupon." };
  const { starts_at, ends_at, ...fields } = parsed.data;
  const { error } = await getSupabaseAdminClient().from("coupons").insert({ ...fields, code: fields.code.toUpperCase(), created_by: staff.userId, active: fields.active === "true", starts_at: starts_at ? new Date(starts_at).toISOString() : null, ends_at: ends_at ? new Date(ends_at).toISOString() : null });
  if (error) {
    logSupabaseError("admin-commerce", "create-coupon", error, { route: "/admin/commerce", table: "coupons", userId: staff.userId });
    return { status: "error", message: messageFromSupabaseError(error, "Unable to create coupon.", { duplicate: "That coupon code already exists." }) };
  }
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Coupon created." };
}

export async function setCouponActiveAction(couponId: string, active: boolean) {
  const staff = await requireAdmin("/admin/commerce");
  if (!z.string().uuid().safeParse(couponId).success) throw new Error("Coupon not found.");
  const { error } = await getSupabaseAdminClient().from("coupons").update({ active, updated_at: new Date().toISOString() }).eq("id", couponId);
  if (error) {
    logSupabaseError("admin-commerce", "set-coupon-active", error, { route: "/admin/commerce", table: "coupons", userId: staff.userId });
    throw new Error("Unable to update coupon.");
  }
  revalidatePath("/admin/commerce");
}

export async function updateReturnAction(returnId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff("/admin/commerce");
  const parsed = z.object({ status: z.enum(["requested","more_information","approved","rejected","received","inspected","restocked","resolved","cancelled"]), admin_note: z.string().trim().max(2000).default("") }).safeParse(formObject(formData));
  if (!parsed.success || !z.string().uuid().safeParse(returnId).success) return { status: "error", message: "Check the return update." };
  const supabase = getSupabaseAdminClient();
  const current = await supabase.from("return_requests").select("status").eq("id", returnId).maybeSingle();
  if (current.error || !current.data) return { status: "error", message: "Return request not found." };
  const timestamps = parsed.data.status === "approved" ? { approved_at: new Date().toISOString() } : parsed.data.status === "received" ? { received_at: new Date().toISOString() } : parsed.data.status === "inspected" ? { inspected_at: new Date().toISOString() } : parsed.data.status === "resolved" ? { resolved_at: new Date().toISOString() } : {};
  const update = await supabase.from("return_requests").update({ ...parsed.data, ...timestamps, updated_at: new Date().toISOString() }).eq("id", returnId);
  if (update.error) return { status: "error", message: "Unable to update return." };
  const history = await supabase.from("return_status_history").insert({ return_request_id: returnId, from_status: current.data.status, to_status: parsed.data.status, note: parsed.data.admin_note, actor_id: staff.userId });
  if (history.error) return { status: "error", message: "Return updated, but its audit history could not be recorded." };
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Return updated." };
}

export async function createRefundAction(orderId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin(`/admin/orders/${orderId}`);
  const parsed = z.object({ amount: z.coerce.number().positive(), refund_type: z.enum(["full","partial"]), reason: z.string().trim().min(3).max(1000), internal_note: z.string().trim().max(2000).default(""), return_request_id: z.string().uuid().or(z.literal("")).optional() }).safeParse(formObject(formData));
  if (!parsed.success || !z.string().uuid().safeParse(orderId).success) return { status: "error", message: parsed.success ? "Order not found." : parsed.error.issues[0]?.message ?? "Check the refund." };
  const supabase = getSupabaseAdminClient();
  const [orderResult, refundsResult] = await Promise.all([
    supabase.from("orders").select("total_amount,currency,payment_status").eq("id", orderId).maybeSingle(),
    supabase.from("refunds").select("amount,status").eq("order_id", orderId).not("status", "in", '("rejected","failed")'),
  ]);
  if (orderResult.error || !orderResult.data) return { status: "error", message: "Order not found." };
  if (orderResult.data.payment_status !== "paid") return { status: "error", message: "Refunds can only be recorded against a paid order." };
  const alreadyRefunded = (refundsResult.data ?? []).reduce((sum, refund) => sum + Number(refund.amount), 0);
  if (alreadyRefunded + parsed.data.amount > Number(orderResult.data.total_amount)) return { status: "error", message: "Refunds cannot exceed the paid order total." };
  const { error } = await supabase.from("refunds").insert({ order_id: orderId, return_request_id: parsed.data.return_request_id || null, amount: parsed.data.amount, currency: orderResult.data.currency, refund_type: parsed.data.refund_type, status: "requested", reason: parsed.data.reason, internal_note: parsed.data.internal_note, actor_id: staff.userId });
  if (error) return { status: "error", message: "Unable to record refund." };
  revalidatePath(`/admin/orders/${orderId}`); revalidatePath("/admin/commerce");
  return { status: "success", message: "Refund record created. No provider refund has been issued." };
}
