import { Check, ChevronRight, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { createWhatsAppLink, formatPrice, getProductPrice, productOrderMessage } from "../lib/format";
import { useCountry } from "../context/CountryContext";
import { useCatalog } from "../context/CatalogContext";
import { useI18n } from "../i18n";
import { localizeProduct, localizeTaxonomy } from "../lib/storefront-localization";

export function ProductPage() {
  const { id } = useParams();
  const { products } = useCatalog();
  const product = products.find((item) => item.id === id || item.slug === id);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { country } = useCountry();
  const { locale, t } = useI18n();
  const displayProduct = product ? localizeProduct(product, locale) : null;

  const gallery = useMemo(() => product ? [product.gallery?.[0] ?? product.image, product.image, ...(product.gallery?.slice(1) ?? [])] : [], [product]);

  if (!product) {
    return <div className="page-shell py-28 text-center"><p className="eyebrow">{t("product.notFound")}</p><h1 className="mt-4 text-5xl">{t("product.notFoundTitle")}</h1><Link to="/shop" className="btn-primary mt-8">{t("product.returnToShop")}</Link></div>;
  }

  const handleAdd = () => {
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const related = products.filter((item) => item.id !== product.id && (item.category === product.category || item.concern === product.concern)).slice(0, 4);

  return (
    <div className="page-shell py-8 sm:py-12">
      <nav className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.12em] text-yara-taupe" aria-label={t("product.breadcrumb")}>
        <Link to="/shop">{t("nav.shop")}</Link><ChevronRight className="h-3 w-3" /><Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{localizeTaxonomy(product.category, locale)}</Link><ChevronRight className="h-3 w-3" /><span className="text-yara-wine">{displayProduct?.name}</span>
      </nav>

      <section className="mt-6 grid items-start gap-10 lg:grid-cols-[1.12fr_0.88fr] xl:gap-16">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.2rem] bg-yara-rose shadow-card sm:aspect-[5/4] lg:aspect-[4/5]">
            <img src={gallery[activeImage]} alt={t("product.imageAlt", { name: displayProduct?.name ?? product.name })} className="h-full w-full object-cover" />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              {displayProduct?.badge && <span className="rounded-full bg-[#fff1be] px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.11em]">{displayProduct.badge}</span>}
              <span className="rounded-full bg-white/85 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.11em]">{t("product.vegan")}</span>
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="hide-scrollbar mt-4 flex gap-3 overflow-x-auto">
              {gallery.map((image, index) => (
                <button key={image} onClick={() => setActiveImage(index)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-yara-rose sm:h-24 sm:w-28 ${activeImage === index ? "ring-2 ring-yara-wine ring-offset-2" : ""}`} aria-label={t("product.galleryImage", { count: index + 1 })}>
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-28">
          <p className="eyebrow">{displayProduct?.subtitle}</p>
          <h1 className="mt-3 text-balance text-4xl leading-tight sm:text-5xl">{displayProduct?.name}</h1>
          <div className="mt-4 flex items-center gap-3 text-xs"><span className="flex text-yara-gold">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}</span><span>{product.rating} · {product.reviews} {t("common.reviews")}</span></div>
          <div className="mt-6 flex items-end gap-2"><span className="font-serif text-4xl text-yara-wine">{country && formatPrice(getProductPrice(product, country), country)}</span><span className="pb-1 text-sm text-yara-taupe">/ {product.size}</span></div>
          <p className="mt-6 text-sm font-light leading-7 text-yara-taupe">{displayProduct?.description}</p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-full border border-yara-ink/20 bg-white p-1">
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid h-9 w-9 place-items-center rounded-full" aria-label={t("product.decrease")}><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button onClick={() => setQuantity((value) => value + 1)} className="grid h-9 w-9 place-items-center rounded-full" aria-label={t("product.increase")}><Plus className="h-4 w-4" /></button>
            </div>
            <span className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em]"><span className="h-2 w-2 rounded-full bg-green-500" /> {t("common.inStock")}</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button onClick={handleAdd} className="btn-primary w-full">{added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />} {added ? t("common.addedToBag") : t("common.addToCart")}</button>
            <button onClick={() => { addItem(product, quantity); navigate("/checkout"); }} className="btn-secondary w-full">{t("common.buyNow")}</button>
            {country && <a href={createWhatsAppLink(productOrderMessage(product, quantity, country, locale), country)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#20a852] px-6 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#168a43] transition hover:bg-[#eafff0] sm:col-span-2"><MessageCircle className="h-4 w-4" /> {t("common.whatsappOrder")}</a>}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-[0.62rem] uppercase tracking-[0.09em] text-yara-taupe">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-yara-wine" /> {t("common.countryWideDelivery")}</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-yara-wine" /> {t("common.secureCheckout")}</span>
          </div>

          <div className="mt-8 border-t border-yara-rose">
            <details open className="group border-b border-yara-rose py-5"><summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.13em]">{t("product.benefits")}</summary><ul className="mt-4 grid gap-3 text-sm font-light leading-6 text-yara-taupe">{displayProduct?.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-yara-wine" />{benefit}</li>)}</ul></details>
            <details className="border-b border-yara-rose py-5"><summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.13em]">{t("product.howToUse")}</summary><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{displayProduct?.howToUse}</p></details>
            <details className="border-b border-yara-rose py-5"><summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.13em]">{t("product.ingredients")}</summary><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{displayProduct?.ingredients}</p></details>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="text-center"><p className="eyebrow">{t("product.pairEyebrow")}</p><h2 className="mt-3 text-4xl sm:text-5xl">{t("product.pairTitle")}</h2></div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div>
      </section>
    </div>
  );
}
