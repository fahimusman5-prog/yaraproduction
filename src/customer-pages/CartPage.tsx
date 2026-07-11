import { ArrowRight, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { cartOrderMessage, createWhatsAppLink, formatPrice, getProductPrice } from "../lib/format";
import { useCountry } from "../context/CountryContext";
import { useI18n } from "../i18n";
import { localizeProduct } from "../lib/storefront-localization";

export function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { country } = useCountry();
  const { locale, t } = useI18n();
  const total = subtotal;

  if (!items.length) {
    return (
      <div className="page-shell py-24 text-center sm:py-36">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-yara-rose"><ShoppingBag className="h-8 w-8 text-yara-wine" /></div>
        <p className="eyebrow mt-7">{t("cart.emptyEyebrow")}</p><h1 className="mt-3 text-4xl sm:text-5xl">{t("cart.emptyTitle")}</h1><p className="mx-auto mt-4 max-w-md text-sm font-light leading-7 text-yara-taupe">{t("cart.emptyCopy")}</p><Link to="/shop" className="btn-primary mt-8">{t("cart.discover")} <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  return (
    <div className="page-shell py-12 sm:py-20">
      <p className="eyebrow">{t("cart.eyebrow")}</p><h1 className="mt-3 text-4xl sm:text-5xl">{t("cart.title")}</h1>
      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {items.map(({ product, quantity }) => {
            const displayProduct = localizeProduct(product, locale);
            return (
            <article key={product.id} className="surface-card grid grid-cols-[100px_1fr] gap-4 p-4 sm:grid-cols-[150px_1fr] sm:gap-6 sm:p-5">
              <Link to={`/product/${product.slug || product.id}`} className="overflow-hidden rounded-[1.3rem] bg-yara-rose"><img src={product.image} alt={t("product.imageAlt", { name: displayProduct.name })} className="aspect-square h-full w-full object-cover" /></Link>
              <div className="flex min-w-0 flex-col justify-between py-1">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[0.58rem] uppercase tracking-[0.13em] text-yara-wine">{displayProduct.category}</p><Link to={`/product/${product.slug || product.id}`}><h2 className="mt-1 text-xl sm:text-2xl">{displayProduct.name}</h2></Link><p className="mt-1 text-xs text-yara-taupe">{product.size}</p></div>
                  <button onClick={() => removeItem(product.id)} className="glass-icon h-9 w-9 text-yara-taupe hover:text-yara-wine" aria-label={t("cart.remove", { name: displayProduct.name })}><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="glass-panel flex items-center rounded-full p-0.5"><button onClick={() => updateQuantity(product.id, quantity - 1)} className="glass-icon h-8 w-8" aria-label={t("product.decrease")}><Minus className="h-3.5 w-3.5" /></button><span className="w-7 text-center text-xs">{quantity}</span><button onClick={() => updateQuantity(product.id, quantity + 1)} className="glass-icon h-8 w-8" aria-label={t("product.increase")}><Plus className="h-3.5 w-3.5" /></button></div>
                  <p className="font-serif text-xl font-semibold text-yara-wine">{country && formatPrice(getProductPrice(product, country) * quantity, country)}</p>
                </div>
              </div>
            </article>
          );})}
          <Link to="/shop" className="inline-flex items-center gap-2 pt-3 text-xs font-semibold uppercase tracking-[0.13em] text-yara-wine">← {t("common.continueShopping")}</Link>
        </div>

        <aside className="surface-card p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="text-3xl">{t("common.orderSummary")}</h2>
          <div className="mt-6 space-y-4 border-b border-yara-rose pb-6 text-sm"><div className="flex justify-between"><span className="text-yara-taupe">{t("common.subtotal")}</span><span>{country && formatPrice(subtotal, country)}</span></div><div className="flex justify-between"><span className="text-yara-taupe">{t("common.shipping")}</span><span>{t("common.confirmedWhenOrdering")}</span></div></div>
          <div className="mt-6 flex items-end justify-between"><span className="font-serif text-2xl">{t("common.productTotal")}</span><span className="font-serif text-3xl text-yara-wine">{country && formatPrice(total, country)}</span></div>
          <Link to="/checkout" className="btn-primary mt-7 w-full">{t("common.secureCheckout")} <ArrowRight className="h-4 w-4" /></Link>
          {country && <a href={createWhatsAppLink(cartOrderMessage(items, total, country, {}, locale), country)} target="_blank" rel="noreferrer" className="glass-control mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 border-[#20a852]/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#168a43]"><MessageCircle className="h-4 w-4" /> {t("common.orderOnWhatsApp")}</a>}
          <p className="mt-5 text-center text-[0.6rem] uppercase tracking-[0.1em] text-yara-taupe">{t("common.securePayments")}</p>
        </aside>
      </div>
    </div>
  );
}
