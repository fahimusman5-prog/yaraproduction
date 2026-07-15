import { ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { useCatalog } from "../context/CatalogContext";

export function SkinConcernPage() {
  const { slug } = useParams();
  const { products, skinConcerns, loading } = useCatalog();
  const concern = skinConcerns.find((item) => item.slug === slug);
  const matchingProducts = concern ? products.filter((product) => product.concernSlugs?.includes(concern.slug)) : [];

  if (!concern && loading) return <div className="page-shell py-28 text-center"><p className="eyebrow">Loading collection</p><h1 className="mt-4 text-5xl">Preparing your skincare edit.</h1></div>;
  if (!concern) return <div className="page-shell py-28 text-center"><p className="eyebrow">Collection not found</p><h1 className="mt-4 text-5xl">This skin concern is unavailable.</h1><Link to="/shop" className="btn-primary mt-8">Explore all products</Link></div>;

  return (
    <div className="page-shell py-12 sm:py-16 lg:py-20">
      <header className="mx-auto max-w-3xl text-center"><p className="eyebrow">Shop by skin concern</p><h1 className="mt-4 text-balance text-4xl sm:text-6xl">{concern.name}</h1><p className="mt-5 text-sm font-light leading-7 text-yara-taupe">{concern.description || `Discover YARA products selected for ${concern.name.toLowerCase()}.`}</p><p className="mt-4 text-xs italic text-yara-taupe">{matchingProducts.length} product{matchingProducts.length === 1 ? "" : "s"}</p></header>
      {matchingProducts.length ? <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{matchingProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="surface-card mx-auto mt-12 max-w-2xl py-20 text-center"><h2 className="text-3xl">Products are coming soon</h2><p className="mt-3 text-sm text-yara-taupe">Explore the complete collection while we curate this concern.</p><Link to="/shop" className="btn-primary mt-6">Shop all <ArrowRight className="h-4 w-4" /></Link></div>}
    </div>
  );
}
