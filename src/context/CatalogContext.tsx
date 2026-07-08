import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products as fallbackProducts } from "../data/products";
import type { Product } from "../types";

interface CatalogValue { products: Product[]; categories: string[]; skinConcerns: string[]; loading: boolean; error: string | null }
const CatalogContext = createContext<CatalogValue | null>(null);
const placeholderImage = "/images/yara-product-placeholder.svg";

type CatalogRow = {
  id: string; name: string; slug: string; description: string; image_url: string | null;
  price_lkr: number | string; price_aed: number | string; stock_quantity: number;
  benefits?: string[] | null; how_to_use?: string | null; ingredients?: string | null; caution?: string | null;
  seo_title?: string | null; seo_description?: string | null; original_category?: string | null; featured?: boolean | null;
  categories: { name: string } | null;
  product_skin_concerns?: Array<{ skin_concerns: { name: string; slug: string } | null }> | null;
};

function mapProduct(row: CatalogRow): Product {
  const fallback = fallbackProducts.find((product) => product.id === row.slug);
  const concerns = row.product_skin_concerns?.map((item) => item.skin_concerns?.name).filter((name): name is string => Boolean(name)) ?? [];
  const primaryConcern = concerns[0] ?? fallback?.concern ?? row.categories?.name ?? "Beauty";
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.original_category || fallback?.subtitle || row.categories?.name || "YARA Collection",
    priceLKR: Number(row.price_lkr),
    priceAED: Number(row.price_aed),
    category: row.categories?.name ?? "Uncategorized",
    concern: primaryConcern,
    concerns,
    image: row.image_url || fallback?.image || placeholderImage,
    gallery: fallback?.gallery,
    badge: row.featured ? "Featured" : fallback?.badge,
    size: fallback?.size ?? "",
    rating: fallback?.rating ?? 0,
    reviews: fallback?.reviews ?? 0,
    description: row.description,
    benefits: row.benefits?.length ? row.benefits : fallback?.benefits ?? [],
    howToUse: row.how_to_use || fallback?.howToUse || "See the product packaging for directions.",
    ingredients: row.ingredients || fallback?.ingredients || "See the product packaging for the complete ingredient list.",
    caution: row.caution || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    stockQuantity: row.stock_quantity,
  };
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<string[]>([...new Set(fallbackProducts.map((product) => product.category))]);
  const [skinConcerns, setSkinConcerns] = useState<string[]>([...new Set(fallbackProducts.flatMap((product) => product.concerns?.length ? product.concerns : [product.concern]))]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/storefront/catalog", { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("Catalog unavailable"); return response.json(); })
      .then((payload) => {
        setProducts((payload.products as CatalogRow[]).map(mapProduct));
        setCategories((payload.categories as Array<{ name: string }>).map((category) => category.name));
        setSkinConcerns((payload.skinConcerns as Array<{ name: string }>).map((concern) => concern.name));
      })
      .catch((reason) => { if (reason.name !== "AbortError") setError("Live inventory is temporarily unavailable."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  const value = useMemo(() => ({ products, categories, skinConcerns, loading, error }), [products, categories, skinConcerns, loading, error]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used within CatalogProvider");
  return value;
}
