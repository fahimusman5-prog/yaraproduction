import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/supabase/auth";
import { getOrder } from "./data";
import { formatDate, formatMoney } from "./lib/format";
import { OrderStatusForm } from "./components/OrderStatusForm";
import { AdminLoadFailure } from "./components/AdminLoadFailure";
import { PageHeader } from "./components/PageHeader";
import { StatusBadge } from "./components/StatusBadge";
import { RefundForm } from "./components/RefundForm";

export async function AdminOrderDetailPage({ orderId }: { orderId: string }) {
  await requireStaff(`/admin/orders/${orderId}`);
  let result;
  try {
    result = await getOrder(orderId);
  } catch (error) {
    return (
      <AdminLoadFailure
        title="Order could not be loaded"
        detail={
          error instanceof Error ? error.message : "Unable to load the order."
        }
      />
    );
  }
  if (!result) notFound();
  const { order, items, events, returns, refunds } = result;
  return (
    <>
      <PageHeader
        eyebrow="Order details"
        title={order.order_number}
        description={`Placed ${formatDate(order.created_at, true)}`}
        action={
          <Link
            href="/admin/orders"
            className="staff-button staff-button-secondary"
          >
            Back to orders
          </Link>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <section className="staff-panel p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">Items</h2>
              <div className="flex gap-2">
                <StatusBadge value={order.payment_status} />
                <StatusBadge value={order.order_status} />
              </div>
            </div>
            <div className="mt-5 staff-table-wrap">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="font-semibold">
                        {item.products?.name ?? "Product"}
                      </td>
                      <td className="font-mono text-xs">
                        {item.products?.sku}
                      </td>
                      <td className="staff-metric">{item.quantity}</td>
                      <td className="staff-metric">
                        {formatMoney(Number(item.unit_price), order.currency)}
                      </td>
                      <td className="staff-metric font-semibold">
                        {formatMoney(Number(item.subtotal), order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto mt-5 grid max-w-sm gap-2 border-t border-[var(--staff-line)] pt-5 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>
                  {formatMoney(Number(order.subtotal_amount), order.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Discount</dt>
                <dd>
                  −{formatMoney(Number(order.discount_amount), order.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd>
                  {Number(order.shipping_fee) === 0
                    ? "Free"
                    : formatMoney(Number(order.shipping_fee), order.currency)}
                </dd>
              </div>
              {Number(order.payment_fee ?? 0) > 0 && (
                <div className="flex justify-between">
                  <dt>Payment fee</dt>
                  <dd>
                    {formatMoney(Number(order.payment_fee), order.currency)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <dt>Grand total</dt>
                <dd className="text-yara-wine">
                  {formatMoney(Number(order.total_amount), order.currency)}
                </dd>
              </div>
            </dl>
          </section>
          <section className="staff-panel grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <h2 className="font-bold">Customer &amp; delivery</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Name</dt>
                  <dd className="font-semibold">{order.customer_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd>{order.customer_email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Phone</dt>
                  <dd>{order.customer_phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Address snapshot</dt>
                  <dd>
                    {order.shipping_address}, {order.shipping_city}{" "}
                    {order.shipping_postal_code}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Method</dt>
                  <dd>
                    {order.shipping_method_name || "Product-level delivery"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Tracking</dt>
                  <dd>
                    {order.courier_name || "—"} {order.tracking_number || ""}
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <h2 className="font-bold">Payment &amp; market</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Method</dt>
                  <dd className="capitalize">
                    {order.payment_method.replaceAll("_", " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Country</dt>
                  <dd className="capitalize">
                    {order.country.replace("-", " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Currency</dt>
                  <dd>{order.currency}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Returns</dt>
                  <dd>{returns.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Refund records</dt>
                  <dd>{refunds.length}</dd>
                </div>
              </dl>
            </div>
          </section>
          <section className="staff-panel p-5">
            <h2 className="font-bold">Status history</h2>
            <div className="mt-4 grid gap-3">
              {events.map((event: any) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-[var(--staff-line)] p-3 text-sm"
                >
                  <p className="capitalize">
                    {event.from_status || "created"} → {event.to_status}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.note || "No note"} ·{" "}
                    {formatDate(event.created_at, true)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <OrderStatusForm order={order} />
          <RefundForm orderId={order.id} returns={returns} />
        </div>
      </div>
    </>
  );
}
