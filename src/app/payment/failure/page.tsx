import Link from "next/link";

export default function PaymentFailurePage() {
  return <main className="grid min-h-dvh place-items-center bg-yara-ivory p-6 text-center text-yara-charcoal"><section className="surface-card max-w-xl p-8 sm:p-12"><p className="eyebrow">Payment incomplete</p><h1 className="mt-4 text-4xl text-yara-wine">Your payment was not completed.</h1><p className="mt-5 text-sm leading-7 text-yara-taupe">No successful payment has been recorded. You can return to checkout and try again.</p><Link href="/checkout" className="btn-primary mt-8">Return to checkout</Link></section></main>;
}
