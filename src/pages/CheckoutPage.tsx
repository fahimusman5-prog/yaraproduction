import { ArrowRight, Banknote, CheckCircle2, CreditCard, LockKeyhole, MessageCircle, ShieldCheck, Truck, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";

type PaymentMethod = "card" | "cod";

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedTotal, setPlacedTotal] = useState(0);
  const shipping = subtotal >= 75 ? 0 : 8;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPlacedTotal(total);
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="page-shell py-24 text-center sm:py-36">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#e4f8eb]"><CheckCircle2 className="h-11 w-11 text-[#168a43]" /></div>
        <p className="eyebrow mt-8">Order confirmed</p><h1 className="mt-3 text-balance text-4xl sm:text-6xl">Your YARA ritual is on its way.</h1><p className="mx-auto mt-5 max-w-lg text-sm font-light leading-7 text-yara-taupe">Thank you for your order of {formatPrice(placedTotal)}. A confirmation summary will be shared using the contact details you provided.</p><Link to="/shop" className="btn-primary mt-8">Continue exploring <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  if (!items.length) {
    return <div className="page-shell py-28 text-center"><p className="eyebrow">Nothing to check out yet</p><h1 className="mt-4 text-5xl">Your ritual starts in the shop.</h1><Link to="/shop" className="btn-primary mt-8">Browse rituals</Link></div>;
  }

  return (
    <div className="page-shell py-12 sm:py-20">
      <p className="eyebrow">Protected & private</p><h1 className="mt-3 text-4xl sm:text-5xl">Secure Checkout</h1><p className="mt-3 text-sm font-light text-yara-taupe">Completing your self-care journey</p>
      <form onSubmit={handleSubmit} className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_390px] xl:gap-10">
        <div className="space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-2xl sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-full bg-yara-rose text-yara-wine"><UserRound className="h-4 w-4" /></span> Contact Information</h2>
            <label className="mt-7 block"><span className="field-label">Email address</span><input type="email" name="email" required autoComplete="email" placeholder="you@example.com" className="field" /></label>
            <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-yara-taupe"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-yara-wine" /> Keep me updated with exclusive rituals and offers</label>
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
              <label className={`block cursor-pointer rounded-[1.7rem] border p-5 transition ${payment === "card" ? "border-yara-wine bg-yara-blush" : "border-yara-rose"}`}>
                <span className="flex items-center gap-3 text-sm"><input type="radio" name="payment" checked={payment === "card"} onChange={() => setPayment("card")} className="accent-yara-wine" /><CreditCard className="h-4 w-4 text-yara-wine" /> Credit / debit card</span>
                {payment === "card" && <span className="mt-5 grid gap-3 sm:grid-cols-2"><input required placeholder="Card number" inputMode="numeric" autoComplete="cc-number" className="field sm:col-span-2" /><input required placeholder="MM / YY" autoComplete="cc-exp" className="field" /><input required placeholder="CVV" inputMode="numeric" autoComplete="cc-csc" className="field" /></span>}
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-full border p-5 text-sm transition ${payment === "cod" ? "border-yara-wine bg-yara-blush" : "border-yara-rose"}`}><input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} className="accent-yara-wine" /><Banknote className="h-4 w-4 text-yara-wine" /> Cash on delivery</label>
            </div>
          </section>
        </div>

        <aside className="surface-card p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="text-3xl">Order Summary</h2>
          <div className="mt-6 space-y-5">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3"><img src={product.image} alt="" className="h-16 w-16 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium uppercase tracking-[0.07em]">{product.name}</p><p className="mt-1 text-xs text-yara-taupe">{product.size} · Qty: {quantity}</p></div><span className="text-sm text-yara-wine">{formatPrice(product.price * quantity)}</span></div>
            ))}
          </div>
          <div className="mt-6 border-y border-yara-rose py-5 text-sm"><div className="flex justify-between py-1.5"><span className="text-yara-taupe">Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between py-1.5"><span className="text-yara-taupe">Shipping</span><span>{shipping ? formatPrice(shipping) : "Complimentary"}</span></div><div className="flex justify-between py-1.5"><span className="text-yara-taupe">Tax</span><span>{formatPrice(tax)}</span></div></div>
          <div className="mt-5 flex items-end justify-between"><span className="font-serif text-2xl">Total</span><span className="font-serif text-3xl text-yara-wine">{formatPrice(total)}</span></div>
          <button type="submit" className="btn-primary mt-7 w-full">Confirm order <ArrowRight className="h-4 w-4" /></button>
          <div className="mt-6 flex justify-center gap-6 text-yara-taupe"><ShieldCheck className="h-5 w-5" /><LockKeyhole className="h-5 w-5" /><MessageCircle className="h-5 w-5" /></div>
          <p className="mt-3 text-center text-[0.58rem] uppercase tracking-[0.1em] text-yara-taupe">Encrypted checkout · Order support</p>
        </aside>
      </form>
    </div>
  );
}
