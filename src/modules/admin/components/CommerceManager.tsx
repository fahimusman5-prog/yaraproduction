"use client";

import { useActionState } from "react";
import {
  archiveShippingMethodAction,
  archiveShippingProductRateAction,
  archiveShippingZoneAction,
  completeAccountDeletionAction,
  createCouponAction,
  createShippingMethodAction,
  createShippingZoneAction,
  saveShippingProductRateAction,
  setCouponActiveAction,
  updateShippingMethodAction,
  updateShippingZoneAction,
  updateReturnAction,
} from "../commerce-actions";
import { initialActionState } from "../action-state";
import { ActionMessage } from "./ActionMessage";
import { ConfirmActionButton } from "./ConfirmActionButton";
import { SubmitButton } from "./SubmitButton";

type Props = {
  zones: any[];
  methods: any[];
  productRates: any[];
  shippingAudit: any[];
  products: any[];
  categories: any[];
  coupons: any[];
  returns: any[];
  refunds: any[];
  deletionRequests: any[];
};

export function CommerceManager({
  zones,
  methods,
  productRates,
  shippingAudit,
  products,
  categories,
  coupons,
  returns,
  refunds,
  deletionRequests,
}: Props) {
  const [zoneState, zoneAction] = useActionState(
    createShippingZoneAction,
    initialActionState,
  );
  const [methodState, methodAction] = useActionState(
    createShippingMethodAction,
    initialActionState,
  );
  const [couponState, couponAction] = useActionState(
    createCouponAction,
    initialActionState,
  );
  const [productRateState, productRateAction] = useActionState(
    saveShippingProductRateAction,
    initialActionState,
  );
  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-2">
        <form action={zoneAction} className="staff-panel space-y-4 p-5">
          <h2 className="text-lg font-bold">Add shipping zone</h2>
          <ActionMessage state={zoneState} />
          <label>
            <span className="staff-label">Name</span>
            <input name="name" required className="staff-input" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="staff-label">Market</span>
              <select name="country_code" className="staff-input">
                <option value="LK">Sri Lanka</option>
                <option value="AE">UAE</option>
              </select>
            </label>
            <label>
              <span className="staff-label">District / emirate label</span>
              <input name="region_name" required className="staff-input" />
            </label>
            <label>
              <span className="staff-label">Match type</span>
              <select name="zone_kind" className="staff-input">
                <option value="district">Sri Lanka district</option>
                <option value="emirate">UAE emirate</option>
                <option value="city">City</option>
                <option value="zone">Custom zone</option>
                <option value="regional_fallback">Regional fallback</option>
              </select>
            </label>
            <label>
              <span className="staff-label">Minimum order</span>
              <input
                name="minimum_order_amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                required
                className="staff-input"
              />
            </label>
          </div>
          <label>
            <span className="staff-label">Matching districts / cities</span>
            <input
              name="match_values"
              className="staff-input"
              placeholder="Colombo, Dehiwala, Mount Lavinia"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Comma-separated. Prices are configured on delivery methods, not
              here.
            </span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="cod_available" value="true" />
              Cash on delivery allowed
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_regional_fallback"
                value="true"
              />
              Regional fallback
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="active" value="true" />
            Active
          </label>
          <SubmitButton>Add zone</SubmitButton>
        </form>
        <form action={methodAction} className="staff-panel space-y-4 p-5">
          <h2 className="text-lg font-bold">
            Add shipping method / fallback rate
          </h2>
          <ActionMessage state={methodState} />
          <label>
            <span className="staff-label">Zone</span>
            <select name="shipping_zone_id" required className="staff-input">
              <option value="">Choose zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} · {zone.country_code}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="staff-label">Method name</span>
              <input name="name" required className="staff-input" />
            </label>
            <label>
              <span className="staff-label">Currency</span>
              <select name="currency" className="staff-input">
                <option>LKR</option>
                <option>AED</option>
              </select>
            </label>
            <label>
              <span className="staff-label">Fallback fee</span>
              <input
                name="fee"
                type="number"
                min="0"
                step="0.01"
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Free threshold</span>
              <input
                name="free_shipping_threshold"
                type="number"
                min="0"
                step="0.01"
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Minimum order</span>
              <input
                name="minimum_order_amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                required
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Minimum days</span>
              <input
                name="estimated_min_days"
                type="number"
                min="0"
                defaultValue="1"
                required
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Maximum days</span>
              <input
                name="estimated_max_days"
                type="number"
                min="0"
                defaultValue="3"
                required
                className="staff-input"
              />
            </label>
          </div>
          <label>
            <span className="staff-label">Description</span>
            <textarea name="description" className="staff-input" />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="cod_available" value="true" />
            Cash on delivery allowed
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="active" value="true" />
            Active
          </label>
          <SubmitButton>Add method</SubmitButton>
        </form>
      </section>
      <section className="staff-panel p-5">
        <h2 className="text-lg font-bold">Configured delivery</h2>
        {methods.length ? (
          <div className="staff-table-wrap mt-4">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Method</th>
                  <th>Rate</th>
                  <th>Estimate</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id}>
                    <td>{method.shipping_zones?.name}</td>
                    <td>{method.name}</td>
                    <td>
                      {method.fee === null
                        ? "Business value required"
                        : `${method.currency} ${Number(method.fee).toFixed(2)}`}
                    </td>
                    <td>
                      {method.estimated_min_days}–{method.estimated_max_days}{" "}
                      days
                    </td>
                    <td>{method.active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-800">
            No delivery method is configured. Product-level fees may still
            calculate, but no selectable method or estimate is available.
          </p>
        )}
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="staff-panel p-5">
          <h2 className="text-lg font-bold">Edit shipping zones</h2>
          <p className="mt-2 text-sm text-slate-500">
            Inactive placeholders do not appear at checkout. Add real business
            values before activation.
          </p>
          <div className="mt-4 grid gap-4">
            {zones.length ? (
              zones.map((zone) => (
                <ShippingZoneEditor key={zone.id} zone={zone} />
              ))
            ) : (
              <p className="text-sm text-slate-500">No zones configured.</p>
            )}
          </div>
        </div>
        <div className="staff-panel p-5">
          <h2 className="text-lg font-bold">Edit shipping methods</h2>
          <div className="mt-4 grid gap-4">
            {methods.length ? (
              methods.map((method) => (
                <ShippingMethodEditor
                  key={method.id}
                  method={method}
                  zones={zones}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Add a zone before creating methods.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          action={productRateAction}
          className="staff-panel space-y-4 p-5"
        >
          <h2 className="text-lg font-bold">Product-level method rate</h2>
          <ActionMessage state={productRateState} />
          <label>
            <span className="staff-label">Delivery method</span>
            <select
              name="shipping_method_id"
              required
              className="staff-input"
            >
              <option value="">Choose method</option>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.shipping_zones?.name} · {method.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="staff-label">Product</span>
            <select name="product_id" required className="staff-input">
              <option value="">Choose product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.sku}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="staff-label">Fee</span>
              <input
                name="fee"
                type="number"
                min="0"
                step="0.01"
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Calculation</span>
              <select name="calculation_type" className="staff-input">
                <option value="per_line">Once per product line</option>
                <option value="per_unit">Per unit</option>
              </select>
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="free_shipping" value="true" />
            Free delivery for this method
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="active" value="true" />
            Active
          </label>
          <SubmitButton>Save product rate</SubmitButton>
        </form>
        <div className="staff-panel p-5">
          <h2 className="text-lg font-bold">Product delivery overrides</h2>
          {productRates.length ? (
            <div className="staff-table-wrap mt-4">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Method</th>
                    <th>Rate</th>
                    <th>State</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {productRates.map((rate) => (
                    <tr key={rate.id}>
                      <td>{rate.products?.name}</td>
                      <td>{rate.shipping_methods?.name}</td>
                      <td>
                        {rate.free_shipping
                          ? "Free"
                          : `${rate.shipping_methods?.currency} ${Number(rate.fee).toFixed(2)} ${
                              rate.calculation_type === "per_unit"
                                ? "per unit"
                                : "per line"
                            }`}
                      </td>
                      <td>{rate.active ? "Active" : "Inactive"}</td>
                      <td>
                        <ConfirmActionButton
                          action={archiveShippingProductRateAction.bind(
                            null,
                            rate.id,
                          )}
                          label="Archive"
                          title="Archive this product delivery rate?"
                          detail="Checkout will immediately stop using this override. The audit record is retained."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No product-level method overrides.
            </p>
          )}
        </div>
      </section>
      <section className="staff-panel p-5">
        <h2 className="text-lg font-bold">Shipping audit history</h2>
        {shippingAudit.length ? (
          <div className="staff-table-wrap mt-4">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Action</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {shippingAudit.map((entry) => (
                  <tr key={entry.id}>
                    <td className="capitalize">
                      {entry.entity_type.replaceAll("_", " ")}
                    </td>
                    <td className="capitalize">{entry.action}</td>
                    <td>{new Date(entry.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No shipping configuration changes recorded yet.
          </p>
        )}
      </section>
      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form action={couponAction} className="staff-panel space-y-4 p-5">
          <h2 className="text-lg font-bold">Create coupon</h2>
          <ActionMessage state={couponState} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="staff-label">Code</span>
              <input name="code" required className="staff-input uppercase" />
            </label>
            <label>
              <span className="staff-label">Market</span>
              <select name="country_scope" className="staff-input">
                <option value="both">Both</option>
                <option value="sri-lanka">Sri Lanka</option>
                <option value="uae">UAE</option>
              </select>
            </label>
            <label>
              <span className="staff-label">Type</span>
              <select name="discount_type" className="staff-input">
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
              </select>
            </label>
            <label>
              <span className="staff-label">Value</span>
              <input
                name="discount_value"
                type="number"
                min="0.01"
                step="0.01"
                required
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Minimum order</span>
              <input
                name="minimum_order_amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Maximum discount</span>
              <input
                name="maximum_discount"
                type="number"
                min="0"
                step="0.01"
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Usage limit</span>
              <input
                name="usage_limit"
                type="number"
                min="1"
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Per customer</span>
              <input
                name="per_customer_limit"
                type="number"
                min="1"
                defaultValue="1"
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Starts</span>
              <input
                name="starts_at"
                type="datetime-local"
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Expires</span>
              <input
                name="ends_at"
                type="datetime-local"
                className="staff-input"
              />
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="active" value="true" />
            Active immediately
          </label>
          <SubmitButton>Create coupon</SubmitButton>
        </form>
        <section className="staff-panel p-5">
          <h2 className="text-lg font-bold">Coupons</h2>
          {coupons.length ? (
            <div className="staff-table-wrap mt-4">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Market</th>
                    <th>Usage</th>
                    <th>State</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="font-mono font-bold">{coupon.code}</td>
                      <td>
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}%`
                          : Number(coupon.discount_value).toFixed(2)}
                      </td>
                      <td>{coupon.country_scope}</td>
                      <td>
                        {coupon.coupon_redemptions?.[0]?.count ?? 0}
                        {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                      </td>
                      <td>{coupon.active ? "Active" : "Inactive"}</td>
                      <td>
                        <ConfirmActionButton
                          action={setCouponActiveAction.bind(
                            null,
                            coupon.id,
                            !coupon.active,
                          )}
                          label={coupon.active ? "Disable" : "Enable"}
                          title={`${coupon.active ? "Disable" : "Enable"} ${coupon.code}?`}
                          detail="The change applies to new checkout validations immediately."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No coupons created.</p>
          )}
        </section>
      </section>
      <section className="staff-panel p-5">
        <h2 className="text-lg font-bold">Return requests</h2>
        {returns.length ? (
          <div className="mt-4 grid gap-4">
            {returns.map((request) => (
              <ReturnCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No return requests.</p>
        )}
      </section>
      <section className="staff-panel p-5">
        <h2 className="text-lg font-bold">Refund history</h2>
        {refunds.length ? (
          <div className="staff-table-wrap mt-4">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id}>
                    <td>{refund.orders?.order_number}</td>
                    <td>
                      {refund.currency} {Number(refund.amount).toFixed(2)}
                    </td>
                    <td>{refund.refund_type}</td>
                    <td>{refund.status}</td>
                    <td>{refund.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No refund records.</p>
        )}
      </section>
      <section className="staff-panel p-5">
        <h2 className="text-lg font-bold">Account deletion requests</h2>
        {deletionRequests.length ? (
          <div className="staff-table-wrap mt-4">
            <table className="staff-table">
              <thead><tr><th>Email</th><th>Status</th><th>Requested</th><th>Action</th></tr></thead>
              <tbody>
                {deletionRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.requested_email}</td>
                    <td className="capitalize">{request.status}</td>
                    <td>{new Date(request.requested_at).toLocaleString()}</td>
                    <td><ConfirmActionButton action={completeAccountDeletionAction.bind(null, request.id)} label="Complete" title="Permanently complete account deletion?" detail="This anonymises retained commerce records, removes saved addresses and the authentication account, and revokes sessions. It cannot be undone." /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-4 text-sm text-slate-500">No account deletion requests need attention.</p>}
      </section>
    </div>
  );
}

function ShippingZoneEditor({ zone }: { zone: any }) {
  const [state, action] = useActionState(
    updateShippingZoneAction.bind(null, zone.id),
    initialActionState,
  );
  return (
    <details className="rounded-xl border border-[var(--staff-line)] p-4">
      <summary className="min-h-11 cursor-pointer font-semibold">
        {zone.name} · {zone.active ? "Active" : "Inactive"}
      </summary>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <ActionMessage state={state} />
        <label>
          <span className="staff-label">Name</span>
          <input
            name="name"
            defaultValue={zone.name}
            required
            className="staff-input"
          />
        </label>
        <label>
          <span className="staff-label">Market</span>
          <select
            name="country_code"
            defaultValue={zone.country_code}
            className="staff-input"
          >
            <option value="LK">Sri Lanka</option>
            <option value="AE">UAE</option>
          </select>
        </label>
        <label>
          <span className="staff-label">Region label</span>
          <input
            name="region_name"
            defaultValue={zone.region_name}
            required
            className="staff-input"
          />
        </label>
        <label>
          <span className="staff-label">Match type</span>
          <select
            name="zone_kind"
            defaultValue={zone.zone_kind}
            className="staff-input"
          >
            <option value="district">District</option>
            <option value="emirate">Emirate</option>
            <option value="city">City</option>
            <option value="zone">Custom zone</option>
            <option value="regional_fallback">Regional fallback</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="staff-label">Matching values</span>
          <input
            name="match_values"
            defaultValue={(zone.match_values ?? []).join(", ")}
            className="staff-input"
          />
        </label>
        <label>
          <span className="staff-label">Minimum order</span>
          <input
            name="minimum_order_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={zone.minimum_order_amount ?? 0}
            required
            className="staff-input"
          />
        </label>
        <div className="grid gap-2">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="cod_available"
              value="true"
              defaultChecked={zone.cod_available}
            />
            COD allowed
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_regional_fallback"
              value="true"
              defaultChecked={zone.is_regional_fallback}
            />
            Regional fallback
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              value="true"
              defaultChecked={zone.active}
            />
            Active
          </label>
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <SubmitButton>Save zone</SubmitButton>
          <ConfirmActionButton
            action={archiveShippingZoneAction.bind(null, zone.id)}
            label="Archive"
            title={`Archive ${zone.name}?`}
            detail="The zone and its delivery methods will stop appearing at checkout. Audit history is retained."
          />
        </div>
      </form>
    </details>
  );
}

function ShippingMethodEditor({
  method,
  zones,
}: {
  method: any;
  zones: any[];
}) {
  const [state, action] = useActionState(
    updateShippingMethodAction.bind(null, method.id),
    initialActionState,
  );
  return (
    <details className="rounded-xl border border-[var(--staff-line)] p-4">
      <summary className="min-h-11 cursor-pointer font-semibold">
        {method.name} · {method.active ? "Active" : "Inactive"}
      </summary>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <ActionMessage state={state} />
        <label className="sm:col-span-2">
          <span className="staff-label">Zone</span>
          <select
            name="shipping_zone_id"
            defaultValue={method.shipping_zone_id}
            className="staff-input"
          >
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} · {zone.country_code}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="staff-label">Method</span>
          <input
            name="name"
            defaultValue={method.name}
            required
            className="staff-input"
          />
        </label>
        <label>
          <span className="staff-label">Currency</span>
          <select
            name="currency"
            defaultValue={method.currency}
            className="staff-input"
          >
            <option>LKR</option>
            <option>AED</option>
          </select>
        </label>
        <label>
          <span className="staff-label">Fallback fee</span>
          <input
            name="fee"
            type="number"
            min="0"
            step="0.01"
            defaultValue={method.fee ?? ""}
            className="staff-input"
          />
        </label>
        <label>
          <span className="staff-label">Free threshold</span>
          <input
            name="free_shipping_threshold"
            type="number"
            min="0"
            step="0.01"
            defaultValue={method.free_shipping_threshold ?? ""}
            className="staff-input"
          />
        </label>
        <label>
          <span className="staff-label">Minimum order</span>
          <input
            name="minimum_order_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={method.minimum_order_amount ?? 0}
            required
            className="staff-input"
          />
        </label>
        <label>
          <span className="staff-label">Estimate</span>
          <span className="grid grid-cols-2 gap-2">
            <input
              name="estimated_min_days"
              type="number"
              min="0"
              defaultValue={method.estimated_min_days}
              required
              className="staff-input"
              aria-label="Minimum delivery days"
            />
            <input
              name="estimated_max_days"
              type="number"
              min="0"
              defaultValue={method.estimated_max_days}
              required
              className="staff-input"
              aria-label="Maximum delivery days"
            />
          </span>
        </label>
        <label className="sm:col-span-2">
          <span className="staff-label">Description</span>
          <textarea
            name="description"
            defaultValue={method.description}
            className="staff-input"
          />
        </label>
        <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="cod_available"
              value="true"
              defaultChecked={method.cod_available}
            />
            COD allowed
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              value="true"
              defaultChecked={method.active}
            />
            Active
          </label>
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <SubmitButton>Save method</SubmitButton>
          <ConfirmActionButton
            action={archiveShippingMethodAction.bind(null, method.id)}
            label="Archive"
            title={`Archive ${method.name}?`}
            detail="Checkout will immediately stop offering this method. Audit history is retained."
          />
        </div>
      </form>
    </details>
  );
}

function ReturnCard({ request }: { request: any }) {
  const [state, action] = useActionState(
    updateReturnAction.bind(null, request.id),
    initialActionState,
  );
  return (
    <article className="rounded-xl border border-[var(--staff-line)] p-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold">
            {request.orders?.order_number}
          </p>
          <p className="mt-1 font-semibold">{request.reason}</p>
          <p className="mt-1 text-sm text-slate-500">
            {request.customer_note || "No customer note."}
          </p>
        </div>
        <span className="capitalize">
          {request.status.replaceAll("_", " ")}
        </span>
      </div>
      <form
        action={action}
        className="mt-4 grid gap-3 md:grid-cols-[190px_1fr_auto]"
      >
        <ActionMessage state={state} />
        <select
          name="status"
          defaultValue={request.status}
          className="staff-input"
        >
          {[
            "requested",
            "more_information",
            "approved",
            "rejected",
            "received",
            "inspected",
            "restocked",
            "resolved",
            "cancelled",
          ].map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <input
          name="admin_note"
          className="staff-input"
          placeholder="Internal/customer handling note"
          maxLength={2000}
        />
        <SubmitButton>Update</SubmitButton>
      </form>
    </article>
  );
}
