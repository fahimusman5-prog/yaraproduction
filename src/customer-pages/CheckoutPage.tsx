import { ArrowRight, Banknote, CreditCard, LoaderCircle, LockKeyhole, MessageCircle, ShieldCheck, Truck, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { cartOrderMessage, createWhatsAppLink, formatPrice } from "../lib/format";
import { RegionalProductPrice } from "../components/RegionalProductPrice";
import { useCountry } from "../context/CountryContext";
import { useI18n } from "../i18n";
import { localizeProduct } from "../lib/storefront-localization";
import { calculateCartShipping, shippingLabel } from "../lib/shipping";
import { getSupabaseBrowserClient } from "../lib/supabase/browser";

type PaymentMethod = "payhere" | "cod";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type SavedAddress = { id: string; label: string; recipient_name: string; phone: string; address: string; address_line_2: string; city: string; postal_code: string; country: "sri-lanka" | "uae"; is_default: boolean };

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { country } = useCountry();
  const { locale, t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());
  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
  const [payment, setPayment] = useState<PaymentMethod>(paymentsEnabled ? "payhere" : "cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const shipping = country ? calculateCartShipping(items, country) : null;
  const total = subtotal + (shipping?.total ?? 0);
  const hasLiveCatalogItems = items.every(({ product }) => uuidPattern.test(product.id));

  useEffect(() => {
    const draft = sessionStorage.getItem("yara-checkout-policy-draft");
    if (!draft || !formRef.current) return;
    try {
      const values = JSON.parse(draft) as Record<string, string>;
      for (const [name, value] of Object.entries(values)) {
        const field = formRef.current.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
        if (field && name !== "payment") field.value = value;
      }
      if (values.payment === "payhere" || values.payment === "cod") setPayment(values.payment);
    } catch {
      // Ignore a malformed browser-session draft.
    } finally {
      sessionStorage.removeItem("yara-checkout-policy-draft");
    }
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    client.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) return;
      const { data: addresses } = await client.from("customer_addresses").select("id,label,recipient_name,phone,address,address_line_2,city,postal_code,country,is_default").eq("user_id", data.user.id).order("is_default", { ascending: false });
      setSavedAddresses((addresses ?? []) as SavedAddress[]);
    });
  }, []);

  const useSavedAddress = (id: string) => {
    const address = savedAddresses.find((item) => item.id === id);
    if (!address || !formRef.current) return;
    const [firstName, ...lastName] = address.recipient_name.split(/\s+/);
    const values: Record<string, string> = {
      firstName,
      lastName: lastName.join(" "),
      address: [address.address, address.address_line_2].filter(Boolean).join(", "),
      city: address.city,
      postalCode: address.postal_code,
      phone: address.phone,
    };
    for (const [name, value] of Object.entries(values)) {
      const field = formRef.current.elements.namedItem(name) as HTMLInputElement | null;
      if (field) field.value = value;
    }
  };

  const preserveCheckoutDraft = () => {
    if (!formRef.current) return;
    const values = Object.fromEntries(new FormData(formRef.current).entries());
    sessionStorage.setItem("yara-checkout-policy-draft", JSON.stringify(values));
  };

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
        country, paymentMethod: payment, termsAccepted: data.get("termsAccepted") === "on", idempotencyKey: idempotencyKeyRef.current,
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
            {savedAddresses.some((address) => address.country === country) && <label className="mt-6 block"><span className="field-label">Saved address</span><select className="field" defaultValue="" onChange={(event) => useSavedAddress(event.target.value)}><option value="">Enter a new address</option>{savedAddresses.filter((address) => address.country === country).map((address) => <option key={address.id} value={address.id}>{address.label}{address.is_default ? " — Default" : ""}</option>)}</select></label>}
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
              <label className={`block rounded-[1.7rem] border p-5 transition ${paymentsEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-70"} ${payment === "payhere" ? "border-yara-wine bg-yara-blush" : "border-yara-rose"}`}>
                <span className="flex items-center gap-3 text-sm"><input type="radio" name="payment" checked={payment === "payhere"} onChange={() => setPayment("payhere")} disabled={!paymentsEnabled} className="accent-yara-wine" /><CreditCard className="h-4 w-4 text-yara-wine" /> {t("checkout.payhere")}</span>
                <span className="mt-3 block text-xs leading-5 text-yara-taupe">{paymentsEnabled ? t("checkout.payhereCopy") : "Online payments are temporarily unavailable while the payment provider is being activated."}</span>
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
              <div key={product.id} className="flex gap-3"><img src={product.image} alt="" className="h-16 w-16 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium uppercase tracking-[0.07em]">{displayProduct.name}</p><p className="mt-1 text-xs text-yara-taupe">{product.size} · {t("common.quantity")}: {quantity}</p>{country && <p className="mt-1 text-[0.68rem] text-yara-taupe">{shippingLabel(product, country, (amount) => formatPrice(amount, country))}</p>}</div><RegionalProductPrice product={product} country={country} quantity={quantity} className="flex shrink-0 flex-col items-end" sellingClassName="text-sm leading-tight text-yara-wine" originalClassName="mt-0.5 text-[0.68rem] leading-tight text-yara-taupe" /></div>
            );})}
          </div>
          <div className="mt-6 border-y border-yara-rose py-5 text-sm"><div className="flex justify-between py-1.5"><span className="text-yara-taupe">{t("common.subtotal")}</span><span>{country && formatPrice(subtotal, country)}</span></div><div className="flex justify-between py-1.5"><span className="text-yara-taupe">{t("common.shipping")}</span><span>{country && shipping?.valid ? (shipping.total === 0 ? "Free Delivery" : formatPrice(shipping.total, country)) : "Rate unavailable"}</span></div></div>
          {shipping && !shipping.valid && <p role="alert" className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">{shipping.unavailable.length ? "One or more products are not available for delivery in this region." : "Delivery has not been configured for one or more products. Please contact YARA before ordering."}</p>}
          <div className="mt-5 flex items-end justify-between"><span className="font-serif text-2xl">{t("common.productTotal")}</span><span className="font-serif text-3xl text-yara-wine">{country && formatPrice(total, country)}</span></div>
          <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-yara-taupe">
            <input type="checkbox" name="termsAccepted" required className="mt-1 h-5 w-5 shrink-0 accent-yara-wine" />
            <span>I agree to the <Link to="/terms-and-conditions" className="font-semibold text-yara-wine underline underline-offset-2">Terms and Conditions</Link>, <Link to="/refund-policy" className="font-semibold text-yara-wine underline underline-offset-2">Returns &amp; Refund Policy</Link>, and <Link to="/shipping-policy" className="font-semibold text-yara-wine underline underline-offset-2">Shipping Policy</Link>.</span>
          </label>
          {error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <p className="mt-5 text-center text-xs leading-5 text-yara-taupe">By placing your order, you agree to YARA’s <Link to="/terms-and-conditions" onClick={preserveCheckoutDraft} className="font-medium text-yara-wine underline underline-offset-2">Terms and Conditions</Link> and acknowledge the <Link to="/privacy-policy" onClick={preserveCheckoutDraft} className="font-medium text-yara-wine underline underline-offset-2">Privacy Policy</Link> and <Link to="/refund-policy" onClick={preserveCheckoutDraft} className="font-medium text-yara-wine underline underline-offset-2">Returns &amp; Refund Policy</Link>.</p>
          <button type="submit" disabled={submitting || !hasLiveCatalogItems || !shipping?.valid} className="btn-primary mt-7 w-full" aria-busy={submitting}>{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}{submitting ? t("checkout.preparing") : t("checkout.confirm")}</button>
          <button type="button" onClick={handleWhatsAppOrder} className="glass-control mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 border-[#20a852]/55 px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#117a3a]"><MessageCircle className="h-4 w-4" /> {t("common.orderOnWhatsApp")}</button>
          <div className="mt-6 flex justify-center gap-6 text-yara-taupe"><ShieldCheck className="h-5 w-5" /><LockKeyhole className="h-5 w-5" /><MessageCircle className="h-5 w-5" /></div>
          <p className="mt-3 text-center text-[0.58rem] uppercase tracking-[0.1em] text-yara-taupe">{t("checkout.encrypted")}</p>
        </aside>
      </form>
    </div>
  );
}
