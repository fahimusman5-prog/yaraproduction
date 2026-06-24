import Link from "next/link";

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string; cod?: string }> }) {
  const { order, cod } = await searchParams;
  return <main className="grid min-h-dvh place-items-center bg-yara-ivory p-6 text-center text-yara-charcoal"><section className="surface-card max-w-xl p-8 sm:p-12"><p className="eyebrow">Order received</p><h1 className="mt-4 text-4xl text-yara-wine">Thank you for your order.</h1><p className="mt-5 text-sm leading-7 text-yara-taupe">{cod ? "Your cash-on-delivery order is confirmed." : "PayHere is confirming your payment. Your order may remain pending briefly while the secure notification arrives."}</p>{order && <p className="mt-4 break-all text-xs text-yara-taupe">Reference: {order}</p>}<Link href="/shop" className="btn-primary mt-8">Continue shopping</Link></section></main>;
}
