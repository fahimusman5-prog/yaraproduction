import { NextResponse } from "next/server";
import { verifyOrderPdfToken } from "@/lib/order-pdf-token";
import { loadOrderDocumentByNumber } from "@/lib/order-document";
import { generateOrderPdf } from "@/lib/order-pdf";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const verified = verifyOrderPdfToken(token);
  if (!verified) return NextResponse.json({ error: "This order document link is invalid or expired." }, { status: 403 });
  const order = await loadOrderDocumentByNumber(verified.orderNumber);
  if (!order) return NextResponse.json({ error: "Order document not found." }, { status: 404 });
  const pdf = generateOrderPdf(order);
  const filename = `YARA-Order-${order.orderNumber.replace(/[^a-zA-Z0-9._-]+/g, "-")}.pdf`;
  return new NextResponse(pdf as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${filename}"`, "Cache-Control": "private, no-store, max-age=0" } });
}
