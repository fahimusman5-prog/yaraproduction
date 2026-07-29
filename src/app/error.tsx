"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-yara-ivory p-6 text-center text-yara-charcoal">
      <section className="surface-card w-full max-w-xl p-8 sm:p-12">
        <p className="eyebrow">YARA support</p>
        <h1 className="mt-4 text-4xl text-yara-wine">
          We couldn’t complete that request.
        </h1>
        <p className="mt-5 text-sm leading-7 text-yara-taupe">
          Please try again. Your cart and payment details have not been
          submitted from this screen.
        </p>
        <button type="button" onClick={reset} className="btn-primary mt-8">
          Try again
        </button>
      </section>
    </main>
  );
}
