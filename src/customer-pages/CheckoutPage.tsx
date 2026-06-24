import { ArrowRight, Banknote, CreditCard, LockKeyhole, MessageCircle, ShieldCheck, Truck, UserRound } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { cartOrderMessage, createWhatsAppLink, formatPrice, getProductPrice } from "../lib/format";
import { useCountry } from "../context/CountryContext";

type PaymentMethod = "payhere" | "cod";

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { country } = useCountry();
  const formRef = useRef<HTMLFormElement>(null);
  const [payment, setPayment] = useState<PaymentMethod>("payhere");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const total = subtotal;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!country || submitting) return;
    setSubmitting(true); setError("");
    try {
      const data = new FormData(event.currentTarget);
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        country, paymentMethod: payment,
        customer: { name: `${data.get("firstName") ?? ""} ${data.get("lastName") ?? ""}`.trim(), email: data.get("email"), phone: data.get("phone"), address: data.get("address"), city: data.get("city"), postalCode: data.get("postalCode") },
        items: items.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to place order.");
      clearCart();
      if (result.redirectUrl) { window.location.assign(result.redirectUrl); return; }
      const form = document.createElement("form"); form.method = "POST"; form.action = result.action;
      Object.entries(result.fields as Record<string, string>).forEach(([name, value]) => { const input = document.createElement("input"); input.type = "hidden"; input.name = name; input.value = value; form.appendChild(input); });
      document.body.appendChild(form); form.submit();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to place order."); setSubmitting(false); }
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
    window.open(createWhatsAppLink(cartOrderMessage(items, total, country, customer), country), "_blank", "noopener,noreferrer");
  };

  if (!items.length) {
    return <div className="page-shell py-28 text-center"><p className="eyebrow">Nothing to check out yet</p><h1 className="mt-4 text-5xl">Your order starts in the shop.</h1><Link to="/shop" className="btn-primary mt-8">Browse products</Link></div>;
  }

  return (
    <div className="page-shell py-12 sm:py-20">
      <p className="eyebrow">Protected & private</p><h1 className="mt-3 text-4xl sm:text-5xl">Secure Checkout</h1><p className="mt-3 text-sm font-light text-yara-taupe">Completing your self-care journey</p>
      <form ref={formRef} onSubmit={handleSubmit} className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_390px] xl:gap-10">
        <div className="space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-2xl sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-full bg-yara-rose text-yara-wine"><UserRound className="h-4 w-4" /></span> Contact Information</h2>
            <label className="mt-7 block"><span className="field-label">Email address</span><input type="email" name="email" required autoComplete="email" placeholder="you@example.com" className="field" /></label>
            <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-yara-taupe"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-yara-wine" /> Keep me updated with exclusive products and offers</label>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-2xl sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-full bg-yara-rose text-yara-wine"><Truck className="h-4 w-4" /></span> Shipping Address</h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label><span className="field-label">First name</span><input name="firstName" required autoComplete="given-name" className="field" /></label>
              <label><span className="field-label">Last name</span><input name="lastName" required autoComplete="family-name" className="field" /></label>
              <label className="sm:col-span-2"><span className="field-label">Street address</span><input name="address" required autoComplete="street-address" className="field" /></label>
              <label><span className="field-label">City</span><input name="city" required autoComplete="address-level2" className="field" /></label>
              <label><span className="field-label">Postal code</span><input name="postalCode" required autoComplete="postal-code" className="field" /></label>
              <label className="sm:col-span-2"><span className="field-label">Phone number</span><input type="tel" name="phone" required autoComplete="tel" className="field" /></label>
            </div>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-2xl sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-full bg-yara-rose text-yara-wine"><CreditCard className="h-4 w-4" /></span> Payment Method</h2>
            <div className="mt-7 space-y-3">
              <label className={`block cursor-pointer rounded-[1.7rem] border p-5 transition ${payment === "payhere" ? "border-yara-wine bg-yara-blush" : "border-yara-rose"}`}>
                <span className="flex items-center gap-3 text-sm"><input type="radio" name="payment" checked={payment === "payhere"} onChange={() => setPayment("payhere")} className="accent-yara-wine" /><CreditCard className="h-4 w-4 text-yara-wine" /> Pay securely with PayHere</span>
                {payment === "payhere" && <span className="mt-3 block text-xs leading-5 text-yara-taupe">Card details are entered only on PayHere&apos;s secure hosted checkout.</span>}
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-full border p-5 text-sm transition ${payment === "cod" ? "border-yara-wine bg-yara-blush" : "border-yara-rose"}`}><input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} className="accent-yara-wine" /><Banknote className="h-4 w-4 text-yara-wine" /> Cash on delivery</label>
            </div>
          </section>
        </div>

        <aside className="surface-card p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="text-3xl">Order Summary</h2>
          <div className="mt-6 space-y-5">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3"><img src={product.image} alt="" className="h-16 w-16 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium uppercase tracking-[0.07em]">{product.name}</p><p className="mt-1 text-xs text-yara-taupe">{product.size} · Qty: {quantity}</p></div><span className="text-sm text-yara-wine">{country && formatPrice(getProductPrice(product, country) * quantity, country)}</span></div>
            ))}
          </div>
          <div className="mt-6 border-y border-yara-rose py-5 text-sm"><div className="flex justify-between py-1.5"><span className="text-yara-taupe">Subtotal</span><span>{country && formatPrice(subtotal, country)}</span></div><div className="flex justify-between py-1.5"><span className="text-yara-taupe">Shipping</span><span>Confirmed when ordering</span></div></div>
          <div className="mt-5 flex items-end justify-between"><span className="font-serif text-2xl">Product total</span><span className="font-serif text-3xl text-yara-wine">{country && formatPrice(total, country)}</span></div>
          {error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary mt-7 w-full disabled:opacity-50">{submitting ? "Preparing secure checkout…" : "Confirm order"} <ArrowRight className="h-4 w-4" /></button>
          <button type="button" onClick={handleWhatsAppOrder} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#20a852] px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#168a43]"><MessageCircle className="h-4 w-4" /> Order on WhatsApp</button>
          <div className="mt-6 flex justify-center gap-6 text-yara-taupe"><ShieldCheck className="h-5 w-5" /><LockKeyhole className="h-5 w-5" /><MessageCircle className="h-5 w-5" /></div>
          <p className="mt-3 text-center text-[0.58rem] uppercase tracking-[0.1em] text-yara-taupe">Encrypted checkout · Order support</p>
        </aside>
      </form>
    </div>
  );
}
