import { requireStaff } from "@/lib/supabase/auth";
import { AdminLoadFailure } from "./components/AdminLoadFailure";
import { PageHeader } from "./components/PageHeader";
import { SkinConcernManager } from "./components/SkinConcernManager";
import { getSkinConcerns } from "./data";

export async function AdminSkinConcernsPage() {
  await requireStaff("/admin/skin-concerns");
  try {
    const concerns = await getSkinConcerns("/admin/skin-concerns");
    return <><PageHeader eyebrow="Catalog" title="Skin Concerns" description="Create, organize, and safely deactivate the concerns used by product pages and storefront filters." /><SkinConcernManager concerns={concerns} /></>;
  } catch (error) {
    return <AdminLoadFailure title="Skin concerns could not be loaded" detail={error instanceof Error ? error.message : "Unable to load skin concerns."} />;
  }
}
