import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Heart, LoaderCircle, PackageX, ShoppingBag, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Product } from "../types";
import { RegionalProductPrice } from "./RegionalProductPrice";
import { useCart } from "../context/CartContext";
import { useCountry } from "../context/CountryContext";
import { useI18n } from "../i18n";
import { localizeProduct } from "../lib/storefront-localization";
import { isProductAvailableInRegion } from "../lib/shipping";

export function ProductCard({ product, mobileCompact = false }: { product: Product; mobileCompact?: boolean }) {
  const { addItem } = useCart();
  const { country } = useCountry();
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const displayProduct = localizeProduct(product, locale);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const addingTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const productPath = `/product/${product.slug || product.id}`;
  const outOfStock = product.stockQuantity === 0;
  const unavailable = country
    ? !isProductAvailableInRegion(product, country)
    : false;

  useEffect(() => () => {
    if (addingTimerRef.current) window.clearTimeout(addingTimerRef.current);
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
  }, []);

  const handleAdd = () => {
    if (adding || added || outOfStock || unavailable) return;
    setAdding(true);
    addItem(product);
    setAdded(true);
    addingTimerRef.current = window.setTimeout(() => setAdding(false), 260);
    successTimerRef.current = window.setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (adding || added || outOfStock || unavailable) return;
    addItem(product);
    navigate("/checkout");
  };

  const cartButtonLabel = outOfStock || unavailable
    ? `${displayProduct.name} is out of stock`
    : adding
      ? `Adding ${displayProduct.name} to cart`
      : added
        ? `${displayProduct.name} added to cart`
        : t("product.addNamedToCart", { name: displayProduct.name });

  return (
    <article className={`product-card group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.8rem] border border-white/80 bg-white shadow-card transition duration-300 md:hover:-translate-y-1 md:hover:shadow-soft ${mobileCompact ? "shop-product-card" : ""}`}>
      <div className="product-card-media shop-product-media relative aspect-square overflow-hidden bg-yara-blush" aria-busy={!imageLoaded}>
        {!imageLoaded && <span className="product-card-skeleton absolute inset-0 animate-pulse bg-yara-rose/60" aria-hidden="true" />}
        <Link to={productPath} aria-label={t("common.viewProduct", { name: displayProduct.name })} className="block h-full w-full">
          <img
            src={imageFailed ? "/images/yara-product-placeholder.svg" : product.image}
            alt={t("product.imageAlt", { name: displayProduct.name })}
            className={`product-card-image relative h-full w-full object-contain object-center p-3 transition duration-700 md:group-hover:scale-[1.035] ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
            onLoad={() => setImageLoaded(true)}
            onError={() => { setImageFailed(true); setImageLoaded(true); }}
          />
        </Link>
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {displayProduct.badge ? <span className="glass-panel max-w-[calc(100%-3rem)] truncate rounded-full px-2.5 py-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-yara-wine" title={displayProduct.badge}>{displayProduct.badge}</span> : <span />}
          <button
            type="button"
            onClick={() => setSaved((value) => !value)}
            className="glass-icon pointer-events-auto grid min-h-11 min-w-11 shrink-0 place-items-center"
            aria-label={saved ? t("product.removeFavorite", { name: displayProduct.name }) : t("product.addFavorite", { name: displayProduct.name })}
            aria-pressed={saved}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-yara-wine text-yara-wine" : ""}`} />
          </button>
        </div>
      </div>
      <div className="product-card-body shop-product-body flex flex-1 flex-col p-4 sm:p-6">
        <div className="shop-product-meta mb-3 flex items-center gap-2">
          <span className="max-w-full truncate rounded-full border border-yara-gold/70 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.09em] text-yara-taupe" title={displayProduct.concern}>{displayProduct.concern}</span>
          <span className="mobile-card-rating ml-auto flex shrink-0 items-center gap-1 text-[0.63rem] text-yara-taupe"><Star className="h-3 w-3 fill-yara-gold text-yara-gold" /> {product.rating}</span>
        </div>
        <Link to={productPath} className="block" title={displayProduct.name}>
          <h3 className="product-card-title text-lg leading-tight transition group-hover:text-yara-wine sm:text-xl">{displayProduct.name}</h3>
          <p className="mt-1 line-clamp-1 text-xs font-light leading-5 text-yara-taupe">{displayProduct.subtitle}</p>
        </Link>
        <div className="mt-auto pt-5">
          <div className="shop-product-price flex items-baseline justify-between gap-2">
            <RegionalProductPrice
              product={product}
              country={country}
              sellingClassName="font-serif text-lg font-semibold leading-tight text-yara-wine sm:text-xl"
              originalClassName="mt-0.5 text-xs leading-tight text-yara-taupe"
            />
            <span className="mobile-card-size truncate text-[0.62rem] text-yara-taupe">{product.size}</span>
          </div>
          {country && <p className={`mt-2 text-[0.68rem] ${unavailable ? "text-red-700" : "text-yara-taupe"}`}>{unavailable ? "Unavailable in this region" : "Fixed delivery fee for the entire country."}</p>}
          <div className="shop-product-actions mt-3 grid gap-2">
            <button type="button" onClick={handleBuyNow} disabled={outOfStock || unavailable || adding || added} className="product-card-buy btn-primary w-full" aria-label={`${t("common.buyNow")}: ${displayProduct.name}`}>
              {outOfStock || unavailable ? <PackageX className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {outOfStock ? "Sold out" : unavailable ? "Unavailable" : t("common.buyNow")}
            </button>
            <button type="button" onClick={handleAdd} disabled={adding || added || outOfStock || unavailable} className="product-card-cart btn-secondary w-full" aria-label={cartButtonLabel} aria-busy={adding} aria-live="polite">
              {outOfStock ? <PackageX className="h-4 w-4" aria-hidden="true" /> : adding ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
              {outOfStock || unavailable ? "Unavailable" : adding ? "Adding" : added ? t("common.addedToBag") : t("common.addToCart")}
            </button>
          </div>
          <span className="sr-only" aria-live="polite">{added ? `${displayProduct.name} added to cart.` : ""}</span>
        </div>
      </div>
    </article>
  );
}
