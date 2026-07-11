import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import type { Category } from "../types";
import { useCountry } from "../context/CountryContext";
import { getProductPrice } from "../lib/format";
import { useCatalog } from "../context/CatalogContext";

export function ShopPage() {
  const { products, categories: catalogCategories, skinConcerns: catalogSkinConcerns } = useCatalog();
  const categories: Array<"All" | Category> = ["All", ...catalogCategories];
  const { country } = useCountry();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const requestedCategory = searchParams.get("category") as Category | null;
  const requestedConcern = searchParams.get("concern");
  const [category, setCategory] = useState<"All" | Category>(requestedCategory ?? "All");
  const [concern, setConcern] = useState(requestedConcern ?? "All");
  const [sort, setSort] = useState("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => setCategory(requestedCategory ?? "All"), [requestedCategory]);
  useEffect(() => setConcern(requestedConcern ?? "All"), [requestedConcern]);

  const concerns = ["All", ...catalogSkinConcerns];
  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const filtered = products.filter((product) =>
      (category === "All" || product.category === category) &&
      (concern === "All" || product.concern === concern || product.concerns?.includes(concern)) &&
      (!normalizedQuery || `${product.name} ${product.subtitle} ${product.category} ${product.concern} ${(product.concerns ?? []).join(" ")}`.toLowerCase().includes(normalizedQuery))
    );
    return [...filtered].sort((a, b) => {
      if (sort === "price-low" && country) return getProductPrice(a, country) - getProductPrice(b, country);
      if (sort === "price-high" && country) return getProductPrice(b, country) - getProductPrice(a, country);
      if (sort === "rating") return b.rating - a.rating;
      return Number(Boolean(b.badge)) - Number(Boolean(a.badge));
    });
  }, [products, category, concern, country, query, sort]);

  const updateCategory = (nextCategory: "All" | Category) => {
    setCategory(nextCategory);
    const next = new URLSearchParams(searchParams);
    if (nextCategory === "All") next.delete("category"); else next.set("category", nextCategory);
    setSearchParams(next);
  };

  const updateConcern = (nextConcern: string) => {
    setConcern(nextConcern);
    const next = new URLSearchParams(searchParams);
    if (nextConcern === "All") next.delete("concern"); else next.set("concern", nextConcern);
    setSearchParams(next);
  };

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next);
  };

  const filters = (
    <div className="space-y-8">
      <div>
        <h2 className="eyebrow">Category</h2>
        <div className="mt-5 grid gap-3">
          {categories.map((item) => (
            <label key={item} className="flex cursor-pointer items-center gap-3 text-sm font-light">
              <input type="radio" name="category" checked={category === item} onChange={() => updateCategory(item)} className="h-4 w-4 accent-yara-wine" /> {item}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h2 className="eyebrow">Skin concern</h2>
        <div className="mt-5 grid gap-3">
          {concerns.map((item) => (
            <label key={item} className="flex cursor-pointer items-center gap-3 text-sm font-light">
              <input type="radio" name="concern" checked={concern === item} onChange={() => updateConcern(item)} className="h-4 w-4 accent-yara-wine" /> {item}
            </label>
          ))}
        </div>
      </div>
      <div className="glass-panel rounded-[1.7rem] p-6">
        <p className="font-serif text-lg">Join the Inner Circle</p><p className="mt-2 text-xs font-light leading-5 text-yara-taupe">Early access to products and private offers.</p><button className="btn-primary mt-5 w-full">Subscribe</button>
      </div>
    </div>
  );

  return (
    <div className="page-shell py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">The YARA collection</p><h1 className="mt-4 text-4xl sm:text-5xl">Shop YARA</h1><p className="mt-5 text-sm font-light leading-7 text-yara-taupe">Browse our complete collection and find the products that suit your skincare and beauty needs.</p>
      </div>

      {query && <div className="glass-panel mx-auto mt-8 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs">Results for “{query}” <button onClick={clearSearch} className="glass-icon h-6 w-6" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button></div>}

      <div className="mt-12 grid gap-10 lg:grid-cols-[220px_1fr] xl:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <div>
          <div className="glass-panel mb-7 flex items-center justify-between gap-3 rounded-full px-5 py-3.5 sm:px-6">
            <p className="text-xs italic text-yara-taupe">Showing {visibleProducts.length} product{visibleProducts.length === 1 ? "" : "s"}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setFiltersOpen(true)} className="glass-control flex min-h-9 items-center gap-2 px-3 py-1.5 text-xs lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-full bg-white/45 px-3 py-2 text-xs sm:text-sm" aria-label="Sort products">
                <option value="recommended">Recommended</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="rating">Top rated</option>
              </select>
            </div>
          </div>
          {visibleProducts.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          ) : (
            <div className="surface-card py-24 text-center"><h2 className="text-3xl">No product found</h2><p className="mt-3 text-sm text-yara-taupe">Try a different category or search phrase.</p><button onClick={() => { updateCategory("All"); updateConcern("All"); clearSearch(); }} className="btn-primary mt-6">Reset filters</button></div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[60] bg-yara-ink/25 backdrop-blur-sm lg:hidden" onClick={() => setFiltersOpen(false)}>
          <aside className="glass-panel ml-auto h-full w-[88%] max-w-sm overflow-y-auto rounded-none p-7" onClick={(event) => event.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between"><h2 className="text-2xl">Refine products</h2><button onClick={() => setFiltersOpen(false)} className="glass-icon h-10 w-10" aria-label="Close filters"><X className="h-5 w-5" /></button></div>
            {filters}
            <button className="btn-primary mt-8 w-full" onClick={() => setFiltersOpen(false)}>View {visibleProducts.length} products</button>
          </aside>
        </div>
      )}
    </div>
  );
}
