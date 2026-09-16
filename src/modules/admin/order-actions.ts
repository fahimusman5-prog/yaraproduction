"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
import {
  sendOrderTransactionalEmail,
  type EmailTemplate,
} from "@/lib/email";
import type { ActionState } from "./action-state";
import { formObject } from "./input";

export async function updateOrderStatusAction(
  orderId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff(`/admin/orders/${orderId}`);
  const parsed = z
    .object({
      order_status: z.enum([
        "pending_payment",
        "awaiting_bank_transfer",
        "confirmed",
        "pending",
        "paid",
        "processing",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ]),
      payment_status: z.enum([
        "unpaid",
        "pending",
        "processing",
        "awaiting_bank_verification",
        "payment_due_on_delivery",
        "paid",
        "failed",
        "cancelled",
        "refunded",
      ]),
      note: z.string().trim().max(1000).default(""),
      shipping_method_name: z.string().trim().max(160).default(""),
      courier_name: z.string().trim().max(160).default(""),
      tracking_number: z.string().trim().max(200).default(""),
      tracking_url: z.string().trim().max(1000).refine((value) => !value || z.string().url().safeParse(value).success, "Enter a valid tracking URL.").default(""),
      estimated_delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).default(""),
    })
    .safeParse(formObject(formData));
  if (!parsed.success)
    return { status: "error", message: "Choose valid order and payment statuses." };

  const supabase = getSupabaseAdminClient();
  if (parsed.data.payment_status === "paid") {
    const currentOrderResult = await supabase
      .from("orders")
      .select("payment_method,payment_status")
      .eq("id", orderId)
      .maybeSingle();
    const currentOrder = currentOrderResult.data as {
      payment_method?: string;
      payment_status?: string;
    } | null;
    if (currentOrderResult.error)
      return {
        status: "error",
        message: messageFromSupabaseError(
          currentOrderResult.error,
          "Unable to verify the current payment state.",
        ),
      };
    if (
      currentOrder?.payment_status !== "paid" &&
      ["cash_on_delivery", "bank_transfer"].includes(currentOrder?.payment_method ?? "")
    )
      await requireAdmin(`/admin/orders/${orderId}`);
  }

  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
  const { data, error } = await rpc("update_admin_order_status", {
    p_order_id: orderId,
    p_order_status: parsed.data.order_status,
    p_payment_status: parsed.data.payment_status,
    p_actor_id: staff.userId,
    p_note: parsed.data.note,
  });
  if (error) {
    logSupabaseError("admin-order-status-update", "update-order-status", error, {
      route: `/admin/orders/${orderId}`,
      table: "orders",
      userId: staff.userId,
      orderId,
    });
    return {
      status: "error",
      message: messageFromSupabaseError(error, "Unable to update the order status."),
    };
  }
  if (!data) return { status: "error", message: "Order not found." };

  const fulfilment = await supabase
    .from("orders")
    .update({
      shipping_method_name: parsed.data.shipping_method_name,
      courier_name: parsed.data.courier_name,
      tracking_number: parsed.data.tracking_number,
      tracking_url: parsed.data.tracking_url,
      estimated_delivery_date: parsed.data.estimated_delivery_date || null,
    })
    .eq("id", orderId);
  if (fulfilment.error)
    return { status: "error", message: "Status changed, but fulfilment details could not be saved." };

  const emailTemplate = (
    {
      processing: "order_processing",
      packed: "order_packed",
      shipped: "order_shipped",
      delivered: "order_delivered",
      cancelled: "order_cancelled",
    } as Partial<Record<string, EmailTemplate>>
  )[parsed.data.order_status];
  if (emailTemplate) {
    const order = await supabase
      .from("orders")
      .select("order_number,customer_email")
      .eq("id", orderId)
      .maybeSingle();
    const orderRow = order.data as {
      order_number: string;
      customer_email: string;
    } | null;
    if (orderRow)
      await sendOrderTransactionalEmail({
        template: emailTemplate,
        recipient: orderRow.customer_email,
        orderId,
        subject: `Order ${orderRow.order_number}: ${parsed.data.order_status}`,
        intro: `Your order status is now ${parsed.data.order_status}.`,
        nextSteps: parsed.data.note || "Contact YARA if you need help with this order.",
      });
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { status: "success", message: "Order status updated." };
}
