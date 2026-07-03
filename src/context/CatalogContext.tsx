import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products as fallbackProducts } from "../data/products";
import type { Product } from "../types";

interface CatalogValue { products: Product[]; categories: string[]; loading: boolean; error: string | null }
const CatalogContext = createContext<CatalogValue | null>(null);

type CatalogRow = {
  id: string; name: string; slug: string; description: string; image_url: string | null;
  price_lkr: number | string; price_aed: number | string; stock_quantity: number;
  categories: { name: string } | null;
};

function mapProduct(row: CatalogRow): Product {
  const fallback = fallbackProducts.find((product) => product.id === row.slug);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: fallback?.subtitle ?? row.categories?.name ?? "YARA Collection",
    priceLKR: Number(row.price_lkr),
    priceAED: Number(row.price_aed),
    category: row.categories?.name ?? "Uncategorized",
    concern: row.categories?.name ?? "Beauty",
    image: row.image_url || fallback?.image || "",
    gallery: fallback?.gallery,
    badge: fallback?.badge,
    size: fallback?.size ?? "",
    rating: fallback?.rating ?? 0,
    reviews: fallback?.reviews ?? 0,
    description: row.description,
    benefits: fallback?.benefits ?? [],
    howToUse: fallback?.howToUse ?? "See the product packaging for directions.",
    ingredients: fallback?.ingredients ?? "See the product packaging for the complete ingredient list.",
    stockQuantity: row.stock_quantity,
  };
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<string[]>([...new Set(fallbackProducts.map((product) => product.category))]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/storefront/catalog", { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("Catalog unavailable"); return response.json(); })
      .then((payload) => { setProducts((payload.products as CatalogRow[]).map(mapProduct)); setCategories((payload.categories as Array<{ name: string }>).map((category) => category.name)); })
      .catch((reason) => { if (reason.name !== "AbortError") setError("Live inventory is temporarily unavailable."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  const value = useMemo(() => ({ products, categories, loading, error }), [products, categories, loading, error]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used within CatalogProvider");
  return value;
}
