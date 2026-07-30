import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-yara-ivory p-6 text-center text-yara-charcoal">
      <section className="surface-card w-full max-w-xl p-8 sm:p-12">
        <p className="eyebrow">YARA · 404</p>
        <h1 className="mt-4 text-4xl text-yara-wine">
          This page has slipped away.
        </h1>
        <p className="mt-5 text-sm leading-7 text-yara-taupe">
          The page may have moved, but your YARA skincare journey can continue
          from our collection.
        </p>
        <Link href="/shop" className="btn-primary mt-8">
          Explore YARA
        </Link>
      </section>
    </main>
  );
}
