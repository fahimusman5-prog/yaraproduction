"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError, messageFromSupabaseError } from "@/lib/supabase/log";
import type { ActionState } from "./action-state";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const reviewSchema = z.object({ product_id: z.string().uuid(), customer_name: z.string().trim().min(2).max(100), rating: z.coerce.number().int().min(1).max(5), description: z.string().trim().min(2).max(800), status: z.enum(["published", "hidden"]) });
const uuid = z.string().uuid();
const accepted = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

function files(formData: FormData) { return formData.getAll("review_photos").filter((value): value is File => value instanceof File && value.size > 0); }
async function validatePhoto(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase(); const expected = accepted.get(file.type);
  if (!expected || extension !== expected && !(expected === "jpg" && extension === "jpeg")) throw new Error("Use JPG, JPEG, PNG, or WebP review photos.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Each review photo must be 5 MB or smaller.");
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const valid = file.type === "image/jpeg" ? header[0] === 0xff && header[1] === 0xd8 : file.type === "image/png" ? header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47 : header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;
  if (!valid) throw new Error("One of the review photos is empty or not a valid image.");
  return expected;
}
function retainIds(formData: FormData) { return formData.getAll("retained_image_ids").map(String).filter((id) => uuid.safeParse(id).success); }
function refreshReviews(productId?: string) { revalidatePath("/admin/reviews"); revalidatePath("/shop"); revalidatePath("/api/storefront/catalog"); if (productId) revalidatePath(`/product/${productId}`); }

async function uploadPhotos(reviewId: string, productId: string, photos: File[]) {
  const supabase = getSupabaseAdminClient(); const uploaded: string[] = [];
  try { for (const [index, photo] of photos.entries()) { const extension = await validatePhoto(photo); const path = `${productId}/${reviewId}/${crypto.randomUUID()}.${extension}`; const { error } = await supabase.storage.from("product-reviews").upload(path, photo, { contentType: photo.type, upsert: false }); if (error) throw error; uploaded.push(path); } return uploaded; }
  catch (error) { if (uploaded.length) await supabase.storage.from("product-reviews").remove(uploaded); throw error; }
}

export async function createReviewAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin("/admin/reviews/new"); const parsed = reviewSchema.safeParse(Object.fromEntries(formData.entries())); const photos = files(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the review details." }; if (photos.length < 3 || photos.length > 5) return { status: "error", message: "Add between 3 and 5 review photos." };
  const supabase = getSupabaseAdminClient(); let reviewId: string | null = null; let paths: string[] = [];
  try {
    const { data, error } = await supabase.from("product_reviews").insert({ ...parsed.data, status: "hidden" }).select("id").single(); if (error) throw error; reviewId = String(data.id);
    paths = await uploadPhotos(reviewId, parsed.data.product_id, photos);
    const { error: imageError } = await supabase.from("product_review_images").insert(paths.map((storage_path, sort_order) => ({ review_id: reviewId, storage_path, sort_order }))); if (imageError) throw imageError;
    const { error: updateError } = await supabase.from("product_reviews").update({ status: parsed.data.status }).eq("id", reviewId); if (updateError) throw updateError;
  } catch (error) {
    if (paths.length) await supabase.storage.from("product-reviews").remove(paths); if (reviewId) await supabase.from("product_reviews").delete().eq("id", reviewId);
    logSupabaseError("admin-review-create", "create-review", error, { route: "/admin/reviews/new", table: "product_reviews", userId: staff.userId, productId: parsed.data?.product_id }); return { status: "error", message: messageFromSupabaseError(error, "Unable to create review.") };
  }
  refreshReviews(parsed.data.product_id); return { status: "success", message: "Review created." };
}

export async function updateReviewAction(reviewId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireAdmin(`/admin/reviews/${reviewId}/edit`); if (!uuid.safeParse(reviewId).success) return { status: "error", message: "Review not found." };
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData.entries())); const newPhotos = files(formData); const keep = retainIds(formData); if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the review details." };
  const supabase = getSupabaseAdminClient(); const { data: current, error: currentError } = await supabase.from("product_reviews").select("product_id,product_review_images(id,storage_path)").eq("id", reviewId).maybeSingle();
  if (currentError || !current) return { status: "error", message: currentError ? messageFromSupabaseError(currentError, "Unable to load review.") : "Review not found." };
  const existing = ((current as { product_review_images?: Array<{ id: string; storage_path: string }> }).product_review_images ?? []); const retained = existing.filter((image) => keep.includes(image.id)); const total = retained.length + newPhotos.length;
  if (total < 3 || total > 5) return { status: "error", message: "A review must keep between 3 and 5 photos." };
  let uploaded: string[] = [];
  try {
    uploaded = await uploadPhotos(reviewId, parsed.data.product_id, newPhotos);
    const stale = existing.filter((image) => !keep.includes(image.id));
    if (stale.length) { const { error } = await supabase.from("product_review_images").delete().in("id", stale.map((image) => image.id)); if (error) throw error; await supabase.storage.from("product-reviews").remove(stale.map((image) => image.storage_path)); }
    if (uploaded.length) { const { error } = await supabase.from("product_review_images").insert(uploaded.map((storage_path, index) => ({ review_id: reviewId, storage_path, sort_order: retained.length + index }))); if (error) throw error; }
    for (const [sort_order, imageId] of keep.entries()) { const { error } = await supabase.from("product_review_images").update({ sort_order }).eq("id", imageId).eq("review_id", reviewId); if (error) throw error; }
    const { error } = await supabase.from("product_reviews").update({ ...parsed.data, status: "hidden" }).eq("id", reviewId); if (error) throw error;
    const { error: publishError } = await supabase.from("product_reviews").update({ status: parsed.data.status }).eq("id", reviewId); if (publishError) throw publishError;
  } catch (error) { if (uploaded.length) await supabase.storage.from("product-reviews").remove(uploaded); logSupabaseError("admin-review-update", "update-review", error, { route: `/admin/reviews/${reviewId}/edit`, table: "product_reviews", userId: staff.userId, reviewId, productId: parsed.data.product_id }); return { status: "error", message: messageFromSupabaseError(error, "Unable to update review.") }; }
  refreshReviews(parsed.data.product_id); return { status: "success", message: "Review updated." };
}

export async function deleteReviewAction(reviewId: string) {
  const staff = await requireAdmin("/admin/reviews"); if (!uuid.safeParse(reviewId).success) throw new Error("Review not found."); const supabase = getSupabaseAdminClient();
  const { data: review, error } = await supabase.from("product_reviews").select("product_id,product_review_images(storage_path)").eq("id", reviewId).maybeSingle(); if (error || !review) throw new Error(error ? messageFromSupabaseError(error, "Unable to load review.") : "Review not found.");
  const paths = ((review as { product_review_images?: Array<{ storage_path: string }> }).product_review_images ?? []).map((image) => image.storage_path); const { error: deleteError } = await supabase.from("product_reviews").delete().eq("id", reviewId); if (deleteError) { logSupabaseError("admin-review-delete", "delete-review", deleteError, { route: "/admin/reviews", table: "product_reviews", userId: staff.userId, reviewId }); throw new Error(messageFromSupabaseError(deleteError, "Unable to delete review.")); }
  if (paths.length) { const { error: storageError } = await supabase.storage.from("product-reviews").remove(paths); if (storageError) logSupabaseError("review-image-delete", "delete-review-images", storageError, { route: "/admin/reviews", table: "storage.objects", userId: staff.userId, reviewId }); }
  refreshReviews(String((review as { product_id: string }).product_id));
}
