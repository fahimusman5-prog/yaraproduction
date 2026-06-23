import { AdminProductEditorPage } from "@/modules/admin/AdminProductEditorPage";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminProductEditorPage productId={id} />; }
