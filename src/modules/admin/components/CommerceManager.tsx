"use client";

import { useActionState } from "react";
import {
  completeAccountDeletionAction,
  createCouponAction,
  createItemRefundAction,
  createShippingMethodAction,
  createShippingZoneAction,
  setCouponActiveAction,
  updateDeliverySettingAction,
  updatePaymentMethodSettingAction,
  updateAedUsdExchangeRateAction,
  reviewReturnItemsAction,
  updateReturnAction,
} from "../commerce-actions";
import { initialActionState } from "../action-state";
import { ActionMessage } from "./ActionMessage";
import { ConfirmActionButton } from "./ConfirmActionButton";
import { SubmitButton } from "./SubmitButton";

type Props = {
  deliverySettings: any[];
  paymentSettings: any[];
  exchangeRates: any[];
  payHereUsdApproved: boolean;
  shippingAudit: any[];
  products: any[];
  categories: any[];
  coupons: any[];
  returns: any[];
  refunds: any[];
  deletionRequests: any[];
};

export function CommerceManager({
  deliverySettings,
  paymentSettings,
  exchangeRates,
  payHereUsdApproved,
  shippingAudit,
  products,
  categories,
  coupons,
  returns,
  refunds,
  deletionRequests,
}: Props) {
  const [couponState, couponAction] = useActionState(
    createCouponAction,
    initialActionState,
  );
  return (
    <div className="space-y-8">
      {deliverySettings.length > 0 && (
        <section className="staff-panel p-5 sm:p-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-yara-wine">
              Order-level delivery
            </p>
            <h2 className="mt-2 text-xl font-bold">
              Regional delivery settings
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This delivery fee is charged once per order and applies to the
              entire selected country.
            </p>
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {deliverySettings.map((setting) => (
              <DeliverySettingEditor
                key={setting.region_code}
                setting={setting}
              />
            ))}
          </div>
        </section>
      )}
      {paymentSettings.length > 0 && (
        <section className="staff-panel p-5 sm:p-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-yara-wine">
              Checkout payments
            </p>
            <h2 className="mt-2 text-xl font-bold">
              Regional bank transfer details
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Card and instalment-provider availability is controlled by
              server-only deployment credentials. Processing fees are fixed in
              code and cannot be edited here.
            </p>
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {paymentSettings.map((setting) => (
              <PaymentSettingEditor key={setting.id} setting={setting} />
            ))}
          </div>
        </section>
      )}
      {payHereUsdApproved && (
        <ExchangeRateEditor rate={exchangeRates[0] ?? null} />
      )}
      {/* Legacy zone and method controls were removed from the active admin
          interface. The preserved source below documents the historical UI
          while legacy database records remain available to old orders.
      {false && (
        <>
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
          <h2 className="text-lg font-bold">Add shipping method</h2>
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
            <input type="hidden" name="fee" value="" />
            <input type="hidden" name="free_shipping_threshold" value="" />
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
            No delivery method is configured, so checkout cannot offer a
            delivery method or estimate.
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
        </>
      )} */}
      <section className="staff-panel p-5">
        <h2 className="text-lg font-bold">Delivery settings audit history</h2>
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

function PaymentSettingEditor({ setting }: { setting: any }) {
  const [state, action] = useActionState(
    updatePaymentMethodSettingAction.bind(null, setting.id),
    initialActionState,
  );
  return (
    <form action={action} className="rounded-xl border border-[var(--staff-line)] p-4">
      <ActionMessage state={state} />
      <input type="hidden" name="region_code" value={setting.region_code} />
      <input type="hidden" name="payment_method" value={setting.payment_method} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold capitalize">
            {setting.payment_method.replaceAll("_", " ")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {setting.region_code} · {setting.currency}
            {setting.provider_name ? ` · ${setting.provider_name}` : ""}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
          <input name="is_enabled" type="checkbox" value="true" defaultChecked={setting.is_enabled} />
          Enabled for this region
        </label>
        {[
          ["account_holder_name", "Account holder"],
          ["bank_name", "Bank name"],
          ["branch_name", "Branch"],
          ["account_number", "Account number"],
          ["iban", "IBAN"],
          ["swift_code", "SWIFT code"],
        ].map(([name, label]) => (
          <label key={name}>
            <span className="staff-label">{label}</span>
            <input
              name={name}
              defaultValue={setting[name] ?? ""}
              className="staff-input"
            />
          </label>
        ))}
        <label className="sm:col-span-2">
          <span className="staff-label">Customer instructions</span>
          <textarea
            name="instructions"
            defaultValue={setting.instructions ?? ""}
            className="staff-input"
          />
        </label>
      </div>
      <SubmitButton pendingLabel="Saving payment method…">
        Save bank details
      </SubmitButton>
    </form>
  );
}

function ExchangeRateEditor({ rate }: { rate: any | null }) {
  const [state, action] = useActionState(
    updateAedUsdExchangeRateAction,
    initialActionState,
  );
  const localDateTime = (value: string | undefined, fallback: Date) => {
    const date = value ? new Date(value) : fallback;
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };
  return (
    <section className="staff-panel p-5 sm:p-6">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-yara-wine">
          Approved foreign-currency checkout
        </p>
        <h2 className="mt-2 text-xl font-bold">AED to USD PayHere rate</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Define 1 AED in USD. New UAE payment attempts lock this rate and the
          converted USD charge permanently.
        </p>
      </div>
      <form action={action} className="mt-6 max-w-2xl rounded-xl border border-[var(--staff-line)] p-4">
        <ActionMessage state={state} />
        {rate?.id && <input type="hidden" name="id" value={rate.id} />}
        <div className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className="staff-label">1 AED = USD</span>
            <input name="rate" type="number" min="0.05" max="1" step="0.00000001" defaultValue={rate?.rate ?? ""} required className="staff-input" />
          </label>
          <label>
            <span className="staff-label">Effective from</span>
            <input name="effective_from" type="datetime-local" defaultValue={localDateTime(rate?.effective_from, new Date())} required className="staff-input" />
          </label>
          <label>
            <span className="staff-label">Expires at</span>
            <input name="expires_at" type="datetime-local" defaultValue={localDateTime(rate?.expires_at, new Date(Date.now() + 24 * 60 * 60 * 1000))} required className="staff-input" />
          </label>
        </div>
        <SubmitButton pendingLabel="Saving approved rate…">
          Save AED to USD rate
        </SubmitButton>
      </form>
    </section>
  );
}

function DeliverySettingEditor({ setting }: { setting: any }) {
  const [state, action] = useActionState(
    updateDeliverySettingAction,
    initialActionState,
  );
  const isUae = setting.region_code === "AE";
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Save the ${isUae ? "UAE" : "Sri Lanka"} order-level delivery setting? This affects new checkouts immediately.`,
          )
        )
          event.preventDefault();
      }}
      className="rounded-2xl border border-[var(--staff-line)] bg-white p-5"
    >
      <input type="hidden" name="region_code" value={setting.region_code} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">
            {isUae ? "UAE Delivery Fee" : "Sri Lanka Delivery Fee"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Last updated{" "}
            {setting.updated_at
              ? new Date(setting.updated_at).toLocaleString()
              : "not recorded"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            setting.is_enabled && setting.is_configured
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-900"
          }`}
        >
          {setting.is_enabled && setting.is_configured
            ? "Active"
            : setting.is_configured
              ? "Disabled"
              : "Unconfigured"}
        </span>
      </div>
      <div className="mt-5">
        <ActionMessage state={state} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="staff-label">Currency</span>
          <input
            name="currency"
            readOnly
            value={setting.currency}
            className="staff-input bg-slate-50"
          />
        </label>
        <label>
          <span className="staff-label">
            Delivery fee ({setting.currency})
          </span>
          <input
            name="delivery_fee"
            type="number"
            min="0"
            max="999999999"
            step="0.01"
            defaultValue={setting.delivery_fee ?? ""}
            placeholder={isUae ? "25" : "500"}
            required
            className="staff-input"
          />
        </label>
      </div>
      <div className="mt-4">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_enabled"
            value="true"
            defaultChecked={setting.is_enabled}
          />
          Enabled
        </label>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        This delivery fee is charged once per order and applies to the entire
        selected country.
      </p>
      <SubmitButton pendingLabel="Saving delivery setting…">
        Save delivery setting
      </SubmitButton>
    </form>
  );
}

/* Legacy zone and method editor source retained temporarily for historical
   reference only; it is not compiled or reachable from the admin interface.
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
        <input type="hidden" name="fee" value="" />
        <input type="hidden" name="free_shipping_threshold" value="" />
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
} */

function ReturnCard({ request }: { request: any }) {
  const [state, action] = useActionState(
    updateReturnAction.bind(null, request.id),
    initialActionState,
  );
  const [reviewState, reviewAction] = useActionState(
    reviewReturnItemsAction.bind(null, request.id),
    initialActionState,
  );
  const [refundState, refundAction] = useActionState(
    createItemRefundAction.bind(null, request.order_id, request.id),
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
      <div className="mt-4 grid gap-3">
        {request.return_items?.map((item: any) => (
          <div
            key={item.id}
            className="rounded-xl bg-slate-50 p-4 text-sm"
          >
            <p className="font-semibold">
              {item.order_items?.products?.name ?? "Product"} · requested{" "}
              {item.quantity}
            </p>
            <p className="mt-1 text-slate-500">
              {String(item.reason).replaceAll("_", " ")}
              {item.customer_note ? ` · ${item.customer_note}` : ""}
            </p>
            <p className="mt-2 text-xs">
              Approved {item.approved_quantity} · Rejected{" "}
              {item.rejected_quantity} · Received {item.received_quantity}
            </p>
            {item.inspection_outcome && (
              <p className="mt-1 text-xs text-slate-500">
                Inspection: {item.inspection_outcome}
              </p>
            )}
          </div>
        ))}
      </div>
      {request.return_images?.length > 0 && (
        <div className="mt-4">
          <p className="staff-label">Private evidence</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {request.return_images.map((image: any, index: number) =>
              image.signed_url ? (
                <a
                  key={image.id}
                  href={image.signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="staff-button staff-button-secondary"
                >
                  Evidence {index + 1}
                </a>
              ) : null,
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Links expire after 15 minutes.
          </p>
        </div>
      )}
      <details className="mt-4 rounded-xl border border-[var(--staff-line)] p-4">
        <summary className="min-h-11 cursor-pointer font-semibold">
          Review item quantities
        </summary>
        <form action={reviewAction} className="mt-4 grid gap-4">
          <ActionMessage state={reviewState} />
          {request.return_items?.map((item: any) => (
            <fieldset
              key={item.id}
              className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3"
            >
              <legend className="px-1 text-sm font-semibold">
                {item.order_items?.products?.name ?? "Product"} ·{" "}
                {item.quantity} requested
              </legend>
              <input type="hidden" name="return_item_id" value={item.id} />
              <label>
                <span className="staff-label">Approve</span>
                <input
                  name={`approved_${item.id}`}
                  type="number"
                  min="0"
                  max={item.quantity}
                  defaultValue={item.approved_quantity}
                  required
                  className="staff-input"
                />
              </label>
              <label>
                <span className="staff-label">Reject</span>
                <input
                  name={`rejected_${item.id}`}
                  type="number"
                  min="0"
                  max={item.quantity}
                  defaultValue={item.rejected_quantity}
                  required
                  className="staff-input"
                />
              </label>
              <label>
                <span className="staff-label">Inspection outcome</span>
                <input
                  name={`inspection_${item.id}`}
                  maxLength={1000}
                  defaultValue={item.inspection_outcome}
                  className="staff-input"
                />
              </label>
            </fieldset>
          ))}
          <label>
            <span className="staff-label">Decision note</span>
            <textarea
              name="admin_note"
              maxLength={2000}
              className="staff-input"
            />
          </label>
          <SubmitButton>Record item decisions</SubmitButton>
        </form>
      </details>
      {request.orders?.payment_status === "paid" && (
        <details className="mt-4 rounded-xl border border-[var(--staff-line)] p-4">
          <summary className="min-h-11 cursor-pointer font-semibold">
            Record partial refund
          </summary>
          <form action={refundAction} className="mt-4 grid gap-4">
            <ActionMessage state={refundState} />
            {request.return_items
              ?.filter((item: any) => item.approved_quantity > 0)
              .map((item: any) => (
                <fieldset
                  key={item.id}
                  className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"
                >
                  <legend className="px-1 text-sm font-semibold">
                    {item.order_items?.products?.name ?? "Product"} · approved{" "}
                    {item.approved_quantity}
                  </legend>
                  <input
                    type="hidden"
                    name="refund_order_item_id"
                    value={item.order_items?.id}
                  />
                  <label>
                    <span className="staff-label">Refund quantity</span>
                    <input
                      name={`refund_quantity_${item.order_items?.id}`}
                      type="number"
                      min="0"
                      max={item.approved_quantity}
                      defaultValue="0"
                      className="staff-input"
                    />
                  </label>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name={`refund_shipping_${item.order_items?.id}`}
                      value="true"
                    />
                    Include proportional item shipping
                  </label>
                </fieldset>
              ))}
            <label>
              <span className="staff-label">Customer-facing reason</span>
              <input
                name="reason"
                minLength={3}
                maxLength={1000}
                required
                className="staff-input"
              />
            </label>
            <label>
              <span className="staff-label">Internal note</span>
              <textarea
                name="internal_note"
                maxLength={2000}
                className="staff-input"
              />
            </label>
            <SubmitButton>Record refund only</SubmitButton>
            <p className="text-xs text-amber-700">
              This creates an immutable accounting record. It does not contact a
              payment provider or move money.
            </p>
          </form>
        </details>
      )}
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
