import { AdminOrderDetailPage } from "@/modules/admin/AdminOrderDetailPage";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminOrderDetailPage orderId={id} />; }
