import { notFound } from "next/navigation";
import Link from "next/link";
import { getProducts, getReview } from "./data";
import { PageHeader } from "./components/PageHeader";
import { ReviewForm } from "./components/ReviewForm";

export async function AdminReviewEditorPage({ reviewId }: { reviewId?: string }) { const [products, loadedReview] = await Promise.all([getProducts(), reviewId ? getReview(reviewId) : Promise.resolve(undefined)]); if (reviewId && !loadedReview) notFound(); const review = loadedReview ?? undefined; return <><PageHeader eyebrow="Customer feedback" title={review ? "Edit review" : "Add review"} description="Every review is linked to one product and needs three to five customer photos." action={<Link href="/admin/reviews" className="staff-button staff-button-secondary">Back to reviews</Link>} /><ReviewForm products={products} review={review} /></>; }
