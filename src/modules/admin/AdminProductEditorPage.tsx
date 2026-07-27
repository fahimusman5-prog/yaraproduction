import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/supabase/auth";
import { getCategories, getProduct, getSkinConcerns } from "./data";
import { AdminLoadFailure } from "./components/AdminLoadFailure";
import { PageHeader } from "./components/PageHeader";
import { ProductForm } from "./components/ProductForm";

export async function AdminProductEditorPage({ productId }: { productId?: string }) {
  await requireStaff(productId ? `/admin/products/${productId}/edit` : "/admin/products/new");
  let editorData;
  try {
    const [categories, skinConcerns, product] = await Promise.all([
      getCategories(),
      getSkinConcerns(productId ? `/admin/products/${productId}/edit` : "/admin/products/new"),
      productId ? getProduct(productId) : Promise.resolve(undefined),
    ]);
    editorData = { categories, skinConcerns, product };
  } catch (error) {
    return <AdminLoadFailure title="Product editor could not be loaded" detail={error instanceof Error ? error.message : "Unable to load the product editor."} />;
  }
  if (productId && !editorData.product) notFound();
  const { categories, skinConcerns } = editorData;
  const product = editorData.product ?? undefined;
  return <><PageHeader eyebrow="Catalog" title={product ? "Edit product" : "Add product"} description={product ? `Update ${product.name} without affecting its sales history.` : "Create a product record ready for online and POS sales."} action={<Link href="/admin/products" className="staff-button staff-button-secondary">Back to products</Link>} /><ProductForm categories={categories} skinConcerns={skinConcerns} product={product} /></>;
}
