import { Check, ChevronRight, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { RegionalProductPrice } from "../components/RegionalProductPrice";
import { useCart } from "../context/CartContext";
import { createWhatsAppLink, productOrderMessage } from "../lib/format";
import { useCountry } from "../context/CountryContext";
import { useCatalog } from "../context/CatalogContext";
import { findProductByRouteKey } from "../lib/product-routing";
import { ProductReviews } from "../components/ProductReviews";

export function ProductPage() {
  const { id: productKey } = useParams();
  const { products, loading } = useCatalog();
  const product = findProductByRouteKey(products, productKey);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { country } = useCountry();

  const gallery = useMemo(() => product ? Array.from(new Set([product.gallery?.[0] ?? product.image, product.image, ...(product.gallery?.slice(1) ?? [])])) : [], [product]);

  if (!product && loading) {
    return <div className="page-shell py-28 text-center"><p className="eyebrow">Loading product</p><h1 className="mt-4 text-5xl">Preparing your product details.</h1></div>;
  }

  if (!product) {
    return <div className="page-shell py-28 text-center"><p className="eyebrow">Product not found</p><h1 className="mt-4 text-5xl">This product has wandered off.</h1><Link to="/shop" className="btn-primary mt-8">Return to shop</Link></div>;
  }

  const handleAdd = () => {
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const productConcerns = product.concerns?.length ? product.concerns : [product.concern];
  const productConcernLinks = productConcerns.map((name, index) => ({ name, slug: product.concernSlugs?.[index] }));
  const related = products.filter((item) => {
    const itemConcerns = item.concerns?.length ? item.concerns : [item.concern];
    return item.id !== product.id && (item.category === product.category || itemConcerns.some((itemConcern) => productConcerns.includes(itemConcern)));
  }).slice(0, 4);

  return (
    <div className="page-shell py-8 sm:py-12">
      <nav className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.12em] text-yara-taupe" aria-label="Breadcrumb">
        <Link to="/shop">Shop</Link><ChevronRight className="h-3 w-3" /><Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link><ChevronRight className="h-3 w-3" /><span className="text-yara-wine">{product.name}</span>
      </nav>

      <section className="mt-6 grid items-start gap-10 lg:grid-cols-[1.12fr_0.88fr] xl:gap-16">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.2rem] bg-yara-rose shadow-card sm:aspect-[5/4] lg:aspect-[4/5]">
            <img src={gallery[activeImage]} alt={product.name} className="h-full w-full object-cover" />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              {product.badge && <span className="rounded-full bg-[#fff1be] px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.11em]">{product.badge}</span>}
              <span className="rounded-full bg-white/85 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.11em]">Vegan</span>
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="hide-scrollbar mt-4 flex gap-3 overflow-x-auto">
              {gallery.map((image, index) => (
                <button key={`${image}-${index}`} onClick={() => setActiveImage(index)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-yara-rose sm:h-24 sm:w-28 ${activeImage === index ? "ring-2 ring-yara-wine ring-offset-2" : ""}`} aria-label={`View product image ${index + 1}`}>
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-28">
          <p className="eyebrow">{product.subtitle}</p>
          <h1 className="mt-3 text-balance text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="rounded-full bg-yara-rose px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-yara-wine">{product.category}</Link>
            {productConcernLinks.map((item) => <Link key={item.slug ?? item.name} to={item.slug ? `/skin-concerns/${item.slug}` : `/shop?concern=${encodeURIComponent(item.name)}`} className="rounded-full border border-yara-gold/70 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-yara-taupe">{item.name}</Link>)}
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs"><span className="flex text-yara-gold">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}</span><span>{product.rating} · {product.reviews} reviews</span></div>
          <div className="mt-6 flex items-end gap-2">
            <RegionalProductPrice
              product={product}
              country={country}
              sellingClassName="font-serif text-4xl leading-none text-yara-wine"
              originalClassName="mt-2 text-base leading-none text-yara-taupe"
            />
            <span className="pb-1 text-sm text-yara-taupe">/ {product.size}</span>
          </div>
          <p className="mt-6 text-sm font-light leading-7 text-yara-taupe">{product.description}</p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <div className="glass-panel flex items-center rounded-full p-1">
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="glass-icon h-9 w-9" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button onClick={() => setQuantity((value) => value + 1)} className="glass-icon h-9 w-9" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
            </div>
            <span className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em]"><span className="h-2 w-2 rounded-full bg-green-500" /> In stock & ready to ship</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button onClick={handleAdd} className="btn-primary w-full">{added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />} {added ? "Added to bag" : "Add to cart"}</button>
            <button onClick={() => { addItem(product, quantity); navigate("/checkout"); }} className="btn-secondary w-full">Buy now</button>
            {country && <a href={createWhatsAppLink(productOrderMessage(product, quantity, country), country)} target="_blank" rel="noreferrer" className="glass-control inline-flex min-h-11 items-center justify-center gap-2 border-[#20a852]/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#168a43] sm:col-span-2"><MessageCircle className="h-4 w-4" /> WhatsApp order</a>}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-[0.62rem] uppercase tracking-[0.09em] text-yara-taupe">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-yara-wine" /> Country-wide delivery</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-yara-wine" /> Secure checkout</span>
          </div>

          <div className="mt-8 border-t border-yara-rose">
            <details open className="group border-b border-yara-rose py-5"><summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.13em]">Benefits</summary><ul className="mt-4 grid gap-3 text-sm font-light leading-6 text-yara-taupe">{product.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-yara-wine" />{benefit}</li>)}</ul></details>
            <details className="border-b border-yara-rose py-5"><summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.13em]">How to use</summary><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{product.howToUse}</p></details>
            <details className="border-b border-yara-rose py-5"><summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.13em]">Full ingredients</summary><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{product.ingredients}</p></details>
            {product.caution && <details className="border-b border-yara-rose py-5"><summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.13em]">Caution</summary><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{product.caution}</p></details>}
          </div>
        </div>
      </section>

      <ProductReviews productId={product.id} />

      <section className="py-20 sm:py-28">
        <div className="text-center"><p className="eyebrow">Pair it beautifully</p><h2 className="mt-3 text-4xl sm:text-5xl">Complete Your Routine</h2></div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div>
      </section>
    </div>
  );
}
