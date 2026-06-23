import { CategoryManager } from "./components/CategoryManager";
import { PageHeader } from "./components/PageHeader";
import { getCategories } from "./data";

export async function AdminCategoriesPage() { const categories = await getCategories(); return <><PageHeader eyebrow="Catalog" title="Categories" description="Keep product organization simple and consistent across the storefront and POS." /><CategoryManager categories={categories} /></>; }
