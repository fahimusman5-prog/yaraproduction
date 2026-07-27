import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/supabase/auth";
import { getProducts } from "./data";
import { AdminLoadFailure } from "./components/AdminLoadFailure";
import { PageHeader } from "./components/PageHeader";
import { ProductsTable } from "./components/ProductsTable";
import { QueryToast } from "./components/QueryToast";

export async function AdminProductsPage() {
  await requireStaff("/admin/products");
  let products;
  try {
    products = await getProducts();
  } catch (error) {
    return <AdminLoadFailure title="Products could not be loaded" detail={error instanceof Error ? error.message : "Unable to load products."} />;
  }
  return <><Suspense><QueryToast /></Suspense><PageHeader eyebrow="Catalog" title="Products" description="Manage pricing, identifiers, stock thresholds, images, and availability." action={<Link href="/admin/products/new" className="staff-button staff-button-primary"><Plus className="h-4 w-4" />Add product</Link>} /><ProductsTable products={products} /></>;
}
