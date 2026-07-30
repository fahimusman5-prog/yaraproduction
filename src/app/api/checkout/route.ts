import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAppOrigin, getAppUrlIssues } from "@/lib/supabase/env";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
import {
  createPayHereHash,
  getPayHereCheckoutUrl,
  getPayHereConfig,
  getPayHereEnvironment,
} from "@/lib/payhere";
import { createOrderTrackingToken } from "@/lib/order-tracking";
import {
  getAdminNotificationEmail,
  sendOrderTransactionalEmail,
} from "@/lib/email";
import { consumeRequestRateLimit } from "@/lib/rate-limit";
import {
  PAYMENT_METHODS,
  hasUsableBankTransferDetails,
} from "@/lib/payment-methods";

const schema = z.object({
  country: z.enum(["sri-lanka", "uae"]),
  paymentMethod: z.enum(PAYMENT_METHODS),
  customer: z.object({
    name: z.string().trim().min(2).max(200),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().min(6).max(50),
    address: z.string().trim().min(5).max(500),
    city: z.string().trim().min(2).max(160),
    postalCode: z.string().trim().max(40),
  }),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive().max(1000) })).min(1).max(100),
  termsAccepted: z.literal(true),
  idempotencyKey: z.string().uuid(),
  couponCode: z.string().trim().max(40).optional(),
  bankTransactionReference: z.string().trim().max(200).optional(),
});

type CheckoutDatabaseError = { code?: string; message?: string; details?: string; hint?: string };

function checkoutErrorResponse(error: CheckoutDatabaseError) {
  const message = error.message ?? "";
  if (message === "A product is unavailable") {
    return { message: "A product in your cart is no longer available.", status: 409 };
  }
  if (message.startsWith("Insufficient stock for ")) {
    return { message, status: 409 };
  }
  if (
    message.includes("not available in your region") ||
    message.startsWith("Delivery fee will be confirmed") ||
    message.startsWith("Delivery is temporarily unavailable") ||
    message.startsWith("Delivery currency does not match")
  ) {
    return { message, status: 409 };
  }
  if (message === "Idempotency key is already in use.") {
    return { message: "This checkout request conflicts with an earlier order. Refresh the checkout and try again.", status: 409 };
  }
  if (message.startsWith("Coupon ") || message.startsWith("Order does not meet") || message === "Idempotent retry must use the original coupon.") {
    return { message, status: 409 };
  }
  const schemaUnavailable = ["42P01", "42703", "PGRST200", "PGRST205"].includes(error.code ?? "");
  return {
    message: messageFromSupabaseError(error, "Unable to start checkout.", {
      schemaUnavailable: "Checkout is temporarily unavailable.",
    }),
    status: schemaUnavailable ? 503 : 500,
  };
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "JSON request required." }, { status: 415 });
    }
    const rateLimit = await consumeRequestRateLimit(
      request,
      "checkout",
      5,
      600,
    );
    if (!rateLimit.allowed)
      return NextResponse.json(
        {
          error:
            rateLimit.reason === "limited"
              ? "Too many checkout attempts. Please wait before trying again."
              : "Checkout is temporarily unavailable.",
        },
        { status: rateLimit.reason === "limited" ? 429 : 503 },
      );
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid checkout." }, { status: 400 });
    const payHereConfig = getPayHereConfig();
    if (
      parsed.data.paymentMethod === "card" &&
      parsed.data.country === "uae" &&
      !payHereConfig.usdApproved
    ) {
      return NextResponse.json(
        {
          error:
            "Card payment is temporarily unavailable for UAE orders. Please select another option.",
        },
        { status: 503 },
      );
    }
    if (parsed.data.paymentMethod === "card" && !payHereConfig.enabled) {
      return NextResponse.json({ error: "Online payments are temporarily unavailable. Please choose another available ordering method." }, { status: 503 });
    }
    if (
      parsed.data.paymentMethod === "card" &&
      (!payHereConfig.merchantIdConfigured ||
        !payHereConfig.merchantSecretConfigured)
    ) {
      return NextResponse.json({ error: "Online payments are not configured yet." }, { status: 503 });
    }
    if (parsed.data.paymentMethod === "koko")
      return NextResponse.json(
        { error: "Koko is temporarily unavailable. Please select another option." },
        { status: 503 },
      );
    if (parsed.data.paymentMethod === "mintpay")
      return NextResponse.json(
        { error: "MintPay is temporarily unavailable. Please select another option." },
        { status: 503 },
      );
    const origin = getAppOrigin(request.url);
    if (!origin) {
      console.error("[storefront-checkout] Invalid application origin", getAppUrlIssues());
      return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
    }
    if (!process.env.ORDER_TRACKING_SECRET?.trim()) {
      console.error("[storefront-checkout] ORDER_TRACKING_SECRET is not configured.");
      return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
    }

    const supabase = getSupabaseAdminClient();
    if (parsed.data.paymentMethod === "bank_transfer") {
      const { data: bank, error: bankError } = await supabase
        .from("payment_method_settings")
        .select("account_holder_name,bank_name,account_number")
        .eq(
          "region_code",
          parsed.data.country === "sri-lanka" ? "LK" : "AE",
        )
        .eq("payment_method", "bank_transfer")
        .maybeSingle();
      const bankDetails = bank as {
        account_holder_name?: string | null;
        bank_name?: string | null;
        account_number?: string | null;
      } | null;
      if (
        bankError ||
        !hasUsableBankTransferDetails({
          accountHolderName: bankDetails?.account_holder_name,
          bankName: bankDetails?.bank_name,
          accountNumber: bankDetails?.account_number,
        })
      )
        return NextResponse.json(
          {
            error:
              "Bank transfer is temporarily unavailable. Please select another option.",
          },
          { status: 503 },
        );
    }
    const sessionClient = await getSupabaseServerClient();
    const { data: claimsData } = sessionClient ? await sessionClient.auth.getClaims() : { data: null };
    const customerUserId = claimsData?.claims?.sub;
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: CheckoutDatabaseError | null }>;
    // Supersedes create_storefront_order_with_coupon while preserving its
    // atomic coupon calculation inside the payment-aware database RPC.
    const { data, error } = await rpc("create_payment_order_with_coupon", {
      p_customer: parsed.data.customer,
      p_country: parsed.data.country,
      p_payment_method: parsed.data.paymentMethod,
      p_items: parsed.data.items,
      p_idempotency_key: parsed.data.idempotencyKey,
      p_customer_user_id: customerUserId ?? null,
      p_coupon_code: parsed.data.couponCode || null,
      p_bank_transaction_reference:
        parsed.data.bankTransactionReference || null,
      p_policy_acceptance: {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        versions: {
          terms: "2026-07-27",
          privacy: "2026-07-27",
          refunds: "2026-07-27",
          shipping: "2026-07-29",
        },
      },
    });
    if (error) {
      logSupabaseError("storefront-checkout", "create-order", error, {
        route: "/api/checkout",
        table: "orders",
      });
      const response = checkoutErrorResponse(error);
      return NextResponse.json({ error: response.message }, { status: response.status });
    }
    const order = (Array.isArray(data) ? data[0] : data) as { order_id: string; order_number: string; total_amount: number; currency: "LKR" | "AED"; created: boolean } | null;
    if (!order) {
      logSupabaseError("storefront-checkout", "read-created-order", new Error("Order RPC returned no data."), {
        route: "/api/checkout",
        table: "orders",
      });
      return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
    }
    if (order.created) {
      if (
        parsed.data.paymentMethod === "cash_on_delivery" ||
        parsed.data.paymentMethod === "bank_transfer")
      {
      const isBank = parsed.data.paymentMethod === "bank_transfer";
      const orderSummaryResult = await supabase
        .from("orders")
        .select(
          "country,currency,subtotal_amount,discount_amount,shipping_fee,payment_fee,total_amount,payment_status",
        )
        .eq("id", order.order_id)
        .maybeSingle();
      const summary = orderSummaryResult.data as {
        country?: string;
        currency?: string;
        subtotal_amount?: number;
        discount_amount?: number;
        shipping_fee?: number;
        payment_fee?: number;
        total_amount?: number;
        payment_status?: string;
      } | null;
      const money = (value: number | undefined) =>
        `${order.currency} ${Number(value ?? 0).toFixed(
          order.currency === "LKR" ? 0 : 2,
        )}`;
      const summaryDetails: Array<[string, string]> = [
        ["Order number", order.order_number],
        ["Region", parsed.data.country === "sri-lanka" ? "Sri Lanka" : "UAE"],
        ["Currency", order.currency],
        ["Subtotal", money(summary?.subtotal_amount)],
        ["Discount", money(summary?.discount_amount)],
        ["Shipping", money(summary?.shipping_fee)],
        ["Processing fee", money(summary?.payment_fee)],
        ["Grand total", money(summary?.total_amount ?? order.total_amount)],
      ];
      const bankSetting = isBank
        ? await supabase
            .from("payment_method_settings")
            .select(
              "account_holder_name,bank_name,branch_name,account_number,swift_code,instructions",
            )
            .eq(
              "region_code",
              parsed.data.country === "sri-lanka" ? "LK" : "AE",
            )
            .eq("payment_method", "bank_transfer")
            .eq("is_enabled", true)
            .maybeSingle()
        : null;
      const bank = bankSetting?.data as {
        account_holder_name?: string | null;
        bank_name?: string | null;
        branch_name?: string | null;
        account_number?: string | null;
        swift_code?: string | null;
        instructions?: string | null;
      } | null;
      const customerDetails: Array<[string, string]> = isBank
        ? ([
            ...summaryDetails,
            ["Payment method", "Bank Transfer"],
            ["Payment status", "Awaiting payment verification"],
            ["Amount to transfer", `${order.currency} ${Number(order.total_amount).toFixed(2)}`],
            ["Account holder", bank?.account_holder_name ?? ""],
            ["Bank", bank?.bank_name ?? ""],
            ["Branch", bank?.branch_name ?? ""],
            ["Account number", bank?.account_number ?? ""],
            ["SWIFT", bank?.swift_code ?? ""],
            ["Instructions", bank?.instructions ?? ""],
          ].filter((entry) => entry[1]) as Array<[string, string]>)
        : [
            ...summaryDetails,
            ["Payment method", "Cash on Delivery"],
            ["Payment status", "Payment due on delivery"],
            ["Amount to collect", `${order.currency} ${Number(order.total_amount).toFixed(2)}`],
          ];
      const adminDetails: Array<[string, string]> = [
        ...customerDetails,
        ["Customer address", `${parsed.data.customer.address}, ${parsed.data.customer.city} ${parsed.data.customer.postalCode}`.trim()],
        ["Contact number", parsed.data.customer.phone],
        ...(isBank && parsed.data.bankTransactionReference
          ? [["Transfer reference", parsed.data.bankTransactionReference] as [string, string]]
          : []),
      ];
      const deliveries = [
        sendOrderTransactionalEmail({
          template: "new_order_customer",
          recipient: parsed.data.customer.email,
          orderId: order.order_id,
          subject: isBank
            ? "Your YARA order has been received"
            : "Your YARA order is confirmed",
          intro:
            isBank
              ? "Your order has been received and is awaiting bank payment verification."
              : "Your cash-on-delivery order is confirmed.",
          nextSteps:
            isBank
              ? "Please complete the bank transfer using your order number as the reference."
              : "Payment will be collected when your order is delivered.",
          details: customerDetails,
        }),
      ];
      const adminEmail = getAdminNotificationEmail();
      if (adminEmail)
        deliveries.push(
          sendOrderTransactionalEmail({
            template: "new_order_admin",
            recipient: adminEmail,
            orderId: order.order_id,
            customerName: "YARA team",
            subject: `${isBank ? "New bank transfer" : "New COD"} order ${order.order_number}`,
            intro: isBank
              ? "A bank-transfer order is awaiting payment verification."
              : "A cash-on-delivery order is confirmed and requires fulfilment.",
            nextSteps:
              "Open the YARA admin workspace to verify the order, stock, payment method, and delivery details.",
            details: adminDetails,
          }),
        );
        await Promise.all(deliveries);
      }
    }
    let trackingToken: string;
    try {
      trackingToken = createOrderTrackingToken(order.order_id, order.order_number);
    } catch (error) {
      logSupabaseError("storefront-checkout", "create-tracking-token", error, { route: "/api/checkout" });
      return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
    }

    if (
      parsed.data.paymentMethod === "cash_on_delivery" ||
      parsed.data.paymentMethod === "bank_transfer"
    ) {
      const mode =
        parsed.data.paymentMethod === "cash_on_delivery" ? "cod" : "bank";
      return NextResponse.json({ orderId: order.order_id, totalAmount: Number(order.total_amount), redirectUrl: `${origin}/payment/success?order=${order.order_id}&token=${encodeURIComponent(trackingToken)}&${mode}=1` });
    }

    const prepared = await rpc("prepare_payhere_payment_attempt", {
      p_order_id: order.order_id,
      p_environment: getPayHereEnvironment(),
      p_allow_usd:
        parsed.data.country === "uae" && payHereConfig.usdApproved,
    });
    if (prepared.error) {
      logSupabaseError(
        "storefront-checkout",
        "prepare-payhere-attempt",
        prepared.error,
        { route: "/api/payments/payhere/initiate", table: "payment_attempts" },
      );
      return NextResponse.json(
        {
          error:
            parsed.data.country === "uae"
              ? "Card payment is temporarily unavailable for UAE orders. Please select Cash on Delivery or Bank Transfer."
              : "Card payment is temporarily unavailable. Please select another option.",
        },
        { status: 503 },
      );
    }
    const attempt = (
      Array.isArray(prepared.data) ? prepared.data[0] : prepared.data
    ) as {
      provider_order_id: string;
      source_currency: "LKR" | "AED";
      source_amount: number;
      charge_currency: "LKR" | "USD";
      charge_amount: number;
      locked_exchange_rate: number;
      exchange_rate_source: string;
      exchange_rate_effective_at: string;
    } | null;
    if (!attempt)
      return NextResponse.json(
        { error: "Unable to prepare card payment." },
        { status: 500 },
      );
    const amount = Number(attempt.charge_amount).toFixed(2);
    const { merchantId, hash } = createPayHereHash(
      attempt.provider_order_id,
      amount,
      attempt.charge_currency,
    );
    const [firstName, ...rest] = parsed.data.customer.name.split(/\s+/);
    return NextResponse.json({
      orderId: order.order_id,
      totalAmount: Number(order.total_amount),
      action: getPayHereCheckoutUrl(),
      fields: {
        merchant_id: merchantId,
        return_url: `${origin}/payment/success?order=${order.order_id}&token=${encodeURIComponent(trackingToken)}`,
        cancel_url: `${origin}/payment/failure?order=${order.order_id}&token=${encodeURIComponent(trackingToken)}`,
        notify_url: `${origin}/api/payments/payhere/notify`,
        order_id: attempt.provider_order_id,
        items: `YARA order ${order.order_number}`,
        currency: attempt.charge_currency,
        amount,
        first_name: firstName,
        last_name: rest.join(" ") || "-",
        email: parsed.data.customer.email,
        phone: parsed.data.customer.phone,
        address: parsed.data.customer.address,
        city: parsed.data.customer.city,
        country: parsed.data.country === "sri-lanka" ? "Sri Lanka" : "United Arab Emirates",
        hash,
      },
      chargeSummary:
        attempt.source_currency === "AED"
          ? {
              sourceCurrency: "AED",
              sourceAmount: Number(attempt.source_amount),
              chargeCurrency: "USD",
              chargeAmount: Number(attempt.charge_amount),
              exchangeRate: Number(attempt.locked_exchange_rate),
              rateSource: attempt.exchange_rate_source,
              rateEffectiveAt: attempt.exchange_rate_effective_at,
              notice:
                "PayHere will process this payment in USD. Your card issuer may apply its own foreign-currency or international transaction fee.",
            }
          : undefined,
    });
  } catch (error) {
    logSupabaseError("storefront-checkout", "initiate-checkout", error, { route: "/api/checkout" });
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
