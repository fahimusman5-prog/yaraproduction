import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log";
import { sendOrderTransactionalEmail } from "@/lib/email";

const itemSchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.number().int().positive().max(1000),
  reason: z.enum([
    "damaged",
    "defective",
    "incorrect_item",
    "unopened_return",
    "other",
  ]),
  note: z.string().trim().max(1000).default(""),
});
const metadataSchema = z.object({
  orderId: z.string().uuid(),
  note: z.string().trim().max(2000).default(""),
  items: z.array(itemSchema).min(1).max(100),
});

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maxFileBytes = 5 * 1024 * 1024;
const maxFiles = 5;

function databaseMessage(error: { message?: string }) {
  const message = error.message ?? "";
  if (
    message.includes("return window") ||
    message.includes("after delivery") ||
    message.includes("remaining eligible") ||
    message.includes("return item")
  )
    return message;
  return "The return request could not be submitted.";
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("multipart/form-data"))
    return NextResponse.json(
      { error: "Multipart form data is required." },
      { status: 415 },
    );
  try {
    const session = await getSupabaseServerClient();
    const { data: claims } = session
      ? await session.auth.getClaims()
      : { data: null };
    const userId = claims?.claims?.sub;
    const email = claims?.claims?.email;
    if (!session || !userId || typeof email !== "string")
      return NextResponse.json(
        { error: "Sign in to request a return." },
        { status: 401 },
      );

    const formData = await request.formData();
    let rawMetadata: unknown = null;
    try {
      rawMetadata = JSON.parse(String(formData.get("metadata") ?? "null"));
    } catch {
      return NextResponse.json(
        { error: "Check the return request." },
        { status: 400 },
      );
    }
    const metadata = metadataSchema.safeParse(rawMetadata);
    if (!metadata.success)
      return NextResponse.json(
        {
          error:
            metadata.error.issues[0]?.message ?? "Check the return request.",
        },
        { status: 400 },
      );
    const files = formData
      .getAll("evidence")
      .filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length > maxFiles)
      return NextResponse.json(
        { error: `Upload no more than ${maxFiles} evidence images.` },
        { status: 400 },
      );
    for (const file of files) {
      if (!allowedTypes.has(file.type) || file.size > maxFileBytes)
        return NextResponse.json(
          {
            error:
              "Evidence must be a JPG, PNG, or WebP image no larger than 5 MB.",
          },
          { status: 400 },
        );
    }

    const admin = getSupabaseAdminClient();
    const rpc = admin.rpc.bind(admin) as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message?: string } | null }>;
    const created = await rpc("create_item_return_request", {
      p_order_id: metadata.data.orderId,
      p_customer_user_id: userId,
      p_customer_email: email,
      p_customer_note: metadata.data.note,
      p_items: metadata.data.items,
    });
    if (created.error) {
      logSupabaseError("customer-returns", "create-return", created.error, {
        route: "/api/returns",
        table: "return_requests",
        userId,
      });
      return NextResponse.json(
        { error: databaseMessage(created.error) },
        { status: 409 },
      );
    }
    const returnId = String(created.data);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const extension = allowedTypes.get(file.type);
        const path = `${userId}/${returnId}/${crypto.randomUUID()}.${extension}`;
        const upload = await admin.storage
          .from("return-evidence")
          .upload(path, file, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          });
        if (upload.error) throw upload.error;
        uploaded.push(path);
      }
      if (uploaded.length) {
        const evidence = await admin.from("return_images").insert(
          uploaded.map((storagePath, index) => ({
            return_request_id: returnId,
            storage_path: storagePath,
            original_filename: files[index].name.slice(0, 255),
            content_type: files[index].type,
            size_bytes: files[index].size,
            uploaded_by: userId,
          })),
        );
        if (evidence.error) throw evidence.error;
      }
    } catch (uploadError) {
      if (uploaded.length)
        await admin.storage.from("return-evidence").remove(uploaded);
      await admin.from("return_requests").delete().eq("id", returnId);
      logSupabaseError("customer-returns", "save-evidence", uploadError, {
        route: "/api/returns",
        table: "return_images",
        userId,
      });
      return NextResponse.json(
        {
          error:
            "Evidence could not be uploaded. No return request was retained.",
        },
        { status: 503 },
      );
    }

    await sendOrderTransactionalEmail({
      template: "return_requested",
      recipient: email,
      orderId: metadata.data.orderId,
      dedupeKey: `return_requested:${returnId}`,
      subject: "Your YARA return request was received",
      intro:
        "We received your item-level return request for review. It has not been automatically approved.",
      nextSteps:
        "YARA will review each requested item and contact you with the next step.",
    });
    return NextResponse.json(
      {
        id: returnId,
        message: "Return request submitted for review.",
      },
      { status: 201 },
    );
  } catch (error) {
    logSupabaseError("customer-returns", "submit", error, {
      route: "/api/returns",
      table: "return_requests",
    });
    return NextResponse.json(
      { error: "The return request could not be submitted." },
      { status: 500 },
    );
  }
}
