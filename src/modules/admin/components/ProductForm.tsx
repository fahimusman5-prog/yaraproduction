"use client";

import { useMemo, useActionState, useState } from "react";
import type { Category, Product, SkinConcern } from "@/lib/supabase/types";
import { createProductAction, updateProductAction } from "../actions";
import { initialActionState } from "../action-state";
import { ActionMessage } from "./ActionMessage";
import { SubmitButton } from "./SubmitButton";

export function ProductForm({
  categories,
  skinConcerns,
  product,
}: {
  categories: Category[];
  skinConcerns: SkinConcern[];
  product?: Product;
}) {
  const action = product ? updateProductAction.bind(null, product.id) : createProductAction;
  const [state, formAction] = useActionState(action, initialActionState);
  const selectedConcernIds = useMemo(
    () => new Set(product?.product_skin_concerns?.map((item) => item.skin_concerns?.id).filter(Boolean)),
    [product],
  );
  const [prices, setPrices] = useState({
    price_lkr: String(product?.price_lkr ?? 0),
    original_price_lkr: product?.original_price_lkr === null || product?.original_price_lkr === undefined ? "" : String(product.original_price_lkr),
    price_aed: String(product?.price_aed ?? 0),
    original_price_aed: product?.original_price_aed === null || product?.original_price_aed === undefined ? "" : String(product.original_price_aed),
  });
  const updatePrice = (field: keyof typeof prices, value: string) => {
    setPrices((current) => ({ ...current, [field]: value }));
  };
  const lkrComparison = compareOriginalPrice(prices.price_lkr, prices.original_price_lkr);
  const aedComparison = compareOriginalPrice(prices.price_aed, prices.original_price_aed);

  return (
    <form action={formAction} className="staff-panel space-y-7 p-5 sm:p-7" encType="multipart/form-data">
      <ActionMessage state={state} />

      <fieldset>
        <legend className="text-base font-bold">Product information</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="staff-label">Product name *</span>
            <input className="staff-input" name="name" required minLength={2} maxLength={160} defaultValue={product?.name} />
          </label>
          <label>
            <span className="staff-label">Slug</span>
            <input className="staff-input" name="slug" defaultValue={product?.slug} placeholder="Generated from name" />
          </label>
          <label>
            <span className="staff-label">Category</span>
            <select className="staff-input" name="category_id" defaultValue={product?.category_id ?? ""}>
              <option value="">Uncategorized</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="staff-label">Short description</span>
            <textarea className="staff-input min-h-28 resize-y" name="description" maxLength={5000} defaultValue={product?.description} />
          </label>
          <label>
            <span className="staff-label">Original Excel category</span>
            <input className="staff-input" name="original_category" maxLength={160} defaultValue={product?.original_category ?? ""} />
          </label>
          <label>
            <span className="staff-label">PDF source page</span>
            <input className="staff-input" name="pdf_source_page" maxLength={80} defaultValue={product?.pdf_source_page ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="staff-label">Product image</span>
            <input className="staff-input file:mr-4 file:rounded-lg file:border-0 file:bg-yara-rose file:px-3 file:py-1.5 file:font-semibold file:text-yara-wine" type="file" name="image" accept="image/jpeg,image/png,image/webp" />
            <span className="mt-1 block text-xs text-slate-500">JPG, PNG, or WebP up to 5 MB. Missing images use the storefront placeholder.</span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold">Product page content</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="staff-label">Benefits</span>
            <textarea className="staff-input min-h-36 resize-y" name="benefits" defaultValue={(product?.benefits ?? []).join("\n")} placeholder="One benefit per line" />
          </label>
          <label className="sm:col-span-2">
            <span className="staff-label">How to use</span>
            <textarea className="staff-input min-h-28 resize-y" name="how_to_use" maxLength={5000} defaultValue={product?.how_to_use ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="staff-label">Ingredients</span>
            <textarea className="staff-input min-h-28 resize-y" name="ingredients" maxLength={5000} defaultValue={product?.ingredients ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="staff-label">Caution</span>
            <textarea className="staff-input min-h-24 resize-y" name="caution" maxLength={2000} defaultValue={product?.caution ?? ""} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold">Skin concerns</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skinConcerns.map((concern) => (
            <label key={concern.id} className="flex items-center gap-3 rounded-xl border border-[var(--staff-line)] bg-white px-3 py-2 text-sm">
              <input type="checkbox" name="skin_concern_ids" value={concern.id} defaultChecked={selectedConcernIds.has(concern.id)} className="h-4 w-4 accent-yara-wine" />
              {concern.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold">Pricing and identification</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="staff-label">Sri Lanka Selling Price (LKR) *</span>
            <input className="staff-input" name="price_lkr" type="number" min="0" step="0.01" required value={prices.price_lkr} onChange={(event) => updatePrice("price_lkr", event.target.value)} />
          </label>
          <label>
            <span className="staff-label">Sri Lanka Original Price (LKR) — Optional</span>
            <input className="staff-input" name="original_price_lkr" type="number" min={prices.price_lkr || "0"} step="0.01" placeholder="Leave blank when not on special" value={prices.original_price_lkr} onChange={(event) => updatePrice("original_price_lkr", event.target.value)} aria-describedby="lkr-original-price-help" />
            <span id="lkr-original-price-help" className={`mt-1 block text-xs ${lkrComparison === "lower" ? "text-red-700" : lkrComparison === "equal" ? "text-amber-700" : "text-slate-500"}`}>
              {priceHelp(lkrComparison)}
            </span>
          </label>
          <label>
            <span className="staff-label">UAE Selling Price (AED) *</span>
            <input className="staff-input" name="price_aed" type="number" min="0" step="0.01" required value={prices.price_aed} onChange={(event) => updatePrice("price_aed", event.target.value)} />
          </label>
          <label>
            <span className="staff-label">UAE Original Price (AED) — Optional</span>
            <input className="staff-input" name="original_price_aed" type="number" min={prices.price_aed || "0"} step="0.01" placeholder="Leave blank when not on special" value={prices.original_price_aed} onChange={(event) => updatePrice("original_price_aed", event.target.value)} aria-describedby="aed-original-price-help" />
            <span id="aed-original-price-help" className={`mt-1 block text-xs ${aedComparison === "lower" ? "text-red-700" : aedComparison === "equal" ? "text-amber-700" : "text-slate-500"}`}>
              {priceHelp(aedComparison)}
            </span>
          </label>
          <label>
            <span className="staff-label">SKU *</span>
            <input className="staff-input" name="sku" required maxLength={80} defaultValue={product?.sku} />
          </label>
          <label>
            <span className="staff-label">Barcode</span>
            <input className="staff-input" name="barcode" maxLength={120} defaultValue={product?.barcode ?? ""} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold">Stock and availability</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <label>
            <span className="staff-label">Stock quantity *</span>
            <input className="staff-input" name="stock_quantity" type="number" min="0" step="1" required defaultValue={product?.stock_quantity ?? 0} />
          </label>
          <label>
            <span className="staff-label">Low stock alert *</span>
            <input className="staff-input" name="low_stock_alert" type="number" min="0" step="1" required defaultValue={product?.low_stock_alert ?? 5} />
          </label>
          <label>
            <span className="staff-label">Status *</span>
            <select className="staff-input" name="status" defaultValue={product?.status ?? "active"}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[var(--staff-line)] bg-white px-3 py-2 text-sm">
            <input type="checkbox" name="featured" value="true" defaultChecked={product?.featured ?? false} className="h-4 w-4 accent-yara-wine" />
            Featured product
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold">SEO</legend>
        <div className="mt-4 grid gap-5">
          <label>
            <span className="staff-label">SEO title</span>
            <input className="staff-input" name="seo_title" maxLength={180} defaultValue={product?.seo_title ?? ""} />
          </label>
          <label>
            <span className="staff-label">SEO meta description</span>
            <textarea className="staff-input min-h-24 resize-y" name="seo_description" maxLength={320} defaultValue={product?.seo_description ?? ""} />
          </label>
          <label>
            <span className="staff-label">Image status</span>
            <input className="staff-input" name="image_status" maxLength={240} defaultValue={product?.image_status ?? ""} />
          </label>
        </div>
      </fieldset>

      <div className="flex justify-end">
        <SubmitButton pendingLabel={product ? "Updating..." : "Creating..."}>{product ? "Update product" : "Create product"}</SubmitButton>
      </div>
    </form>
  );
}

type PriceComparison = "empty" | "lower" | "equal" | "higher";

function compareOriginalPrice(selling: string, original: string): PriceComparison {
  if (!original.trim()) return "empty";
  const sellingValue = Number(selling);
  const originalValue = Number(original);
  if (!Number.isFinite(sellingValue) || !Number.isFinite(originalValue)) return "empty";
  if (originalValue < sellingValue) return "lower";
  if (originalValue === sellingValue) return "equal";
  return "higher";
}

function priceHelp(comparison: PriceComparison) {
  if (comparison === "lower") return "Original price must be higher than the selling price.";
  if (comparison === "equal") return "Equal prices are saved, but no crossed-out price will appear publicly.";
  return "Shown as a crossed-out price only when it is higher than the selling price.";
}
