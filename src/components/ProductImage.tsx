"use client";

import Image from "next/image";

export function ProductImage({ src, alt, sizes, className, width, height, fill = false, priority = false, onLoad, onError }: {
  src: string; alt: string; sizes?: string; className?: string; width?: number; height?: number; fill?: boolean; priority?: boolean; onLoad?: () => void; onError?: () => void;
}) {
  return fill ? <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} onLoad={onLoad} onError={onError} /> : <Image src={src} alt={alt} width={width ?? 800} height={height ?? 800} sizes={sizes} className={className} priority={priority} onLoad={onLoad} onError={onError} />;
}
