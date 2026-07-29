"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
import type { ActionState } from "./action-state";
import { formObject } from "./input";
import {
  sendOrderTransactionalEmail,
  sendTransactionalEmail,
} from "@/lib/email";

const optionalNumber = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.number().min(0).max(999_999_999).nullable(),
);

const zoneSchema = z.object({
  name: z.string().trim().min(2).max(120),
  country_code: z.enum(["LK", "AE"]),
  region_name: z.string().trim().min(2).max(120),
  zone_kind: z.enum([
    "district",
    "emirate",
    "city",
    "zone",
    "regional_fallback",
  ]),
  match_values: z.string().trim().max(1000).default(""),
  minimum_order_amount: z.coerce.number().min(0).max(999_999_999),
  cod_available: z.enum(["true"]).optional(),
  is_regional_fallback: z.enum(["true"]).optional(),
  active: z.enum(["true"]).optional(),
});

const methodSchema = z
  .object({
    shipping_zone_id: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).default(""),
    fee: optionalNumber,
    currency: z.enum(["LKR", "AED"]),
    free_shipping_threshold: optionalNumber,
    minimum_order_amount: z.coerce.number().min(0).max(999_999_999),
    estimated_min_days: z.coerce.number().int().min(0).max(365),
    estimated_max_days: z.coerce.number().int().min(0).max(365),
    cod_available: z.enum(["true"]).optional(),
    active: z.enum(["true"]).optional(),
  })
  .refine((value) => value.estimated_max_days >= value.estimated_min_days, {
    message: "Maximum delivery days must be at least the minimum.",
  });

const deliverySettingSchema = z
  .object({
    region_code: z.enum(["LK", "AE"]),
    currency: z.enum(["LKR", "AED"]),
    delivery_fee: z.coerce.number().min(0).max(999_999_999),
    is_enabled: z.enum(["true"]).optional(),
  })
  .superRefine((value, context) => {
    const expectedCurrency = value.region_code === "LK" ? "LKR" : "AED";
    if (value.currency !== expectedCurrency)
      context.addIssue({
        code: "custom",
        path: ["currency"],
        message: "Currency must match the selected region.",
      });
  });

const paymentSettingSchema = z
  .object({
    region_code: z.enum(["LK", "AE"]),
    payment_method: z.enum([
      "card",
      "koko",
      "mintpay",
      "bank_transfer",
      "cash_on_delivery",
    ]),
    processing_fee_percent: z.coerce.number().min(0).max(100),
    minimum_order_amount: optionalNumber,
    maximum_order_amount: optionalNumber,
    is_enabled: z.enum(["true"]).optional(),
    account_holder_name: z.string().trim().max(200).default(""),
    bank_name: z.string().trim().max(200).default(""),
    branch_name: z.string().trim().max(200).default(""),
    account_number: z.string().trim().max(200).default(""),
    swift_code: z.string().trim().max(100).default(""),
    instructions: z.string().trim().max(2000).default(""),
  })
  .refine(
    (value) =>
      value.maximum_order_amount === null ||
      value.minimum_order_amount === null ||
      value.maximum_order_amount >= value.minimum_order_amount,
    { message: "Maximum order must be at least the minimum." },
  )
  .superRefine((value, context) => {
    if (
      value.payment_method === "bank_transfer" &&
      value.is_enabled === "true" &&
      (!value.account_holder_name ||
        !value.bank_name ||
        !value.account_number)
    )
      context.addIssue({
        code: "custom",
        message:
          "Account holder, bank name, and account number are required before enabling bank transfer.",
      });
  });

function shippingZoneFields(data: z.infer<typeof zoneSchema>) {
  return {
    name: data.name,
    country_code: data.country_code,
    region_name: data.region_name,
    zone_kind: data.zone_kind,
    match_values: [
      ...new Set(
        data.match_values
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      ),
    ].slice(0, 100),
    minimum_order_amount: data.minimum_order_amount,
    cod_available: data.cod_available === "true",
    is_regional_fallback: data.is_regional_fallback === "true",
    active: data.active === "true",
    updated_at: new Date().toISOString(),
  };
}

function shippingMethodFields(data: z.infer<typeof methodSchema>) {
  return {
    ...data,
    fee: data.fee,
    free_shipping_threshold: data.free_shipping_threshold,
    cod_available: data.cod_available === "true",
    active: data.active === "true",
    updated_at: new Date().toISOString(),
  };
}

async function recordShippingAudit(input: {
  entityType: "zone" | "method" | "product_rate" | "delivery_setting";
  entityId: string;
  action: "created" | "updated" | "activated" | "deactivated" | "archived";
  before?: unknown;
  after?: unknown;
  actorId: string;
}) {
  const { error } = await getSupabaseAdminClient()
    .from("shipping_audit_history")
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      before_state: input.before ?? null,
      after_state: input.after ?? null,
      actor_id: input.actorId,
    });
  if (error)
    logSupabaseError("admin-commerce", "shipping-audit", error, {
      route: "/admin/commerce",
      table: "shipping_audit_history",
      userId: input.actorId,
    });
}

export async function updateDeliverySettingAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin("/admin/commerce");
  const parsed = deliverySettingSchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the delivery setting.",
    };
  const supabase = getSupabaseAdminClient();
  const before = await supabase
    .from("delivery_settings")
    .select("*")
    .eq("region_code", parsed.data.region_code)
    .maybeSingle();
  if (before.error)
    return {
      status: "error",
      message: "Unable to load the current delivery setting.",
    };
  const enabled = parsed.data.is_enabled === "true";
  const saved = await supabase
    .from("delivery_settings")
    .upsert(
      {
        region_code: parsed.data.region_code,
        currency: parsed.data.currency,
        delivery_fee: parsed.data.delivery_fee,
        is_configured: true,
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "region_code" },
    )
    .select("*")
    .single();
  if (saved.error) {
    logSupabaseError(
      "admin-commerce",
      "update-delivery-setting",
      saved.error,
      {
        route: "/admin/commerce",
        table: "delivery_settings",
        userId: admin.userId,
      },
    );
    return {
      status: "error",
      message: messageFromSupabaseError(
        saved.error,
        "Unable to update the delivery setting.",
      ),
    };
  }
  const beforeRow = before.data as { is_enabled?: boolean } | null;
  const savedRow = saved.data as { id: string; is_enabled?: boolean };
  await recordShippingAudit({
    entityType: "delivery_setting",
    entityId: savedRow.id,
    action:
      Boolean(beforeRow?.is_enabled) === Boolean(savedRow.is_enabled)
        ? before.data
          ? "updated"
          : "created"
        : savedRow.is_enabled
          ? "activated"
          : "deactivated",
    before: before.data,
    after: saved.data,
    actorId: admin.userId,
  });
  revalidatePath("/admin/commerce");
  revalidatePath("/checkout");
  return {
    status: "success",
    message: `${parsed.data.region_code === "LK" ? "Sri Lanka" : "UAE"} delivery setting saved.`,
  };
}

export async function updatePaymentMethodSettingAction(
  settingId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin("/admin/commerce");
  if (!z.string().uuid().safeParse(settingId).success)
    return { status: "error", message: "Payment setting not found." };
  const parsed = paymentSettingSchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the payment setting.",
    };
  const value = parsed.data;
  const expectedCurrency = value.region_code === "LK" ? "LKR" : "AED";
  const fields = {
    processing_fee_percent: value.processing_fee_percent,
    minimum_order_amount: value.minimum_order_amount,
    maximum_order_amount: value.maximum_order_amount,
    is_enabled: value.is_enabled === "true",
    account_holder_name: value.account_holder_name || null,
    bank_name: value.bank_name || null,
    branch_name: value.branch_name || null,
    account_number: value.account_number || null,
    swift_code: value.swift_code || null,
    instructions: value.instructions || null,
    currency: expectedCurrency,
    updated_at: new Date().toISOString(),
  };
  const saved = await getSupabaseAdminClient()
    .from("payment_method_settings")
    .update(fields)
    .eq("id", settingId)
    .eq("region_code", value.region_code)
    .eq("payment_method", value.payment_method)
    .select("id")
    .maybeSingle();
  if (saved.error || !saved.data) {
    logSupabaseError("admin-commerce", "update-payment-setting", saved.error, {
      route: "/admin/commerce",
      table: "payment_method_settings",
      userId: admin.userId,
    });
    return { status: "error", message: "Unable to save payment method." };
  }
  revalidatePath("/admin/commerce");
  revalidatePath("/checkout");
  return { status: "success", message: "Payment method saved." };
}

export async function createShippingZoneAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin("/admin/commerce");
  const parsed = zoneSchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the shipping zone.",
    };
  const created = await getSupabaseAdminClient()
    .from("shipping_zones")
    .insert(shippingZoneFields(parsed.data))
    .select("*")
    .single();
  if (created.error) {
    logSupabaseError("admin-commerce", "create-shipping-zone", created.error, {
      route: "/admin/commerce",
      table: "shipping_zones",
      userId: staff.userId,
    });
    return {
      status: "error",
      message: messageFromSupabaseError(
        created.error,
        "Unable to create shipping zone.",
        { duplicate: "That shipping zone already exists." },
      ),
    };
  }
  await recordShippingAudit({
    entityType: "zone",
    entityId: (created.data as { id: string }).id,
    action: "created",
    after: created.data,
    actorId: staff.userId,
  });
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Shipping zone created." };
}

export async function createShippingMethodAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin("/admin/commerce");
  const parsed = methodSchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the shipping method.",
    };
  const zone = await getSupabaseAdminClient()
    .from("shipping_zones")
    .select("country_code")
    .eq("id", parsed.data.shipping_zone_id)
    .maybeSingle();
  if (zone.error || !zone.data)
    return { status: "error", message: "Shipping zone not found." };
  if (
    (zone.data.country_code === "LK" ? "LKR" : "AED") !== parsed.data.currency
  )
    return {
      status: "error",
      message: "Shipping method currency must match its zone.",
    };
  if (parsed.data.active === "true" && parsed.data.fee === null)
    return {
      status: "error",
      message: "Enter a real fallback fee before activating this method.",
    };
  const created = await getSupabaseAdminClient()
    .from("shipping_methods")
    .insert(shippingMethodFields(parsed.data))
    .select("*")
    .single();
  if (created.error) {
    logSupabaseError("admin-commerce", "create-shipping-method", created.error, {
      route: "/admin/commerce",
      table: "shipping_methods",
      userId: staff.userId,
    });
    return {
      status: "error",
      message: messageFromSupabaseError(
        created.error,
        "Unable to create shipping method.",
      ),
    };
  }
  await recordShippingAudit({
    entityType: "method",
    entityId: (created.data as { id: string }).id,
    action: "created",
    after: created.data,
    actorId: staff.userId,
  });
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Shipping method created." };
}

export async function updateShippingZoneAction(
  zoneId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin("/admin/commerce");
  if (!z.string().uuid().safeParse(zoneId).success)
    return { status: "error", message: "Shipping zone not found." };
  const parsed = zoneSchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the shipping zone.",
    };
  const supabase = getSupabaseAdminClient();
  const before = await supabase
    .from("shipping_zones")
    .select("*")
    .eq("id", zoneId)
    .is("archived_at", null)
    .maybeSingle();
  if (before.error || !before.data)
    return { status: "error", message: "Shipping zone not found." };
  const updated = await supabase
    .from("shipping_zones")
    .update(shippingZoneFields(parsed.data))
    .eq("id", zoneId)
    .select("*")
    .single();
  if (updated.error)
    return { status: "error", message: "Unable to update shipping zone." };
  const beforeRow = before.data as { active?: boolean };
  const updatedRow = updated.data as { active?: boolean };
  await recordShippingAudit({
    entityType: "zone",
    entityId: zoneId,
    action:
      Boolean(beforeRow.active) === Boolean(updatedRow.active)
        ? "updated"
        : updatedRow.active
          ? "activated"
          : "deactivated",
    before: before.data,
    after: updated.data,
    actorId: staff.userId,
  });
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Shipping zone updated." };
}

export async function archiveShippingZoneAction(zoneId: string) {
  const staff = await requireAdmin("/admin/commerce");
  if (!z.string().uuid().safeParse(zoneId).success)
    throw new Error("Shipping zone not found.");
  const supabase = getSupabaseAdminClient();
  const before = await supabase
    .from("shipping_zones")
    .select("*")
    .eq("id", zoneId)
    .maybeSingle();
  if (before.error || !before.data) throw new Error("Shipping zone not found.");
  const timestamp = new Date().toISOString();
  const updated = await supabase
    .from("shipping_zones")
    .update({ active: false, archived_at: timestamp, updated_at: timestamp })
    .eq("id", zoneId)
    .select("*")
    .single();
  if (updated.error) throw new Error("Unable to archive shipping zone.");
  await recordShippingAudit({
    entityType: "zone",
    entityId: zoneId,
    action: "archived",
    before: before.data,
    after: updated.data,
    actorId: staff.userId,
  });
  revalidatePath("/admin/commerce");
}

export async function updateShippingMethodAction(
  methodId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin("/admin/commerce");
  if (!z.string().uuid().safeParse(methodId).success)
    return { status: "error", message: "Shipping method not found." };
  const parsed = methodSchema.safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the shipping method.",
    };
  if (parsed.data.active === "true" && parsed.data.fee === null)
    return {
      status: "error",
      message: "Enter a real fallback fee before activating this method.",
    };
  const supabase = getSupabaseAdminClient();
  const before = await supabase
    .from("shipping_methods")
    .select("*")
    .eq("id", methodId)
    .is("archived_at", null)
    .maybeSingle();
  if (before.error || !before.data)
    return { status: "error", message: "Shipping method not found." };
  const zone = await supabase
    .from("shipping_zones")
    .select("country_code")
    .eq("id", parsed.data.shipping_zone_id)
    .maybeSingle();
  if (
    !zone.data ||
    (zone.data.country_code === "LK" ? "LKR" : "AED") !== parsed.data.currency
  )
    return {
      status: "error",
      message: "Shipping method currency must match its zone.",
    };
  const updated = await supabase
    .from("shipping_methods")
    .update(shippingMethodFields(parsed.data))
    .eq("id", methodId)
    .select("*")
    .single();
  if (updated.error)
    return { status: "error", message: "Unable to update shipping method." };
  const beforeRow = before.data as { active?: boolean };
  const updatedRow = updated.data as { active?: boolean };
  await recordShippingAudit({
    entityType: "method",
    entityId: methodId,
    action:
      Boolean(beforeRow.active) === Boolean(updatedRow.active)
        ? "updated"
        : updatedRow.active
          ? "activated"
          : "deactivated",
    before: before.data,
    after: updated.data,
    actorId: staff.userId,
  });
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Shipping method updated." };
}

export async function archiveShippingMethodAction(methodId: string) {
  const staff = await requireAdmin("/admin/commerce");
  if (!z.string().uuid().safeParse(methodId).success)
    throw new Error("Shipping method not found.");
  const supabase = getSupabaseAdminClient();
  const before = await supabase
    .from("shipping_methods")
    .select("*")
    .eq("id", methodId)
    .maybeSingle();
  if (before.error || !before.data)
    throw new Error("Shipping method not found.");
  const timestamp = new Date().toISOString();
  const updated = await supabase
    .from("shipping_methods")
    .update({ active: false, archived_at: timestamp, updated_at: timestamp })
    .eq("id", methodId)
    .select("*")
    .single();
  if (updated.error) throw new Error("Unable to archive shipping method.");
  await recordShippingAudit({
    entityType: "method",
    entityId: methodId,
    action: "archived",
    before: before.data,
    after: updated.data,
    actorId: staff.userId,
  });
  revalidatePath("/admin/commerce");
}

export async function saveShippingProductRateAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin("/admin/commerce");
  const parsed = z
    .object({
      shipping_method_id: z.string().uuid(),
      product_id: z.string().uuid(),
      fee: optionalNumber,
      calculation_type: z.enum(["per_line", "per_unit"]),
      free_shipping: z.enum(["true"]).optional(),
      active: z.enum(["true"]).optional(),
    })
    .safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the product delivery rate.",
    };
  if (parsed.data.free_shipping !== "true" && parsed.data.fee === null)
    return {
      status: "error",
      message: "Enter a fee or mark this product as free delivery.",
    };
  const supabase = getSupabaseAdminClient();
  const before = await supabase
    .from("shipping_product_rates")
    .select("*")
    .eq("shipping_method_id", parsed.data.shipping_method_id)
    .eq("product_id", parsed.data.product_id)
    .maybeSingle();
  const saved = await supabase
    .from("shipping_product_rates")
    .upsert(
      {
        shipping_method_id: parsed.data.shipping_method_id,
        product_id: parsed.data.product_id,
        fee: parsed.data.free_shipping === "true" ? null : parsed.data.fee,
        calculation_type: parsed.data.calculation_type,
        free_shipping: parsed.data.free_shipping === "true",
        active: parsed.data.active === "true",
        archived_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "shipping_method_id,product_id" },
    )
    .select("*")
    .single();
  if (saved.error)
    return { status: "error", message: "Unable to save product delivery rate." };
  await recordShippingAudit({
    entityType: "product_rate",
    entityId: (saved.data as { id: string }).id,
    action: before.data ? "updated" : "created",
    before: before.data,
    after: saved.data,
    actorId: staff.userId,
  });
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Product delivery rate saved." };
}

export async function archiveShippingProductRateAction(rateId: string) {
  const staff = await requireAdmin("/admin/commerce");
  if (!z.string().uuid().safeParse(rateId).success)
    throw new Error("Product delivery rate not found.");
  const supabase = getSupabaseAdminClient();
  const before = await supabase
    .from("shipping_product_rates")
    .select("*")
    .eq("id", rateId)
    .maybeSingle();
  if (before.error || !before.data)
    throw new Error("Product delivery rate not found.");
  const timestamp = new Date().toISOString();
  const saved = await supabase
    .from("shipping_product_rates")
    .update({ active: false, archived_at: timestamp, updated_at: timestamp })
    .eq("id", rateId)
    .select("*")
    .single();
  if (saved.error) throw new Error("Unable to archive product delivery rate.");
  await recordShippingAudit({
    entityType: "product_rate",
    entityId: rateId,
    action: "archived",
    before: before.data,
    after: saved.data,
    actorId: staff.userId,
  });
  revalidatePath("/admin/commerce");
}

export async function createCouponAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin("/admin/commerce");
  const parsed = z
    .object({
      code: z
        .string()
        .trim()
        .min(2)
        .max(40)
        .regex(/^[A-Za-z0-9_-]+$/),
      discount_type: z.enum(["fixed", "percentage"]),
      discount_value: z.coerce.number().positive().max(999999999),
      country_scope: z.enum(["sri-lanka", "uae", "both"]),
      minimum_order_amount: z.coerce.number().min(0),
      maximum_discount: optionalNumber,
      usage_limit: z.preprocess(
        (value) => (value === "" ? null : value),
        z.coerce.number().int().positive().nullable(),
      ),
      per_customer_limit: z.coerce.number().int().positive().max(100),
      starts_at: z.string().optional(),
      ends_at: z.string().optional(),
      active: z.enum(["true"]).optional(),
    })
    .superRefine((value, context) => {
      if (value.discount_type === "percentage" && value.discount_value > 100)
        context.addIssue({
          code: "custom",
          path: ["discount_value"],
          message: "Percentage discounts cannot exceed 100%.",
        });
      if (
        value.starts_at &&
        value.ends_at &&
        new Date(value.ends_at) <= new Date(value.starts_at)
      )
        context.addIssue({
          code: "custom",
          path: ["ends_at"],
          message: "Coupon expiry must be after its start.",
        });
    })
    .safeParse(formObject(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the coupon.",
    };
  const { starts_at, ends_at, ...fields } = parsed.data;
  const { error } = await getSupabaseAdminClient()
    .from("coupons")
    .insert({
      ...fields,
      code: fields.code.toUpperCase(),
      created_by: staff.userId,
      active: fields.active === "true",
      starts_at: starts_at ? new Date(starts_at).toISOString() : null,
      ends_at: ends_at ? new Date(ends_at).toISOString() : null,
    });
  if (error) {
    logSupabaseError("admin-commerce", "create-coupon", error, {
      route: "/admin/commerce",
      table: "coupons",
      userId: staff.userId,
    });
    return {
      status: "error",
      message: messageFromSupabaseError(error, "Unable to create coupon.", {
        duplicate: "That coupon code already exists.",
      }),
    };
  }
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Coupon created." };
}

export async function setCouponActiveAction(couponId: string, active: boolean) {
  const staff = await requireAdmin("/admin/commerce");
  if (!z.string().uuid().safeParse(couponId).success)
    throw new Error("Coupon not found.");
  const { error } = await getSupabaseAdminClient()
    .from("coupons")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", couponId);
  if (error) {
    logSupabaseError("admin-commerce", "set-coupon-active", error, {
      route: "/admin/commerce",
      table: "coupons",
      userId: staff.userId,
    });
    throw new Error("Unable to update coupon.");
  }
  revalidatePath("/admin/commerce");
}

export async function updateReturnAction(
  returnId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff("/admin/commerce");
  const parsed = z
    .object({
      status: z.enum([
        "requested",
        "more_information",
        "approved",
        "rejected",
        "received",
        "inspected",
        "restocked",
        "resolved",
        "cancelled",
      ]),
      admin_note: z.string().trim().max(2000).default(""),
    })
    .safeParse(formObject(formData));
  if (!parsed.success || !z.string().uuid().safeParse(returnId).success)
    return { status: "error", message: "Check the return update." };
  const supabase = getSupabaseAdminClient();
  const current = await supabase
    .from("return_requests")
    .select("status,order_id,orders(order_number,customer_email)")
    .eq("id", returnId)
    .maybeSingle();
  if (current.error || !current.data)
    return { status: "error", message: "Return request not found." };
  const currentRow = current.data as unknown as {
    status: string;
    order_id: string;
    orders:
      | { order_number: string; customer_email: string }
      | Array<{ order_number: string; customer_email: string }>
      | null;
  };
  const timestamps =
    parsed.data.status === "approved"
      ? { approved_at: new Date().toISOString() }
      : parsed.data.status === "received"
        ? { received_at: new Date().toISOString() }
        : parsed.data.status === "inspected"
          ? { inspected_at: new Date().toISOString() }
          : parsed.data.status === "resolved"
            ? { resolved_at: new Date().toISOString() }
            : {};
  if (parsed.data.status === "received" && currentRow.status !== "received") {
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message?: string } | null }>;
    const received = await rpc("mark_return_items_received", {
      p_return_request_id: returnId,
      p_actor_id: staff.userId,
    });
    if (received.error)
      return {
        status: "error",
        message:
          received.error.message ?? "Unable to record received quantities.",
      };
  }
  const update = await supabase
    .from("return_requests")
    .update({
      ...parsed.data,
      ...timestamps,
      updated_at: new Date().toISOString(),
    })
    .eq("id", returnId);
  if (update.error)
    return { status: "error", message: "Unable to update return." };
  const history = await supabase
    .from("return_status_history")
    .insert({
      return_request_id: returnId,
      from_status: currentRow.status,
      to_status: parsed.data.status,
      note: parsed.data.admin_note,
      actor_id: staff.userId,
    });
  if (history.error)
    return {
      status: "error",
      message: "Return updated, but its audit history could not be recorded.",
    };
  const orderRelation = currentRow.orders;
  const returnOrder = Array.isArray(orderRelation)
    ? orderRelation[0]
    : orderRelation;
  if (
    returnOrder &&
    ["approved", "rejected"].includes(parsed.data.status)
  ) {
    await sendOrderTransactionalEmail({
      template:
        parsed.data.status === "approved"
          ? "return_approved"
          : "return_rejected",
      recipient: returnOrder.customer_email,
      orderId: currentRow.order_id,
      dedupeKey: `return_${parsed.data.status}:${returnId}`,
      subject: `Return ${parsed.data.status} for order ${returnOrder.order_number}`,
      intro:
        parsed.data.status === "approved"
          ? "Your return request has been approved."
          : "After reviewing the request, it was not approved.",
      nextSteps:
        parsed.data.admin_note ||
        (parsed.data.status === "approved"
          ? "Follow the return instructions provided by YARA before sending any item."
          : "Reply to this email if you need clarification about the decision."),
    });
  }
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Return updated." };
}

export async function reviewReturnItemsAction(
  returnId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff("/admin/commerce");
  if (!z.string().uuid().safeParse(returnId).success)
    return { status: "error", message: "Return request not found." };
  const itemIds = formData
    .getAll("return_item_id")
    .map(String)
    .filter((id) => z.string().uuid().safeParse(id).success);
  if (!itemIds.length)
    return { status: "error", message: "No return items were selected." };
  const items = itemIds.map((id) => ({
    returnItemId: id,
    approvedQuantity: Number(formData.get(`approved_${id}`) ?? 0),
    rejectedQuantity: Number(formData.get(`rejected_${id}`) ?? 0),
    inspectionOutcome: String(formData.get(`inspection_${id}`) ?? "").trim(),
  }));
  if (
    items.some(
      (item) =>
        !Number.isInteger(item.approvedQuantity) ||
        !Number.isInteger(item.rejectedQuantity) ||
        item.approvedQuantity < 0 ||
        item.rejectedQuantity < 0 ||
        item.inspectionOutcome.length > 1000,
    )
  )
    return { status: "error", message: "Check every item decision." };
  const supabase = getSupabaseAdminClient();
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  const reviewed = await rpc("review_return_request_items", {
    p_return_request_id: returnId,
    p_actor_id: staff.userId,
    p_admin_note: String(formData.get("admin_note") ?? "").trim(),
    p_items: items,
  });
  if (reviewed.error)
    return {
      status: "error",
      message: reviewed.error.message ?? "Unable to review return items.",
    };
  const request = await supabase
    .from("return_requests")
    .select("order_id,orders(order_number,customer_email)")
    .eq("id", returnId)
    .single();
  const relation = (
    request.data as unknown as {
      order_id: string;
      orders:
        | { order_number: string; customer_email: string }
        | Array<{ order_number: string; customer_email: string }>;
    } | null
  );
  const order = Array.isArray(relation?.orders)
    ? relation?.orders[0]
    : relation?.orders;
  const status = String(reviewed.data);
  if (relation && order) {
    await sendOrderTransactionalEmail({
      template: status === "rejected" ? "return_rejected" : "return_approved",
      recipient: order.customer_email,
      orderId: relation.order_id,
      dedupeKey: `return_item_review:${returnId}:${status}`,
      subject: `Return ${status} for order ${order.order_number}`,
      intro:
        status === "rejected"
          ? "After reviewing each requested item, the return was not approved."
          : "YARA reviewed each requested item. Approved and rejected quantities are recorded in your return.",
      nextSteps:
        String(formData.get("admin_note") ?? "").trim() ||
        "Reply to this email if you need clarification about the item-level decision.",
    });
  }
  revalidatePath("/admin/commerce");
  return { status: "success", message: "Item decisions recorded." };
}

export async function createItemRefundAction(
  orderId: string,
  returnId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin("/admin/commerce");
  if (
    !z.string().uuid().safeParse(orderId).success ||
    !z.string().uuid().safeParse(returnId).success
  )
    return { status: "error", message: "Return request not found." };
  const orderItemIds = formData
    .getAll("refund_order_item_id")
    .map(String)
    .filter((id) => z.string().uuid().safeParse(id).success);
  const items = orderItemIds
    .map((id) => ({
      orderItemId: id,
      quantity: Number(formData.get(`refund_quantity_${id}`) ?? 0),
      includeShipping: formData.get(`refund_shipping_${id}`) === "true",
    }))
    .filter((item) => item.quantity > 0);
  if (
    !items.length ||
    items.some(
      (item) => !Number.isInteger(item.quantity) || item.quantity <= 0,
    )
  )
    return { status: "error", message: "Select refundable item quantities." };
  const supabase = getSupabaseAdminClient();
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  const recorded = await rpc("record_item_refund", {
    p_order_id: orderId,
    p_return_request_id: returnId,
    p_actor_id: staff.userId,
    p_reason: String(formData.get("reason") ?? "").trim(),
    p_internal_note: String(formData.get("internal_note") ?? "").trim(),
    p_items: items,
  });
  if (recorded.error)
    return {
      status: "error",
      message: recorded.error.message ?? "Unable to record item refund.",
    };
  const refundId = String(recorded.data);
  const refund = await supabase
    .from("refunds")
    .select("amount,currency,orders(order_number,customer_email)")
    .eq("id", refundId)
    .single();
  const row = refund.data as unknown as {
    amount: number;
    currency: string;
    orders:
      | { order_number: string; customer_email: string }
      | Array<{ order_number: string; customer_email: string }>;
  } | null;
  const order = Array.isArray(row?.orders) ? row?.orders[0] : row?.orders;
  if (row && order)
    await sendOrderTransactionalEmail({
      template: "refund_recorded",
      recipient: order.customer_email,
      orderId,
      dedupeKey: `refund_recorded:${refundId}`,
      subject: `Refund recorded for order ${order.order_number}`,
      intro: `YARA recorded an item-level ${row.currency} ${Number(row.amount).toFixed(2)} refund request. No payment-provider refund has been issued.`,
      nextSteps:
        "A completion email will be sent only after a verified payment-provider refund event is available.",
    });
  revalidatePath("/admin/commerce");
  return {
    status: "success",
    message: "Item-level refund recorded. No provider refund was issued.",
  };
}

export async function createRefundAction(
  orderId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireAdmin(`/admin/orders/${orderId}`);
  const parsed = z
    .object({
      amount: z.coerce.number().positive(),
      refund_type: z.enum(["full", "partial"]),
      reason: z.string().trim().min(3).max(1000),
      internal_note: z.string().trim().max(2000).default(""),
      return_request_id: z.string().uuid().or(z.literal("")).optional(),
    })
    .safeParse(formObject(formData));
  if (!parsed.success || !z.string().uuid().safeParse(orderId).success)
    return {
      status: "error",
      message: parsed.success
        ? "Order not found."
        : (parsed.error.issues[0]?.message ?? "Check the refund."),
    };
  const supabase = getSupabaseAdminClient();
  const orderResult = await supabase
    .from("orders")
    .select("order_number,customer_email,total_amount,currency,payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (orderResult.error || !orderResult.data)
    return { status: "error", message: "Order not found." };
  const orderRow = orderResult.data as unknown as {
    order_number: string;
    customer_email: string;
    total_amount: number;
    currency: string;
    payment_status: string;
  };
  if (orderRow.payment_status !== "paid")
    return {
      status: "error",
      message: "Refunds can only be recorded against a paid order.",
    };
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  const refund = await rpc("record_general_refund", {
    p_order_id: orderId,
    p_return_request_id: parsed.data.return_request_id || null,
    p_amount: parsed.data.amount,
    p_refund_type: parsed.data.refund_type,
    p_reason: parsed.data.reason,
    p_internal_note: parsed.data.internal_note,
    p_actor_id: staff.userId,
  });
  if (refund.error || typeof refund.data !== "string")
    return {
      status: "error",
      message:
        refund.error?.message === "Refunds cannot exceed the paid order total."
          ? refund.error.message
          : "Unable to record refund.",
    };
  await sendOrderTransactionalEmail({
    template: "refund_recorded",
    recipient: orderRow.customer_email,
    orderId,
    dedupeKey: `refund_recorded:${refund.data}`,
    subject: `Refund recorded for order ${orderRow.order_number}`,
    intro: `YARA recorded a ${orderRow.currency} ${parsed.data.amount.toFixed(2)} refund request against your order. This record does not claim that a payment provider has completed the transfer.`,
    nextSteps:
      "We will send a separate refund-completed email only after a verified payment-provider event is available.",
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/commerce");
  return {
    status: "success",
    message: "Refund record created. No provider refund has been issued.",
  };
}

export async function completeAccountDeletionAction(requestId: string) {
  const staff = await requireAdmin("/admin/commerce");
  if (!z.string().uuid().safeParse(requestId).success)
    throw new Error("Deletion request not found.");
  const supabase = getSupabaseAdminClient();
  const request = await supabase
    .from("account_deletion_requests")
    .select("id,user_id,requested_email,status")
    .eq("id", requestId)
    .maybeSingle();
  const row = request.data as {
    id: string;
    user_id: string | null;
    requested_email: string;
    status: string;
  } | null;
  if (
    request.error ||
    !row?.user_id ||
    !["pending", "processing", "failed"].includes(row.status)
  )
    throw new Error("Active deletion request not found.");
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  const anonymized = await rpc("anonymize_customer_for_deletion", {
    p_user_id: row.user_id,
    p_actor_id: staff.userId,
  });
  if (anonymized.error)
    throw new Error("Customer data could not be anonymised.");
  const deleted = await supabase.auth.admin.deleteUser(row.user_id);
  if (deleted.error) {
    await supabase
      .from("account_deletion_requests")
      .update({
        status: "failed",
        processing_note:
          "Authentication account deletion failed; administrator retry required.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    throw new Error(
      "Authentication account deletion failed. The request is retained for retry.",
    );
  }
  await supabase
    .from("account_deletion_requests")
    .update({
      user_id: null,
      status: "completed",
      completed_at: new Date().toISOString(),
      processing_note:
        "Profile removed and retained commerce records anonymised.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  await sendTransactionalEmail({
    template: "account_deletion_completed",
    recipient: row.requested_email,
    dedupeKey: `account_deletion_completed:${row.id}`,
    subject: "Your YARA account deletion is complete",
    intro:
      "Your profile and saved addresses have been removed and active sessions revoked.",
    nextSteps:
      "Legally required commerce records have been retained only in anonymised form.",
  });
  revalidatePath("/admin/commerce");
}
