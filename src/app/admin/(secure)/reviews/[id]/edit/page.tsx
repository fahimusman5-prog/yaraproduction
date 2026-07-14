import { AdminReviewEditorPage } from "@/modules/admin/AdminReviewEditorPage";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminReviewEditorPage reviewId={id} />; }
