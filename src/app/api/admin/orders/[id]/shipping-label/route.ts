import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/supabase/auth";
import { getOrder } from "@/modules/admin/data";
import { generateShippingLabel } from "@/lib/shipping-label/generateShippingLabel";
import { normalizeOrderForLabel } from "@/lib/shipping-label/normalizeOrderForLabel";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff(`/admin/orders/${id}`);
  try {
    const result = await getOrder(id);
    if (!result) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const label = normalizeOrderForLabel(result.order as unknown as Record<string, unknown>, result.items as unknown as Record<string, unknown>[]);
    const pdf = generateShippingLabel(label);
    const filename = `YARA-Shipping-Label-${label.orderNumber.replace(/[^a-zA-Z0-9._-]+/g, "-")}.pdf`;
    return new NextResponse(pdf as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[shipping-label] generation failed", error);
    return NextResponse.json({ error: "Unable to generate label. Please try again." }, { status: 500 });
  }
}
