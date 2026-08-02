import { NextResponse } from "next/server";
import { z } from "zod";
import {
  inspectEmailConfiguration,
  getAdminNotificationEmail,
  sendTransactionalEmail,
} from "@/lib/email";
import { getStaffContext } from "@/lib/supabase/auth";
import { consumeRequestRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  destination: z.enum(["customer", "admin", "self"]).default("customer"),
});

export async function GET(request: Request) {
  const staff = await getStaffContext();
  if (!staff || staff.profile.role !== "admin")
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const rateLimit = await consumeRequestRateLimit(request, "admin-email-diagnostic", 10, 600);
  if (!rateLimit.allowed)
    return NextResponse.json({ error: "Email diagnostics are temporarily unavailable." }, { status: 503 });
  const { diagnostic } = inspectEmailConfiguration(process.env);
  return NextResponse.json(diagnostic);
}

export async function POST(request: Request) {
  const staff = await getStaffContext();
  if (!staff || staff.profile.role !== "admin")
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const rateLimit = await consumeRequestRateLimit(request, "admin-email-test", 5, 600);
  if (!rateLimit.allowed)
    return NextResponse.json({ error: "Email tests are temporarily unavailable." }, { status: 503 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid test destination." }, { status: 400 });

  const recipient =
    parsed.data.destination !== "admin"
      ? staff.email
      : getAdminNotificationEmail();
  if (!recipient)
    return NextResponse.json(
      { error: "The selected authorized test address is not configured." },
      { status: 503 },
    );

  const result = await sendTransactionalEmail({
    template: parsed.data.destination === "admin" ? "new_order_admin" : "new_order_customer",
    recipient,
    dedupeKey: `admin_email_test:${staff.userId}:${crypto.randomUUID()}`,
    subject: "YARA transactional email test",
    customerName: staff.profile.full_name || "YARA administrator",
    intro:
      "This authorized test confirms the YARA transactional email service can submit a responsive message through Resend.",
    details: [
      ["Environment", process.env.VERCEL_ENV || process.env.NODE_ENV || "local"],
      ["Template", "Operational test"],
    ],
    nextSteps:
      "Confirm the sender name and domain, reply to verify the reply-to address, and review the Resend delivery event.",
  });

  if (result.status !== "sent")
    return NextResponse.json(
      { error: `Email test was not sent (${result.status}).` },
      { status: 503 },
    );
  return NextResponse.json({
    status: "sent",
    template: parsed.data.destination === "admin" ? "new_order_admin" : "new_order_customer",
    providerEmailId: result.id,
    eventId: result.eventId,
  });
}
