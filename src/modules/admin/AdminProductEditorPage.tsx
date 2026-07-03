import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getCategories, getProduct } from "./data";
import { PageHeader } from "./components/PageHeader";
import { ProductForm } from "./components/ProductForm";

export async function AdminProductEditorPage({ productId }: { productId?: string }) {
  const categories = await getCategories(); let product;
  if (productId) {
    if (!z.string().uuid().safeParse(productId).success) {
      console.error("[admin:product-editor] Invalid product ID", { productId });
      notFound();
    }
    try { product = await getProduct(productId); } catch (error) { console.error("[admin:product-editor] Product load failed", { productId, error }); notFound(); }
  }
  return <><PageHeader eyebrow="Catalog" title={product ? "Edit product" : "Add product"} description={product ? `Update ${product.name} without affecting its sales history.` : "Create a product record ready for online and POS sales."} action={<Link href="/admin/products" className="staff-button staff-button-secondary">Back to products</Link>} /><ProductForm categories={categories} product={product} /></>;
}
