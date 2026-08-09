export const PAYHERE_ACKNOWLEDGEMENT_FIELD =
  "payHereExchangeAcknowledged";

export type PayHereChargeSummary = {
  sourceCurrency: "AED";
  sourceAmount: number;
  chargeCurrency: "LKR";
  chargeAmount: number;
  exchangeRate: number;
  notice: string;
  rateSource?: string;
  rateEffectiveAt?: string;
  rateExpiresAt?: string;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  processingFee?: number;
  total?: number;
};

export type PayHerePostSubmission = {
  action: string;
  fields: Record<string, string>;
};

export type PayHereConfirmationSubmission = PayHerePostSubmission & {
  orderId: string;
  chargeSummary: PayHereChargeSummary;
};

export type PayHereRedirectingFlow = {
  phase: "redirecting";
  submission: PayHereConfirmationSubmission;
};

export type PayHereCheckoutFlow =
  | { phase: "ready"; submission: null }
  | { phase: "preparing"; submission: null }
  | {
      phase: "confirmation_required";
      submission: PayHereConfirmationSubmission;
    }
  | { phase: "confirmed"; submission: PayHereConfirmationSubmission }
  | PayHereRedirectingFlow;

export function createReadyPayHereFlow(): PayHereCheckoutFlow {
  return { phase: "ready", submission: null };
}

export function beginPayHerePreparation(): PayHereCheckoutFlow {
  return { phase: "preparing", submission: null };
}

export function requirePayHereConfirmation(
  submission: PayHereConfirmationSubmission,
): PayHereCheckoutFlow {
  return { phase: "confirmation_required", submission };
}

export function setPayHereAcknowledged(
  flow: PayHereCheckoutFlow,
  acknowledged: boolean,
): PayHereCheckoutFlow {
  if (
    flow.phase !== "confirmation_required" &&
    flow.phase !== "confirmed"
  ) {
    return flow;
  }

  return {
    phase: acknowledged ? "confirmed" : "confirmation_required",
    submission: flow.submission,
  };
}

export function beginPayHereRedirect(
  flow: PayHereCheckoutFlow,
): PayHereRedirectingFlow | null {
  if (flow.phase !== "confirmed") return null;
  return { phase: "redirecting", submission: flow.submission };
}

export function recoverPayHereRedirect(
  flow: PayHereCheckoutFlow,
): PayHereCheckoutFlow {
  if (flow.phase !== "redirecting") return flow;
  return { phase: "confirmed", submission: flow.submission };
}

export function acquireCheckoutLock(lock: { current: boolean }) {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

export function releaseCheckoutLock(lock: { current: boolean }) {
  lock.current = false;
}

const PAYHERE_HOSTED_CHECKOUT_URLS = new Set([
  "https://www.payhere.lk/pay/checkout",
  "https://sandbox.payhere.lk/pay/checkout",
]);

export function isPayHereHostedCheckoutUrl(action: string) {
  try {
    return PAYHERE_HOSTED_CHECKOUT_URLS.has(new URL(action).toString());
  } catch {
    return false;
  }
}

export function submitPayHereHostedForm(
  documentTarget: Pick<Document, "body" | "createElement">,
  submission: PayHerePostSubmission,
) {
  if (!isPayHereHostedCheckoutUrl(submission.action)) {
    throw new Error("The PayHere checkout URL is invalid.");
  }

  const form = documentTarget.createElement("form");
  form.method = "POST";
  form.action = submission.action;

  for (const [name, value] of Object.entries(submission.fields)) {
    const input = documentTarget.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  documentTarget.body.appendChild(form);
  try {
    form.submit();
  } catch (error) {
    form.remove();
    throw error;
  }

  return form;
}
