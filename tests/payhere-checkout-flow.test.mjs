import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PAYHERE_ACKNOWLEDGEMENT_FIELD,
  acquireCheckoutLock,
  beginPayHereRedirect,
  createReadyPayHereFlow,
  recoverPayHereRedirect,
  releaseCheckoutLock,
  requirePayHereConfirmation,
  setPayHereAcknowledged,
  submitPayHereHostedForm,
} from "../src/lib/payhere-checkout-flow.ts";
import {
  calculateUaePayHereCharge,
  formatPayHereAmount,
} from "../src/lib/payhere-amount.ts";

const submission = {
  orderId: "00000000-0000-4000-8000-000000000001",
  action: "https://sandbox.payhere.lk/pay/checkout",
  fields: {
    merchant_id: "test-merchant",
    order_id: "YARA-TEST-1",
    currency: "LKR",
    amount: "2766.00",
    hash: "TEST_HASH",
  },
  chargeSummary: {
    sourceCurrency: "AED",
    sourceAmount: 29.12,
    chargeCurrency: "LKR",
    chargeAmount: 2766,
    exchangeRate: 95,
    notice: "Test conversion",
  },
};

function createFakeDocument({ failSubmission = false } = {}) {
  const createdForms = [];
  let submitCount = 0;
  let removeCount = 0;
  const documentTarget = {
    body: {
      appendChild(form) {
        createdForms.push(form);
        return form;
      },
    },
    createElement(tagName) {
      if (tagName === "input") {
        return { type: "", name: "", value: "" };
      }
      return {
        method: "",
        action: "",
        children: [],
        appendChild(input) {
          this.children.push(input);
          return input;
        },
        submit() {
          submitCount += 1;
          if (failSubmission) throw new Error("native submission failed");
        },
        remove() {
          removeCount += 1;
        },
      };
    },
  };
  return {
    documentTarget,
    createdForms,
    get submitCount() {
      return submitCount;
    },
    get removeCount() {
      return removeCount;
    },
  };
}

test("TEST 1: UAE Card without acknowledgement cannot begin redirect", () => {
  const confirmation = requirePayHereConfirmation(submission);
  assert.equal(confirmation.phase, "confirmation_required");
  assert.equal(beginPayHereRedirect(confirmation), null);
  assert.equal(PAYHERE_ACKNOWLEDGEMENT_FIELD, "payHereExchangeAcknowledged");
});

test("TEST 2: UAE Card preparation is acquired exactly once", () => {
  const preparationLock = { current: false };
  let preparationCalls = 0;
  if (acquireCheckoutLock(preparationLock)) preparationCalls += 1;
  if (acquireCheckoutLock(preparationLock)) preparationCalls += 1;
  assert.equal(preparationCalls, 1);
  releaseCheckoutLock(preparationLock);
  assert.equal(acquireCheckoutLock(preparationLock), true);
});

test("TEST 3: successful preparation initiates one PayHere POST form", () => {
  const fake = createFakeDocument();
  const form = submitPayHereHostedForm(fake.documentTarget, submission);
  assert.equal(fake.submitCount, 1);
  assert.equal(form.method, "POST");
  assert.equal(form.action, submission.action);
  assert.deepEqual(
    Object.fromEntries(form.children.map((input) => [input.name, input.value])),
    submission.fields,
  );
});

test("TEST 4: redirect failure keeps confirmation retryable", () => {
  const confirmed = setPayHereAcknowledged(
    requirePayHereConfirmation(submission),
    true,
  );
  const redirecting = beginPayHereRedirect(confirmed);
  assert.ok(redirecting);
  const fake = createFakeDocument({ failSubmission: true });
  assert.throws(
    () => submitPayHereHostedForm(fake.documentTarget, submission),
    /native submission failed/,
  );
  assert.equal(fake.removeCount, 1);
  const recovered = recoverPayHereRedirect(redirecting);
  assert.equal(recovered.phase, "confirmed");
  assert.equal(recovered.submission, submission);
});

test("TEST 5: double click initiates only one hosted submission", () => {
  const redirectLock = { current: false };
  const fake = createFakeDocument();
  for (let click = 0; click < 2; click += 1) {
    if (acquireCheckoutLock(redirectLock)) {
      submitPayHereHostedForm(fake.documentTarget, submission);
    }
  }
  assert.equal(fake.submitCount, 1);
  assert.equal(fake.createdForms.length, 1);
});

test("TEST 6: Bank Transfer keeps the offline checkout endpoint", async () => {
  const page = await readFile("src/customer-pages/CheckoutPage.tsx", "utf8");
  assert.match(
    page,
    /payment === "card"\s*\? "\/api\/payments\/payhere\/initiate"\s*: "\/api\/checkout"/,
  );
});

test("TEST 7: Cash on Delivery remains an offline completion path", async () => {
  const [page, route] = await Promise.all([
    readFile("src/customer-pages/CheckoutPage.tsx", "utf8"),
    readFile("src/app/api/checkout/route.ts", "utf8"),
  ]);
  assert.match(page, /payment === "cash_on_delivery"/);
  assert.match(route, /paymentMethod === "cash_on_delivery"/);
  assert.match(route, /mode =\s*parsed\.data\.paymentMethod === "cash_on_delivery" \? "cod" : "bank"/);
});

test("TEST 8: Sri Lanka Card skips only the UAE confirmation panel", async () => {
  const route = await readFile("src/app/api/checkout/route.ts", "utf8");
  const page = await readFile("src/customer-pages/CheckoutPage.tsx", "utf8");
  assert.match(route, /attempt\.source_currency === "AED"/);
  assert.match(page, /if \(result\.chargeSummary\)/);
  assert.match(page, /submitPayHereHostedForm\(document/);
});

test("TEST 9: AED order total converts to the approved whole-LKR charge", () => {
  const charge = calculateUaePayHereCharge(29.12, 95);
  assert.equal(charge, 2766);
  assert.equal(calculateUaePayHereCharge(32.3, 95), 3069);
  assert.equal(formatPayHereAmount(charge), "2766.00");
  assert.equal(submission.chargeSummary.sourceCurrency, "AED");
  assert.equal(submission.chargeSummary.chargeCurrency, "LKR");
});

test("TEST 10: displayed, hashed, and submitted amount use one exact string", async () => {
  const [page, route] = await Promise.all([
    readFile("src/customer-pages/CheckoutPage.tsx", "utf8"),
    readFile("src/app/api/checkout/route.ts", "utf8"),
  ]);
  const exactAmount = formatPayHereAmount(
    calculateUaePayHereCharge(29.12, 95),
  );
  assert.equal(submission.fields.amount, exactAmount);
  assert.match(page, /formatPayHereAmount\(payHereSubmission\.chargeSummary\.chargeAmount\)/);
  assert.match(route, /const amount = formatPayHereAmount\(chargeAmount\)/);
  assert.match(route, /createPayHereHash\([\s\S]*?amount,[\s\S]*?attempt\.charge_currency/);
  assert.match(route, /currency: attempt\.charge_currency,\s*amount,/);
});

test("PayHere ready state is deterministic", () => {
  const confirmed = setPayHereAcknowledged(
    requirePayHereConfirmation(submission),
    true,
  );
  assert.equal(confirmed.phase, "confirmed");
  assert.deepEqual(createReadyPayHereFlow(), {
    phase: "ready",
    submission: null,
  });
});

test("prepared PayHere confirmation freezes order-defining checkout inputs", async () => {
  const page = await readFile("src/customer-pages/CheckoutPage.tsx", "utf8");
  assert.match(page, /const checkoutDetailsLocked = submitting \|\| Boolean\(payHereSubmission\)/);
  assert.match(page, /<fieldset[\s\S]*?disabled=\{checkoutDetailsLocked\}/);
  assert.match(page, /name="termsAccepted" required disabled=\{checkoutDetailsLocked\}/);
  assert.doesNotMatch(page, /onChange=\{\(event\) => \{[\s\S]*?setPayHereFlow\(createReadyPayHereFlow\(\)\)/);
});

test("cart clearing waits until the browser leaves for PayHere", async () => {
  const page = await readFile("src/customer-pages/CheckoutPage.tsx", "utf8");
  assert.match(page, /window\.addEventListener\("pagehide", clearCartOnDeparture/);
  assert.match(page, /submitToPayHere\(redirectingFlow\.submission\)/);
  assert.doesNotMatch(page, /submitPayHereHostedForm\(document, redirectingFlow\.submission\);\s*clearCart\(\)/);
});

test("PayHere rejects any non-hosted checkout action", () => {
  const fake = createFakeDocument();
  assert.throws(
    () =>
      submitPayHereHostedForm(fake.documentTarget, {
        action: "https://example.com/pay/checkout",
        fields: submission.fields,
      }),
    /checkout URL is invalid/,
  );
  assert.equal(fake.submitCount, 0);
});
