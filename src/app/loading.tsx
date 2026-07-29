export default function Loading() {
  return (
    <main
      className="grid min-h-dvh place-items-center bg-yara-ivory p-6 text-center"
      aria-live="polite"
      aria-busy="true"
    >
      <div>
        <p className="font-serif text-3xl tracking-[0.22em] text-yara-wine">
          YARA
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-yara-taupe">
          Preparing your experience…
        </p>
      </div>
    </main>
  );
}
