import { CategoryManager } from "./components/CategoryManager";
import { requireStaff } from "@/lib/supabase/auth";
import { AdminLoadFailure } from "./components/AdminLoadFailure";
import { PageHeader } from "./components/PageHeader";
import { getCategories } from "./data";

export async function AdminCategoriesPage() {
  await requireStaff("/admin/categories");
  let categories;
  try {
    categories = await getCategories();
  } catch (error) {
    return <AdminLoadFailure title="Categories could not be loaded" detail={error instanceof Error ? error.message : "Unable to load categories."} />;
  }
  return <><PageHeader eyebrow="Catalog" title="Categories" description="Keep product organization simple and consistent across the storefront and POS." /><CategoryManager categories={categories} /></>;
}
