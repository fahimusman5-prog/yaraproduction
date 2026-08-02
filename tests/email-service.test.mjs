import assert from "node:assert/strict";
import test from "node:test";
import {
  deliverWithRetry,
  emailDedupeKey,
  emailTemplates,
  isValidEmail,
  isValidSender,
  readEmailConfiguration,
  renderEmail,
} from "../src/lib/email-core.ts";

const message = {
  from: "YARA Productions <orders@yaraproduct.com>",
  replyTo: "care@yaraproduct.com",
  to: "customer@example.com",
  subject: "Order confirmation",
  html: "<p>test</p>",
  text: "test",
};

test("email configuration requires every server-side Resend variable", () => {
  const missing = readEmailConfiguration({});
  assert.equal(missing.config, null);
  assert.deepEqual(missing.issues, [
    "RESEND_API_KEY is missing.",
    "EMAIL_FROM is missing.",
    "EMAIL_REPLY_TO is missing.",
    "ADMIN_NOTIFICATION_EMAIL is missing.",
  ]);

  const configured = readEmailConfiguration({
    RESEND_API_KEY: "test-only-key",
    EMAIL_FROM: message.from,
    EMAIL_REPLY_TO: message.replyTo,
    ADMIN_NOTIFICATION_EMAIL: "admin@yaraproduct.com",
  });
  assert.ok(configured.config);
  assert.equal(configured.config.replyTo, "care@yaraproduct.com");
});

test("email configuration trims accidental assignment prefixes before validating", () => {
  const configured = readEmailConfiguration({
    RESEND_API_KEY: "RESEND_API_KEY=re_test-only-key",
    EMAIL_FROM: "EMAIL_FROM=YARA Productions <orders@yaraproduct.com>",
    EMAIL_REPLY_TO: "EMAIL_REPLY_TO=care@yaraproduct.com",
    ADMIN_NOTIFICATION_EMAIL: "admin_notification_email=yaraproductweb@gmail.com",
  });
  assert.ok(configured.config);
  assert.equal(configured.config.from, "YARA Productions <orders@yaraproduct.com>");
  assert.equal(configured.config.adminNotificationEmail, "yaraproductweb@gmail.com");
});

test("sender, reply-to and recipient validation rejects unsafe values", () => {
  assert.equal(isValidSender(message.from), true);
  assert.equal(isValidSender("YARA Productions orders@yaraproduct.com"), false);
  assert.equal(isValidEmail("customer@example.com"), true);
  assert.equal(isValidEmail("not-an-address"), false);
});

test("mocked Resend provider succeeds and records its provider email id", async () => {
  const calls = [];
  const attempts = [];
  const result = await deliverWithRetry({
    provider: {
      async send(input) {
        calls.push(input);
        return { id: "resend-email-123" };
      },
    },
    message,
    onAttempt: async (attempt) => attempts.push(attempt),
    sleep: async () => {},
  });
  assert.equal(result.status, "sent");
  assert.equal(result.id, "resend-email-123");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].replyTo, "care@yaraproduct.com");
  assert.equal(attempts[0].providerMessageId, "resend-email-123");
});

test("temporary provider failures retry safely and then succeed", async () => {
  let sends = 0;
  const sleeps = [];
  const attempts = [];
  const result = await deliverWithRetry({
    provider: {
      async send() {
        sends += 1;
        if (sends < 3)
          throw Object.assign(new Error("temporary"), { statusCode: 503 });
        return { id: "resend-after-retry" };
      },
    },
    message,
    onAttempt: async (attempt) => attempts.push(attempt),
    sleep: async (milliseconds) => sleeps.push(milliseconds),
  });
  assert.equal(result.status, "sent");
  assert.equal(sends, 3);
  assert.deepEqual(sleeps, [1_000, 4_000]);
  assert.deepEqual(
    attempts.map((attempt) => attempt.status),
    ["failed", "failed", "sent"],
  );
});

test("invalid recipients are permanent provider failures and never loop", async () => {
  let sends = 0;
  const attempts = [];
  const result = await deliverWithRetry({
    provider: {
      async send() {
        sends += 1;
        throw Object.assign(new Error("invalid recipient"), {
          statusCode: 422,
        });
      },
    },
    message,
    onAttempt: async (attempt) => attempts.push(attempt),
    sleep: async () => assert.fail("permanent failures must not sleep"),
  });
  assert.equal(result.status, "failed");
  assert.equal(result.category, "invalid_recipient");
  assert.equal(sends, 1);
  assert.equal(attempts[0].retrying, false);
});

test("checkout dedupe keys are stable for repeated idempotent sends", () => {
  const input = {
    template: "new_order_customer",
    recipient: "Customer@Example.com",
    orderId: "4a0892e8-c315-43d2-a070-0ea0357910b4",
    subject: "Order",
    intro: "Order received",
  };
  assert.equal(emailDedupeKey(input), emailDedupeKey({ ...input }));
  assert.equal(
    emailDedupeKey(input),
    "new_order_customer:4a0892e8-c315-43d2-a070-0ea0357910b4:customer@example.com",
  );
});

test("all required templates exist and order HTML is responsive and complete", () => {
  for (const name of [
    "new_order_customer",
    "new_order_admin",
    "order_processing",
    "order_packed",
    "order_shipped",
    "order_delivered",
    "order_cancelled",
    "return_requested",
    "return_approved",
    "return_rejected",
    "refund_recorded",
    "account_deletion_requested",
    "account_deletion_completed",
    "payment_successful",
    "payment_failed",
    "payment_cancelled",
    "payment_pending",
    "refund_completed",
  ])
    assert.ok(emailTemplates.includes(name));

  const html = renderEmail({
    template: "new_order_customer",
    recipient: message.to,
    subject: "Order YARA-100",
    intro: "Thank you",
    nextSteps: "Wait for fulfilment.",
    order: {
      customerName: "Asha",
      orderNumber: "YARA-100",
      items: [
        { name: "Saffron Serum", quantity: 2, unitPrice: 100, subtotal: 200 },
      ],
      subtotal: 200,
      discount: 20,
      shipping: 10,
      total: 190,
      currency: "LKR",
      deliveryAddress: "Colombo, Sri Lanka",
      orderStatus: "processing",
    },
  });
  assert.match(html, /name="viewport"/);
  assert.match(html, /Saffron Serum/);
  assert.match(html, /Coupon discount/);
  assert.match(html, /Delivery address/);
  assert.doesNotMatch(html, /Shipping method/);
  assert.match(html, /Next steps/);
});
