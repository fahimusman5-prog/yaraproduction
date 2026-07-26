import { useEffect, useRef, useState } from "react";
import { Check, Heart, LoaderCircle, PackageX, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { RegionalProductPrice } from "./RegionalProductPrice";
import { useCart } from "../context/CartContext";
import { useCountry } from "../context/CountryContext";
import { useI18n } from "../i18n";
import { localizeProduct } from "../lib/storefront-localization";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { country } = useCountry();
  const { locale, t } = useI18n();
  const displayProduct = localizeProduct(product, locale);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const addingTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const productPath = `/product/${product.slug || product.id}`;
  const outOfStock = product.stockQuantity === 0;

  useEffect(() => () => {
    if (addingTimerRef.current) window.clearTimeout(addingTimerRef.current);
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
  }, []);

  const handleAdd = () => {
    if (adding || outOfStock) return;
    setAdding(true);
    addItem(product);
    setAdded(true);
    addingTimerRef.current = window.setTimeout(() => setAdding(false), 260);
    successTimerRef.current = window.setTimeout(() => setAdded(false), 1500);
  };

  const cartButtonLabel = outOfStock
    ? `${displayProduct.name} is out of stock`
    : adding
      ? `Adding ${displayProduct.name} to cart`
      : added
        ? `${displayProduct.name} added to cart`
        : t("product.addNamedToCart", { name: displayProduct.name });

  return (
    <article className="group overflow-hidden rounded-[1.8rem] border border-white/80 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[1/1.02] overflow-hidden bg-yara-rose">
        <Link to={productPath} aria-label={t("common.viewProduct", { name: displayProduct.name })}>
          <img src={product.image} alt={t("product.imageAlt", { name: displayProduct.name })} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
        </Link>
        {displayProduct.badge && <span className="glass-panel absolute left-4 top-4 rounded-full px-3 py-1 text-[0.58rem] uppercase tracking-[0.12em] text-yara-wine">{displayProduct.badge}</span>}
        <button
          onClick={() => setSaved((value) => !value)}
          className="glass-icon absolute right-4 top-4 h-11 w-11"
          aria-label={saved ? t("product.removeFavorite", { name: displayProduct.name }) : t("product.addFavorite", { name: displayProduct.name })}
          aria-pressed={saved}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-yara-wine text-yara-wine" : ""}`} />
        </button>
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-full border border-yara-gold/70 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.1em] text-yara-taupe">{displayProduct.concern}</span>
          <span className="flex items-center gap-1 text-[0.63rem]"><Star className="h-3 w-3 fill-yara-gold text-yara-gold" /> {product.rating} ({product.reviews})</span>
        </div>
        <Link to={productPath}>
          <h3 className="text-xl leading-tight transition group-hover:text-yara-wine">{displayProduct.name}</h3>
          <p className="mt-1 text-xs font-light leading-5 text-yara-taupe">{displayProduct.subtitle}</p>
        </Link>
        <div className="mt-5 flex items-center justify-between gap-3">
          <RegionalProductPrice
            product={product}
            country={country}
            sellingClassName="font-serif text-lg font-semibold leading-tight text-yara-wine"
            originalClassName="mt-0.5 text-xs leading-tight text-yara-taupe"
          />
          <button onClick={handleAdd} disabled={adding || outOfStock} className="glass-icon-primary h-11 w-11 shrink-0" aria-label={cartButtonLabel} aria-busy={adding} aria-live="polite">
            {outOfStock ? <PackageX className="h-4 w-4" aria-hidden="true" /> : adding ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </article>
  );
}
