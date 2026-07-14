import { ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ReviewImage = { id: string; image_url: string };
type Review = { id: string; customer_name: string; rating: number; description: string; product_review_images: ReviewImage[] };

function Stars({ value, label }: { value: number; label?: string }) {
  return <span className="flex text-yara-gold" aria-label={label ?? `${value} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < value ? "fill-current" : "text-yara-rose"}`} />)}</span>;
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: ReviewImage[]; index: number } | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/storefront/reviews/${productId}`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("Review request failed")))
      .then((payload) => setReviews(payload.reviews as Review[]))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true); });
    return () => controller.abort();
  }, [productId]);
  const summary = useMemo(() => {
    if (!reviews?.length) return null;
    const counts = [5, 4, 3, 2, 1].map((rating) => reviews.filter((review) => review.rating === rating).length);
    return { average: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length, counts };
  }, [reviews]);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowLeft") setLightbox((current) => current && { ...current, index: (current.index - 1 + current.images.length) % current.images.length });
      if (event.key === "ArrowRight") setLightbox((current) => current && { ...current, index: (current.index + 1) % current.images.length });
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);
  if (failed) return <section className="mt-16 border-t border-yara-rose py-14"><h2 className="text-3xl">Customer Reviews</h2><p className="mt-4 text-sm text-yara-taupe">Reviews are temporarily unavailable.</p></section>;
  if (!reviews) return <section className="mt-16 border-t border-yara-rose py-14" aria-busy="true"><p className="eyebrow">Customer stories</p><h2 className="mt-3 text-3xl">Customer Reviews</h2></section>;
  return <section className="mt-16 border-t border-yara-rose py-14 sm:mt-20" aria-labelledby="customer-reviews">
    <p className="eyebrow">Customer stories</p><h2 id="customer-reviews" className="mt-3 text-3xl sm:text-4xl">Customer Reviews</h2>
    {!summary ? <p className="mt-6 text-sm text-yara-taupe">No customer reviews have been added yet.</p> : <>
      <div className="mt-8 grid gap-6 rounded-[2rem] bg-white p-6 shadow-card sm:grid-cols-[190px_1fr] sm:p-8">
        <div><p className="font-serif text-5xl text-yara-wine">{summary.average.toFixed(1)}</p><p className="mt-1 text-sm text-yara-taupe">out of 5</p><div className="mt-3"><Stars value={Math.round(summary.average)} label={`${summary.average.toFixed(1)} out of 5 stars`} /></div><p className="mt-3 text-sm text-yara-taupe">Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}</p></div>
        <div className="space-y-2.5">{summary.counts.map((count, index) => { const rating = 5 - index; return <div key={rating} className="grid grid-cols-[52px_1fr_28px] items-center gap-3 text-xs text-yara-taupe"><span>{rating} stars</span><span className="h-2 overflow-hidden rounded-full bg-yara-rose"><span className="block h-full rounded-full bg-yara-gold" style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} /></span><span>{count}</span></div>; })}</div>
      </div>
      <div className="mt-8 grid gap-5">{reviews.map((review) => <article key={review.id} className="rounded-[1.8rem] bg-white p-5 shadow-card sm:p-7"><h3 className="font-serif text-2xl">{review.customer_name}</h3><div className="mt-3"><Stars value={review.rating} /></div><p className="mt-4 max-w-3xl text-sm leading-7 text-yara-taupe">{review.description}</p><div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">{review.product_review_images.map((image, index) => <button key={image.id} type="button" onClick={() => setLightbox({ images: review.product_review_images, index })} className="group aspect-square overflow-hidden rounded-xl bg-yara-rose" aria-label={`Open review photo ${index + 1} from ${review.customer_name}`}><img src={image.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></button>)}</div></article>)}</div>
    </>}
    {lightbox && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Review image gallery" onClick={() => setLightbox(null)}><div className="relative flex h-full w-full max-w-6xl items-center justify-center" onClick={(event) => event.stopPropagation()} onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => { const end = event.changedTouches[0]?.clientX; if (touchStart === null || end === undefined || Math.abs(end - touchStart) < 45) return; setLightbox((current) => current && { ...current, index: end < touchStart ? (current.index + 1) % current.images.length : (current.index - 1 + current.images.length) % current.images.length }); setTouchStart(null); }}><img src={lightbox.images[lightbox.index].image_url} alt={`Review photo ${lightbox.index + 1}`} className="max-h-full max-w-full rounded-xl object-contain" /><button className="absolute right-0 top-0 grid min-h-11 min-w-11 place-items-center rounded-full bg-white/15 text-white" onClick={() => setLightbox(null)} aria-label="Close gallery"><X /></button><button className="absolute left-0 grid min-h-11 min-w-11 place-items-center rounded-full bg-white/15 text-white" onClick={() => setLightbox((current) => current && { ...current, index: (current.index - 1 + current.images.length) % current.images.length })} aria-label="Previous image"><ChevronLeft /></button><button className="absolute right-0 grid min-h-11 min-w-11 place-items-center rounded-full bg-white/15 text-white" onClick={() => setLightbox((current) => current && { ...current, index: (current.index + 1) % current.images.length })} aria-label="Next image"><ChevronRight /></button><span className="absolute bottom-1 rounded-full bg-black/50 px-3 py-1 text-xs text-white">{lightbox.index + 1} / {lightbox.images.length}</span></div></div>}
  </section>;
}
