import { useState } from "react";
import { Check, Heart, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatPrice, getProductPrice } from "../lib/format";
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
  const productPath = `/product/${product.slug || product.id}`;

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="group overflow-hidden rounded-[1.8rem] bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[1/1.02] overflow-hidden bg-yara-rose">
        <Link to={productPath} aria-label={t("common.viewProduct", { name: displayProduct.name })}>
          <img src={product.image} alt={t("product.imageAlt", { name: displayProduct.name })} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
        </Link>
        {displayProduct.badge && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.58rem] uppercase tracking-[0.12em] text-yara-wine backdrop-blur">{displayProduct.badge}</span>}
        <button
          onClick={() => setSaved((value) => !value)}
          className="absolute right-4 top-4 rounded-full bg-white/90 p-2.5 backdrop-blur transition hover:scale-105"
          aria-label={saved ? t("product.removeFavorite", { name: displayProduct.name }) : t("product.addFavorite", { name: displayProduct.name })}
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
          <span className="font-serif text-lg font-semibold text-yara-wine">{country && formatPrice(getProductPrice(product, country), country)}</span>
          <button onClick={handleAdd} disabled={product.stockQuantity === 0} className="grid h-10 w-10 place-items-center rounded-full bg-yara-wine text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40" aria-label={t("product.addNamedToCart", { name: displayProduct.name })}>
            {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
