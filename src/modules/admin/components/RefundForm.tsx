"use client";

import { useActionState } from "react";
import { createRefundAction } from "../commerce-actions";
import { initialActionState } from "../action-state";
import { ActionMessage } from "./ActionMessage";
import { SubmitButton } from "./SubmitButton";

export function RefundForm({ orderId, returns }: { orderId: string; returns: any[] }) {
  const [state, action] = useActionState(createRefundAction.bind(null, orderId), initialActionState);
  return <form action={action} className="staff-panel space-y-4 p-5"><h2 className="font-bold">Record refund</h2><p className="text-xs leading-5 text-slate-500">This creates an administrative record only. It does not issue money through a payment provider.</p><ActionMessage state={state} /><div className="grid gap-4 sm:grid-cols-2"><label><span className="staff-label">Type</span><select name="refund_type" className="staff-input"><option value="partial">Partial</option><option value="full">Full</option></select></label><label><span className="staff-label">Amount</span><input name="amount" type="number" min="0.01" step="0.01" required className="staff-input" /></label></div><label><span className="staff-label">Related return</span><select name="return_request_id" className="staff-input"><option value="">No linked return</option>{returns.map((item) => <option key={item.id} value={item.id}>{item.reason}</option>)}</select></label><label><span className="staff-label">Reason</span><input name="reason" required minLength={3} maxLength={1000} className="staff-input" /></label><label><span className="staff-label">Internal note</span><textarea name="internal_note" maxLength={2000} className="staff-input min-h-20" /></label><SubmitButton className="staff-button staff-button-primary w-full">Create refund record</SubmitButton></form>;
}
