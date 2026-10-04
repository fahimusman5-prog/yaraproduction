export const PRODUCT_IMAGE_PLACEHOLDER = "/images/yara-product-placeholder.svg";

// Match the hosts supported by next.config.ts. Never turn arbitrary text into a URL.
export function resolveProductImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const source = value.trim();
  if (/^\/(?!\/)[^\s\\]+$/.test(source)) return source;
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const storage = /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
      && url.pathname.startsWith("/storage/v1/object/public/");
    return storage || url.hostname === "lh3.googleusercontent.com" ? url.href : null;
  } catch {
    return null;
  }
}

export function nextProductImageAttempt(source: string, attempt: number): number {
  // Local assets do not depend on the remote optimizer; the placeholder is terminal.
  if (source === PRODUCT_IMAGE_PLACEHOLDER) return attempt;
  return Math.min(attempt + 1, source.startsWith("https://") ? 2 : 1);
}
