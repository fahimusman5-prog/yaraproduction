import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Sri Lanka and UAE COD use isolated canonical currencies and shipping", async () => {
  const migration = await read(
    "../supabase/migrations/20260729163000_canonical_payment_rules.sql",
  );
  const shipping = await read(
    "../supabase/migrations/20260729160000_simplify_fixed_country_delivery.sql",
  );
  assert.match(shipping, /\('LK', 'LKR', 500/);
  assert.match(shipping, /\('AE', 'AED', 25/);
  assert.match(migration, /when 'mintpay' then 4\s+else 0/);
  assert.match(migration, /new\.currency = 'LKR'/);
  assert.match(migration, /AED to two decimals/);
});

test("COD creates a confirmed but unpaid order without a provider attempt", async () => {
  const migration = await read(
    "../supabase/migrations/20260729091821_complete_payment_method_system.sql",
  );
  assert.match(
    migration,
    /when 'cash_on_delivery' then 'payment_due_on_delivery'/,
  );
  assert.match(migration, /when 'cash_on_delivery' then 'confirmed'/);
  assert.match(
    migration,
    /if p_payment_method in \('card', 'koko', 'mintpay'\) then\s+insert into public\.payment_attempts/,
  );
  assert.doesNotMatch(
    migration,
    /if p_payment_method = 'cash_on_delivery' then\s+insert into public\.payment_attempts/,
  );
});

test("COD paid timestamp remains unset and inventory is finalized once", async () => {
  const migration = await read(
    "../supabase/migrations/20260729091821_complete_payment_method_system.sql",
  );
  assert.match(
    migration,
    /inventory_finalized_at = case\s+when p_payment_method in \('cash_on_delivery', 'bank_transfer'\) then now\(\)/,
  );
  assert.doesNotMatch(
    migration,
    /paid_at = case when p_payment_method = 'cash_on_delivery'/,
  );
});

test("duplicate COD submission reuses one database order and sends no repeat email", async () => {
  const [migration, checkout, email] = await Promise.all([
    read("../supabase/migrations/20260729091821_complete_payment_method_system.sql"),
    read("../src/app/api/checkout/route.ts"),
    read("../src/lib/email.ts"),
  ]);
  assert.match(migration, /if not v_created\.created then/);
  assert.match(migration, /return query select[\s\S]*?false/);
  assert.match(checkout, /if \(order\.created\)/);
  assert.match(email, /notification_events/);
});

test("invalid regions, invalid stock, and disabled products fail server-side", async () => {
  const [checkout, orderMigration] = await Promise.all([
    read("../src/app/api/checkout/route.ts"),
    read("../supabase/migrations/20260729091821_complete_payment_method_system.sql"),
  ]);
  assert.match(checkout, /country: z\.enum\(\["sri-lanka", "uae"\]\)/);
  assert.match(checkout, /items: z\.array/);
  assert.match(orderMigration, /Insufficient stock/);
  assert.match(checkout, /A product is unavailable/);
});

test("COD notifications disclose due-on-delivery status and regional totals", async () => {
  const checkout = await read("../src/app/api/checkout/route.ts");
  assert.match(checkout, /\["Shipping", money\(summary\?\.shipping_fee\)\]/);
  assert.match(checkout, /\["Processing fee", money\(summary\?\.payment_fee\)\]/);
  assert.match(checkout, /\["Payment status", "Payment due on delivery"\]/);
  assert.match(checkout, /Payment will be collected when your order is delivered/);
  assert.doesNotMatch(
    checkout.slice(
      checkout.indexOf('template: "new_order_customer"'),
      checkout.indexOf("let trackingToken"),
    ),
    /payment successful/i,
  );
});

test("success-page refresh is read-only and preserves COD language", async () => {
  const page = await read("../src/app/payment/success/page.tsx");
  assert.doesNotMatch(page, /\.insert\(|\.update\(|create_payment_order/);
  assert.match(page, /Payment will be collected when your order is delivered/);
  assert.match(page, /payment_status\.replaceAll/);
  assert.match(page, /money\(order\.total_amount, order\.currency\)/);
});

test("checkout has accessible responsive controls and submission protection", async () => {
  const [page, methods] = await Promise.all([
    read("../src/customer-pages/CheckoutPage.tsx"),
    read("../src/lib/payment-methods.ts"),
  ]);
  assert.match(page, /disabled=\{submitting/);
  assert.match(page, /aria-busy=\{submitting\}/);
  assert.match(page, /lg:grid-cols-\[1fr_390px\]/);
  assert.match(page, /min-h-11/);
  assert.match(page, /type="checkbox"/);
  assert.match(methods, /Confirm Cash on Delivery Order/i);
});

test("root brand metadata and fallback states consistently use YARA", async () => {
  const [layout, founder, missing, loading, error, social, icon] =
    await Promise.all([
      read("../src/app/layout.tsx"),
      read("../src/data/founder-story.ts"),
      read("../src/app/not-found.tsx"),
      read("../src/app/loading.tsx"),
      read("../src/app/error.tsx"),
      read("../src/app/opengraph-image.tsx"),
      read("../src/app/icon.tsx"),
    ]);
  assert.match(layout, /YARA \| Luxury Skincare/);
  assert.match(founder, /YARA Productions/);
  assert.doesNotMatch(founder, /name: "YARA Production"/);
  for (const source of [missing, loading, error, social, icon])
    assert.match(source, /YARA/);
});

test("only an administrator can mark offline payment as paid", async () => {
  const actions = await read("../src/modules/admin/actions.ts");
  const statusAction = actions.slice(
    actions.indexOf("export async function updateOrderStatusAction"),
    actions.indexOf("export async function", actions.indexOf("export async function updateOrderStatusAction") + 20),
  );
  assert.match(statusAction, /payment_status === "paid"/);
  assert.match(statusAction, /"cash_on_delivery", "bank_transfer"/);
  assert.match(statusAction, /await requireAdmin\(`\/admin\/orders\/\$\{orderId\}`\)/);
});
