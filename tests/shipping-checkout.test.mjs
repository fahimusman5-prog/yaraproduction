import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calculateOrderTotal,
  getUnavailableProductIds,
} from "../src/lib/shipping.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

function product(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    shippingAvailableLKR: true,
    shippingAvailableAED: true,
    priceLKR: 3000,
    priceAED: 75,
    stockQuantity: 10,
    ...overrides,
  };
}

test("one Sri Lankan order receives one LKR 500 delivery fee", () => {
  assert.equal(
    calculateOrderTotal({
      productSubtotal: 3_000,
      discountTotal: 0,
      deliveryFee: 500,
      paymentFee: 0,
    }),
    3_500,
  );
});

test("four products and multiple quantities still receive one LKR 500 fee", () => {
  assert.equal(
    calculateOrderTotal({
      productSubtotal: 12_000,
      discountTotal: 0,
      deliveryFee: 500,
      paymentFee: 0,
    }),
    12_500,
  );
  assert.equal(
    calculateOrderTotal({
      productSubtotal: 3_000 * 4,
      discountTotal: 0,
      deliveryFee: 500,
      paymentFee: 0,
    }),
    12_500,
  );
});

test("discounts and payment fees combine in the required order", () => {
  assert.equal(
    calculateOrderTotal({
      productSubtotal: 12_000,
      discountTotal: 1_200,
      deliveryFee: 500,
      paymentFee: 100,
    }),
    11_400,
  );
  assert.throws(
    () =>
      calculateOrderTotal({
        productSubtotal: 100,
        discountTotal: 0,
        deliveryFee: -1,
        paymentFee: 0,
      }),
    /non-negative/,
  );
});

test("regional product availability is independent from monetary delivery settings", () => {
  const unavailable = getUnavailableProductIds(
    [
      { product: product(), quantity: 5 },
      {
        product: product({ shippingAvailableAED: false }),
        quantity: 1,
      },
    ],
    "uae",
  );
  assert.equal(unavailable.length, 1);
});

test("checkout idempotency is enforced in the API and database transaction", async () => {
  const [route, migration] = await Promise.all([
    read("../src/app/api/checkout/route.ts"),
    read("../supabase/migrations/20260729160000_simplify_fixed_country_delivery.sql"),
  ]);
  assert.match(route, /idempotencyKey: z\.string\(\)\.uuid\(\)/);
  assert.match(route, /p_idempotency_key: parsed\.data\.idempotencyKey/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /where idempotency_key = p_idempotency_key/);
  assert.match(
    migration,
    /select v_existing\.id, v_existing\.order_number,\s+v_existing\.total_amount, v_existing\.currency, false/,
  );
});

test("delivery settings seed fixed LK 500 and UAE 25 countrywide fees", async () => {
  const migration = await read(
    "../supabase/migrations/20260729160000_simplify_fixed_country_delivery.sql",
  );
  assert.match(migration, /\('LK', 'LKR', 500, true, true\)/);
  assert.match(migration, /\('AE', 'AED', 25, true, true\)/);
  assert.equal(
    calculateOrderTotal({
      productSubtotal: 50,
      deliveryFee: 25,
    }),
    75,
  );
  assert.equal(
    calculateOrderTotal({
      productSubtotal: 300,
      deliveryFee: 25,
    }),
    325,
  );
});

test("server takes delivery from delivery_settings once and stores historical order snapshot", async () => {
  const migration = await read(
    "../supabase/migrations/20260729160000_simplify_fixed_country_delivery.sql",
  );
  assert.match(migration, /v_delivery := v_setting\.delivery_fee/);
  assert.match(
    migration,
    /v_subtotal \+ v_delivery \+ v_payment_fee/,
  );
  assert.match(
    migration,
    /shipping_fee,\s+shipping_currency,\s+discount_amount,\s+payment_fee/,
  );
  assert.match(
    migration,
    /shipping_fee,\s+shipping_calculation_type,\s+free_shipping,\s+product_shipping_fee[\s\S]*?v_product\.id,[\s\S]*?v_quantity,[\s\S]*?v_unit_price,[\s\S]*?v_unit_price \* v_quantity,\s+0,\s+'per_line',\s+false,\s+0/,
  );
  assert.doesNotMatch(migration, /v_delivery\s*:=\s*v_delivery\s*\+/);
});

test("client delivery and location routing values are ignored and server setting is revalidated", async () => {
  const [route, migration] = await Promise.all([
    read("../src/app/api/checkout/route.ts"),
    read("../supabase/migrations/20260729160000_simplify_fixed_country_delivery.sql"),
  ]);
  assert.doesNotMatch(route, /deliveryFee:\s*z\./);
  assert.doesNotMatch(route, /shippingFee:\s*z\./);
  assert.doesNotMatch(route, /shippingMethodId/);
  assert.doesNotMatch(route, /get_configured_shipping_options/);
  assert.match(migration, /from public\.delivery_settings[\s\S]*?for share/);
  assert.doesNotMatch(migration, /from public\.shipping_zones/);
  assert.doesNotMatch(migration, /from public\.shipping_methods/);
  assert.doesNotMatch(migration, /minimum_order_amount/);
  assert.match(
    migration,
    /Delivery currency does not match the selected region/,
  );
});

test("admin updates are admin-only, validated, confirmed, and audited", async () => {
  const [actions, manager, migration] = await Promise.all([
    read("../src/modules/admin/commerce-actions.ts"),
    read("../src/modules/admin/components/CommerceManager.tsx"),
    read("../supabase/migrations/20260729150000_regional_order_delivery_fee.sql"),
  ]);
  assert.match(
    actions,
    /export async function updateDeliverySettingAction[\s\S]*?await requireAdmin\("\/admin\/commerce"\)/,
  );
  assert.match(actions, /delivery_fee: z\.coerce\.number\(\)\.min\(0\)/);
  assert.match(actions, /entityType: "delivery_setting"/);
  assert.match(manager, /window\.confirm/);
  assert.match(migration, /check \(delivery_fee is null or delivery_fee >= 0\)/);
  assert.match(migration, /delivery_settings_admin_update/);
  assert.match(migration, /with check \(\(select private\.is_admin\(\)\)\)/);
});

test("PayHere amount is the exact server order total and webhook verifies it", async () => {
  const [checkout, webhook] = await Promise.all([
    read("../src/app/api/checkout/route.ts"),
    read("../src/app/api/payhere/notify/route.ts"),
  ]);
  assert.match(checkout, /const amount = Number\(order\.total_amount\)\.toFixed\(2\)/);
  assert.match(checkout, /fields:[\s\S]*?currency: order\.currency,\s+amount,/);
  assert.match(webhook, /update_payhere_payment/);
});

test("region switching automatically loads fixed delivery without city or method selection", async () => {
  const [migration, page] = await Promise.all([
    read("../supabase/migrations/20260729160000_simplify_fixed_country_delivery.sql"),
    read("../src/customer-pages/CheckoutPage.tsx"),
  ]);
  assert.match(
    migration,
    /case when p_country = 'sri-lanka' then 'LKR' else 'AED' end/,
  );
  assert.match(page, /Fixed delivery fee for the entire country/);
  assert.doesNotMatch(page, /loadShippingOptions/);
  assert.doesNotMatch(page, /shippingMethodId/);
  assert.doesNotMatch(page, /District \/ city|Emirate \/ city/);
  assert.match(page, /sm:grid-cols-2/);
  assert.match(
    page,
    /disabled=\{submitting \|\| !hasLiveCatalogItems \|\| !delivery\.configured/,
  );
});

test("stock, regional price, and explicit regional availability remain enforced", () => {
  const available = product({
    priceLKR: 3_000,
    priceAED: 50,
    stockQuantity: 2,
  });
  assert.equal(getUnavailableProductIds([{ product: available, quantity: 1 }], "sri-lanka").length, 0);
  assert.equal(getUnavailableProductIds([{ product: { ...available, stockQuantity: 0 }, quantity: 1 }], "sri-lanka").length, 1);
  assert.equal(getUnavailableProductIds([{ product: { ...available, priceAED: Number.NaN }, quantity: 1 }], "uae").length, 1);
  assert.equal(getUnavailableProductIds([{ product: { ...available, shippingAvailableLKR: false }, quantity: 1 }], "sri-lanka").length, 1);
});
