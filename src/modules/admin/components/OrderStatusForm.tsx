"use client";

import { useActionState } from "react";
import type { Order } from "@/lib/supabase/types";
import { initialActionState } from "../action-state";
import { updateOrderStatusAction } from "../actions";
import { ActionMessage } from "./ActionMessage";
import { SubmitButton } from "./SubmitButton";

export function OrderStatusForm({ order }: { order: Order }) {
  const [state, action] = useActionState(
    updateOrderStatusAction.bind(null, order.id),
    initialActionState,
  );
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm("Save this order status and fulfilment update? Customer notifications may be sent.")) event.preventDefault(); }} className="staff-panel space-y-4 p-5">
      <h2 className="font-bold">Update status</h2>
      <ActionMessage state={state} />
      <label>
        <span className="staff-label">Order status</span>
        <select
          className="staff-input"
          name="order_status"
          defaultValue={order.order_status}
        >
          {[
            "pending",
            "paid",
            "processing",
            "packed",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
          ].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="staff-label">Shipping method</span>
        <input className="staff-input" name="shipping_method_name" maxLength={160} defaultValue={order.shipping_method_name} />
      </label>
      <label>
        <span className="staff-label">Courier</span>
        <input className="staff-input" name="courier_name" maxLength={160} defaultValue={order.courier_name ?? ""} />
      </label>
      <label>
        <span className="staff-label">Tracking number</span>
        <input className="staff-input" name="tracking_number" maxLength={200} defaultValue={order.tracking_number ?? ""} />
      </label>
      <label>
        <span className="staff-label">Tracking URL</span>
        <input className="staff-input" name="tracking_url" type="url" maxLength={1000} defaultValue={(order as Order & { tracking_url?: string }).tracking_url ?? ""} />
      </label>
      <label>
        <span className="staff-label">Estimated delivery</span>
        <input className="staff-input" name="estimated_delivery_date" type="date" defaultValue={(order as Order & { estimated_delivery_date?: string }).estimated_delivery_date ?? ""} />
      </label>
      <label>
        <span className="staff-label">Payment status</span>
        <select
          className="staff-input"
          name="payment_status"
          defaultValue={order.payment_status}
        >
          {["pending", "paid", "failed", "refunded"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="staff-label">Internal note</span>
        <textarea
          className="staff-input min-h-24"
          name="note"
          maxLength={1000}
          placeholder="Optional reason or handling note"
        />
      </label>
      <SubmitButton className="staff-button staff-button-primary w-full">
        Save status
      </SubmitButton>
    </form>
  );
}
