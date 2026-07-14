import { ArrowRight, Banknote, CreditCard, LockKeyhole, MessageCircle, ShieldCheck, Truck, UserRound } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { cartOrderMessage, createWhatsAppLink, formatPrice } from "../lib/format";
import { RegionalProductPrice } from "../components/RegionalProductPrice";
import { useCountry } from "../context/CountryContext";
import { useI18n } from "../i18n";
import { localizeProduct } from "../lib/storefront-localization";

type PaymentMethod = "payhere" | "cod";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { country } = useCountry();
  const { locale, t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [payment, setPayment] = useState<PaymentMethod>("payhere");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const total = subtotal;
  const hasLiveCatalogItems = items.every(({ product }) => uuidPattern.test(product.id));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!country || submitting) return;
    if (!hasLiveCatalogItems) {
      setError(t("checkout.catalogUnavailable"));
      return;
    }
    setSubmitting(true); setError("");
    try {
      const data = new FormData(event.currentTarget);
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        country, paymentMethod: payment,
        customer: { name: `${data.get("firstName") ?? ""} ${data.get("lastName") ?? ""}`.trim(), email: data.get("email"), phone: data.get("phone"), address: data.get("address"), city: data.get("city"), postalCode: data.get("postalCode") },
        items: items.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t("checkout.error"));
      clearCart();
      if (result.redirectUrl) { window.location.assign(result.redirectUrl); return; }
      const form = document.createElement("form"); form.method = "POST"; form.action = result.action;
      Object.entries(result.fields as Record<string, string>).forEach(([name, value]) => { const input = document.createElement("input"); input.type = "hidden"; input.name = name; input.value = value; form.appendChild(input); });
      document.body.appendChild(form); form.submit();
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("checkout.error")); setSubmitting(false); }
  };

  const handleWhatsAppOrder = () => {
    if (!country || !formRef.current) return;
    const requiredCustomerFields = ["firstName", "lastName", "address", "city", "postalCode", "phone"];
    for (const fieldName of requiredCustomerFields) {
      const field = formRef.current.elements.namedItem(fieldName) as HTMLInputElement | null;
      if (field && !field.reportValidity()) return;
    }
    const data = new FormData(formRef.current);
    const customer = {
      name: `${data.get("firstName") ?? ""} ${data.get("lastName") ?? ""}`.trim(),
      phone: String(data.get("phone") ?? ""),
      address: [data.get("address"), data.get("city"), data.get("postalCode")].filter(Boolean).join(", ")
    };
    window.open(createWhatsAppLink(cartOrderMessage(items, total, country, { ...customer, paymentMethod: t(payment === "payhere" ? "checkout.payhere" : "checkout.cod") }, locale), country), "_blank", "noopener,noreferrer");
  };

  if (!items.length) {
    return <div className="page-shell py-28 text-center"><p className="eyebrow">{t("checkout.emptyEyebrow")}</p><h1 className="mt-4 text-5xl">{t("checkout.emptyTitle")}</h1><Link to="/shop" className="btn-primary mt-8">{t("checkout.browse")}</Link></div>;
  }

  return (
    <div className="page-shell py-12 sm:py-20">
      <p className="eyebrow">{t("checkout.eyebrow")}</p><h1 className="mt-3 text-4xl sm:text-5xl">{t("checkout.title")}</h1><p className="mt-3 text-sm font-light text-yara-taupe">{t("checkout.copy")}</p>
      <form ref={formRef} onSubmit={handleSubmit} className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_390px] xl:gap-10">
        <div className="space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-2xl sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-full bg-yara-rose text-yara-wine"><UserRound className="h-4 w-4" /></span> {t("checkout.contact")}</h2>
            <label className="mt-7 block"><span className="field-label">{t("layout.emailAddress")}</span><input type="email" name="email" required autoComplete="email" placeholder={t("checkout.emailPlaceholder")} className="field" /></label>
            <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-yara-taupe"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-yara-wine" /> {t("checkout.keepUpdated")}</label>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-2xl sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-full bg-yara-rose text-yara-wine"><Truck className="h-4 w-4" /></span> {t("checkout.shippingAddress")}</h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label><span className="field-label">{t("checkout.firstName")}</span><input name="firstName" required autoComplete="given-name" className="field" /></label>
              <label><span className="field-label">{t("checkout.lastName")}</span><input name="lastName" required autoComplete="family-name" className="field" /></label>
              <label className="sm:col-span-2"><span className="field-label">{t("checkout.street")}</span><input name="address" required autoComplete="street-address" className="field" /></label>
              <label><span className="field-label">{t("checkout.city")}</span><input name="city" required autoComplete="address-level2" className="field" /></label>
              <label><span className="field-label">{t("checkout.postal")}</span><input name="postalCode" required autoComplete="postal-code" className="field" /></label>
              <label className="sm:col-span-2"><span className="field-label">{t("checkout.phone")}</span><input type="tel" name="phone" required autoComplete="tel" className="field" /></label>
            </div>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-2xl sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-full bg-yara-rose text-yara-wine"><CreditCard className="h-4 w-4" /></span> {t("checkout.payment")}</h2>
            <div className="mt-7 space-y-3">
              <label className={`block cursor-pointer rounded-[1.7rem] border p-5 transition ${payment === "payhere" ? "border-yara-wine bg-yara-blush" : "border-yara-rose"}`}>
                <span className="flex items-center gap-3 text-sm"><input type="radio" name="payment" checked={payment === "payhere"} onChange={() => setPayment("payhere")} className="accent-yara-wine" /><CreditCard className="h-4 w-4 text-yara-wine" /> {t("checkout.payhere")}</span>
                {payment === "payhere" && <span className="mt-3 block text-xs leading-5 text-yara-taupe">{t("checkout.payhereCopy")}</span>}
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-full border p-5 text-sm transition ${payment === "cod" ? "border-yara-wine bg-yara-blush" : "border-yara-rose"}`}><input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} className="accent-yara-wine" /><Banknote className="h-4 w-4 text-yara-wine" /> {t("checkout.cod")}</label>
            </div>
          </section>
        </div>

        <aside className="surface-card p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="text-3xl">{t("common.orderSummary")}</h2>
          <div className="mt-6 space-y-5">
            {items.map(({ product, quantity }) => {
              const displayProduct = localizeProduct(product, locale);
              return (
              <div key={product.id} className="flex gap-3"><img src={product.image} alt="" className="h-16 w-16 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium uppercase tracking-[0.07em]">{displayProduct.name}</p><p className="mt-1 text-xs text-yara-taupe">{product.size} · {t("common.quantity")}: {quantity}</p></div><RegionalProductPrice product={product} country={country} quantity={quantity} className="flex shrink-0 flex-col items-end" sellingClassName="text-sm leading-tight text-yara-wine" originalClassName="mt-0.5 text-[0.68rem] leading-tight text-yara-taupe" /></div>
            );})}
          </div>
          <div className="mt-6 border-y border-yara-rose py-5 text-sm"><div className="flex justify-between py-1.5"><span className="text-yara-taupe">{t("common.subtotal")}</span><span>{country && formatPrice(subtotal, country)}</span></div><div className="flex justify-between py-1.5"><span className="text-yara-taupe">{t("common.shipping")}</span><span>{t("common.confirmedWhenOrdering")}</span></div></div>
          <div className="mt-5 flex items-end justify-between"><span className="font-serif text-2xl">{t("common.productTotal")}</span><span className="font-serif text-3xl text-yara-wine">{country && formatPrice(total, country)}</span></div>
          {error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={submitting || !hasLiveCatalogItems} className="btn-primary mt-7 w-full disabled:opacity-50">{submitting ? t("checkout.preparing") : t("checkout.confirm")} <ArrowRight className="h-4 w-4" /></button>
          <button type="button" onClick={handleWhatsAppOrder} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#20a852] px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#168a43]"><MessageCircle className="h-4 w-4" /> {t("common.orderOnWhatsApp")}</button>
          <div className="mt-6 flex justify-center gap-6 text-yara-taupe"><ShieldCheck className="h-5 w-5" /><LockKeyhole className="h-5 w-5" /><MessageCircle className="h-5 w-5" /></div>
          <p className="mt-3 text-center text-[0.58rem] uppercase tracking-[0.1em] text-yara-taupe">{t("checkout.encrypted")}</p>
        </aside>
      </form>
    </div>
  );
}
