"use client";

import { useActionState } from "react";
import type { Order } from "@/lib/supabase/types";
import { initialActionState, updateOrderStatusAction } from "../actions";
import { ActionMessage } from "./ActionMessage";
import { SubmitButton } from "./SubmitButton";

export function OrderStatusForm({ order }: { order: Order }) {
  const [state, action] = useActionState(updateOrderStatusAction.bind(null, order.id), initialActionState);
  return <form action={action} className="staff-panel space-y-4 p-5"><h2 className="font-bold">Update status</h2><ActionMessage state={state} /><label><span className="staff-label">Order status</span><select className="staff-input" name="order_status" defaultValue={order.order_status}>{["pending", "paid", "processing", "shipped", "delivered", "cancelled"].map((v) => <option key={v}>{v}</option>)}</select></label><label><span className="staff-label">Payment status</span><select className="staff-input" name="payment_status" defaultValue={order.payment_status}>{["pending", "paid", "failed", "refunded"].map((v) => <option key={v}>{v}</option>)}</select></label><SubmitButton className="staff-button staff-button-primary w-full">Save status</SubmitButton></form>;
}
