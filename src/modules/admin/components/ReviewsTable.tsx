"use client";

import { Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductReview } from "@/lib/supabase/types";
import { deleteReviewAction } from "../review-actions";
import { ConfirmActionButton } from "./ConfirmActionButton";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";

export function ReviewsTable({ reviews }: { reviews: ProductReview[] }) {
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState("all");
  const [status, setStatus] = useState("all");
  const products = useMemo(
    () =>
      Array.from(
        new Map(
          reviews.map((review) => [
            review.product_id,
            review.products?.name ?? "Unknown product",
          ]),
        ),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [reviews],
  );
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return reviews.filter(
      (review) =>
        (productId === "all" || review.product_id === productId) &&
        (status === "all" || review.status === status) &&
        `${review.customer_name} ${review.products?.name ?? ""} ${review.description}`
          .toLowerCase()
          .includes(normalizedQuery),
    );
  }, [reviews, productId, query, status]);

  return (
    <div className="staff-panel">
      <div className="flex flex-col gap-3 border-b border-[var(--staff-line)] p-4 lg:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search reviews</span>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="staff-input pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, product, or description"
          />
        </label>
        <label>
          <span className="sr-only">Filter reviews by product</span>
          <select
            aria-label="Filter reviews by product"
            className="staff-input lg:w-64"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            <option value="all">All products</option>
            {products.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter reviews by status</span>
          <select
            aria-label="Filter reviews by status"
            className="staff-input lg:w-44"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
      </div>
      {rows.length ? (
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Description</th>
                <th>Photos</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((review) => (
                <tr key={review.id}>
                  <td className="font-semibold">{review.customer_name}</td>
                  <td>{review.products?.name ?? "Unknown product"}</td>
                  <td>{"★".repeat(review.rating)}</td>
                  <td className="max-w-56 truncate text-slate-500">
                    {review.description}
                  </td>
                  <td className="staff-metric">
                    {review.product_review_images?.length ?? 0}
                  </td>
                  <td>
                    <StatusBadge value={review.status} />
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/reviews/${review.id}/edit`}
                        className="staff-button staff-button-secondary"
                        aria-label={`Edit review from ${review.customer_name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <ConfirmActionButton
                        action={deleteReviewAction.bind(null, review.id)}
                        label="Delete"
                        title="Delete this review?"
                        detail="The review and its stored photos will be permanently removed."
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No reviews found"
          detail="Adjust the filters or add the first customer review."
        />
      )}
    </div>
  );
}
