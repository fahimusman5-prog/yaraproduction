"use client";

import Image from "next/image";
import { useState } from "react";
import { nextProductImageAttempt, PRODUCT_IMAGE_PLACEHOLDER, resolveProductImage } from "../lib/product-image-source";

type ProductImageProps = {
  src: string | null | undefined; alt: string; sizes?: string; className?: string; width?: number; height?: number; fill?: boolean; priority?: boolean; onLoad?: () => void; onError?: () => void;
};

export function ProductImage(props: ProductImageProps) {
  const source = resolveProductImage(props.src) ?? PRODUCT_IMAGE_PLACEHOLDER;
  // Reset recovery when a gallery selection or catalog refresh changes the source.
  return <ProductImageAttempt key={source} {...props} source={source} />;
}

function ProductImageAttempt({ source, alt, sizes, className, width, height, fill = false, priority = false, onLoad, onError }: ProductImageProps & { source: string }) {
  const [attempt, setAttempt] = useState(0);
  const remote = source.startsWith("https://");
  const placeholder = source === PRODUCT_IMAGE_PLACEHOLDER || attempt === (remote ? 2 : 1);
  const src = placeholder ? PRODUCT_IMAGE_PLACEHOLDER : source;
  const handleError = () => {
    const next = nextProductImageAttempt(source, attempt);
    if (next === attempt) return; // Never retry a failing placeholder.
    if (process.env.NODE_ENV === "development") {
      console.warn("Product image load failed", { alt, source, attempt: attempt === 0 ? "optimized" : "direct", next: next === 2 || !remote ? "placeholder" : "direct" });
    }
    setAttempt(next);
    // Callers must not replace the source before the direct-source retry finishes.
    if (next === (remote ? 2 : 1)) onError?.();
  };
  const props = { src, alt, sizes, className, priority, onLoad, onError: handleError, unoptimized: placeholder || attempt > 0 };
  return fill ? <Image {...props} fill /> : <Image {...props} width={width ?? 800} height={height ?? 800} />;
}
