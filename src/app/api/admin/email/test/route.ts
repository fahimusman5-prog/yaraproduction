import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminNotificationEmail,
  sendTransactionalEmail,
} from "@/lib/email";
import { getStaffContext } from "@/lib/supabase/auth";

const schema = z.object({
  destination: z.enum(["self", "admin"]).default("self"),
});

export async function POST(request: Request) {
  const staff = await getStaffContext();
  if (!staff || staff.profile.role !== "admin")
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid test destination." }, { status: 400 });

  const recipient =
    parsed.data.destination === "self"
      ? staff.email
      : getAdminNotificationEmail();
  if (!recipient)
    return NextResponse.json(
      { error: "The selected authorized test address is not configured." },
      { status: 503 },
    );

  const result = await sendTransactionalEmail({
    template: "order_processing",
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
  return NextResponse.json({ status: "sent", providerEmailId: result.id });
}
