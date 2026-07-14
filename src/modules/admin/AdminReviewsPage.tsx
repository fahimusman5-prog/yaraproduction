import { Plus } from "lucide-react";
import Link from "next/link";
import { getReviews } from "./data";
import { PageHeader } from "./components/PageHeader";
import { ReviewsTable } from "./components/ReviewsTable";

export async function AdminReviewsPage() { const reviews = await getReviews(); return <><PageHeader eyebrow="Customer feedback" title="Reviews" description="Manage product-specific customer feedback and photo galleries." action={<Link href="/admin/reviews/new" className="staff-button staff-button-primary"><Plus className="h-4 w-4" />Add review</Link>} /><ReviewsTable reviews={reviews} /></>; }
